from __future__ import annotations

import os
from contextlib import asynccontextmanager
from datetime import date, date as CalendarDate, time
from typing import Generator

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy import Boolean, Date, Float, ForeignKey, Integer, String, Time, create_engine, select, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker


load_dotenv()


def sqlalchemy_url(raw_url: str) -> str:
    """Use SQLAlchemy's Psycopg 3 driver while accepting a normal PostgreSQL URI."""
    if raw_url.startswith("postgresql://"):
        return raw_url.replace("postgresql://", "postgresql+psycopg://", 1)
    if raw_url.startswith("postgres://"):
        return raw_url.replace("postgres://", "postgresql+psycopg://", 1)
    return raw_url


db_uri = os.environ.get("DB_URI")
if not db_uri:
    raise RuntimeError("DB_URI is required. Add it to the project's .env file.")

engine = create_engine(sqlalchemy_url(db_uri), pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Subject(Base):
    __tablename__ = "planner_subjects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), unique=True)
    classes: Mapped[list[ClassSchedule]] = relationship(back_populates="subject_record")


class ClassSchedule(Base):
    __tablename__ = "planner_classes"

    id: Mapped[int] = mapped_column(primary_key=True)
    subject: Mapped[str] = mapped_column(String(160))
    day: Mapped[str] = mapped_column(String(16))
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    subject_id: Mapped[int | None] = mapped_column(ForeignKey("planner_subjects.id", ondelete="SET NULL"), nullable=True)
    subject_record: Mapped[Subject | None] = relationship(back_populates="classes")
    assessments: Mapped[list[Assessment]] = relationship(
        back_populates="class_schedule", cascade="all, delete-orphan", order_by="Assessment.due_date"
    )
    topics: Mapped[list[Topic]] = relationship(
        back_populates="class_schedule", cascade="all, delete-orphan", order_by="Topic.number"
    )


class Assessment(Base):
    __tablename__ = "planner_assessments"

    id: Mapped[int] = mapped_column(primary_key=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("planner_classes.id", ondelete="CASCADE"))
    due_date: Mapped[date] = mapped_column(Date)
    weight: Mapped[float] = mapped_column(Float)
    topic_start: Mapped[int] = mapped_column(Integer)
    topic_end: Mapped[int] = mapped_column(Integer)
    class_schedule: Mapped[ClassSchedule] = relationship(back_populates="assessments")


class Topic(Base):
    __tablename__ = "planner_topics"

    id: Mapped[int] = mapped_column(primary_key=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("planner_classes.id", ondelete="CASCADE"))
    number: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(240))
    class_schedule: Mapped[ClassSchedule] = relationship(back_populates="topics")


class Club(Base):
    __tablename__ = "planner_clubs"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    has_weekly_meeting: Mapped[bool] = mapped_column(Boolean, default=False)
    day: Mapped[str | None] = mapped_column(String(16), nullable=True)
    start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    events: Mapped[list[Event]] = relationship(back_populates="club")


class Event(Base):
    __tablename__ = "planner_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    club_id: Mapped[int | None] = mapped_column(ForeignKey("planner_clubs.id", ondelete="SET NULL"), nullable=True)
    club: Mapped[Club | None] = relationship(back_populates="events")


class Task(Base):
    __tablename__ = "planner_tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    task_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    recurring_day: Mapped[str | None] = mapped_column(String(16), nullable=True)
    class_id: Mapped[int | None] = mapped_column(ForeignKey("planner_classes.id", ondelete="SET NULL"), nullable=True)
    club_id: Mapped[int | None] = mapped_column(ForeignKey("planner_clubs.id", ondelete="SET NULL"), nullable=True)
    event_id: Mapped[int | None] = mapped_column(ForeignKey("planner_events.id", ondelete="SET NULL"), nullable=True)


class AssessmentInput(BaseModel):
    date: date
    weight: float = Field(ge=0, le=100)
    topicStart: int = Field(ge=1)
    topicEnd: int = Field(ge=1)

    @model_validator(mode="after")
    def validate_topic_range(self) -> "AssessmentInput":
        if self.topicEnd < self.topicStart:
            raise ValueError("topicEnd must be greater than or equal to topicStart")
        return self


class TopicInput(BaseModel):
    number: int = Field(ge=1)
    title: str = Field(min_length=1, max_length=240)


class ClassInput(BaseModel):
    subject: str = Field(min_length=1, max_length=160)
    subjectId: int | None = None
    day: str = Field(min_length=1, max_length=16)
    startTime: time
    endTime: time
    assessments: list[AssessmentInput] = []
    topics: list[TopicInput] = []

    @field_validator("subjectId", mode="before")
    @classmethod
    def blank_subject_is_none(cls, value: object) -> object:
        return None if value == "" else value

    @model_validator(mode="after")
    def validate_times(self) -> "ClassInput":
        if self.endTime <= self.startTime:
            raise ValueError("endTime must be later than startTime")
        return self


class ClubInput(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    hasWeeklyMeeting: bool = False
    day: str | None = None
    startTime: time | None = None
    endTime: time | None = None

    @field_validator("day", "startTime", "endTime", mode="before")
    @classmethod
    def blank_meeting_values_are_none(cls, value: object) -> object:
        return None if value == "" else value

    @model_validator(mode="after")
    def validate_meeting(self) -> "ClubInput":
        if self.hasWeeklyMeeting and (not self.day or not self.startTime or not self.endTime):
            raise ValueError("day, startTime, and endTime are required for a weekly meeting")
        if self.hasWeeklyMeeting and self.endTime <= self.startTime:
            raise ValueError("endTime must be later than startTime")
        return self


class EventInput(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    date: date
    endDate: date | None = None
    startTime: time
    endTime: time
    clubId: int | None = None

    @field_validator("endDate", mode="before")
    @classmethod
    def blank_end_date_is_none(cls, value: object) -> object:
        return None if value == "" else value

    @model_validator(mode="after")
    def validate_event(self) -> "EventInput":
        if self.endDate and self.endDate < self.date:
            raise ValueError("endDate cannot be before date")
        if self.endTime <= self.startTime:
            raise ValueError("endTime must be later than startTime")
        return self


class TaskInput(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    date: CalendarDate | None = None
    startTime: time | None = None
    endTime: time | None = None
    isRecurring: bool = False
    recurringDay: str | None = None
    classId: int | None = None
    clubId: int | None = None
    eventId: int | None = None

    @field_validator("date", "startTime", "endTime", "recurringDay", mode="before")
    @classmethod
    def blank_values_are_none(cls, value: object) -> object:
        return None if value == "" else value

    @model_validator(mode="after")
    def validate_task(self) -> "TaskInput":
        if self.startTime and self.endTime and self.endTime <= self.startTime:
            raise ValueError("endTime must be later than startTime")
        if self.isRecurring and not self.recurringDay:
            raise ValueError("recurringDay is required for a recurring task")
        if sum(link is not None for link in (self.classId, self.clubId, self.eventId)) > 1:
            raise ValueError("A task can be linked to one class, club, or event at a time")
        return self


class SubjectInput(BaseModel):
    name: str = Field(min_length=1, max_length=160)


def get_db() -> Generator[Session, None, None]:
    with SessionLocal() as db:
        yield db


def display_time(value: time | None) -> str | None:
    return value.strftime("%H:%M") if value else None


def display_weight(value: float) -> int | float:
    return int(value) if value.is_integer() else value


def class_payload(item: ClassSchedule) -> dict:
    return {
        "id": item.id,
        "subject": item.subject,
        "subjectId": item.subject_id,
        "subjectName": item.subject_record.name if item.subject_record else "",
        "day": item.day,
        "startTime": display_time(item.start_time),
        "endTime": display_time(item.end_time),
        "assessments": [
            {
                "id": assessment.id,
                "date": assessment.due_date.isoformat(),
                "weight": display_weight(assessment.weight),
                "topicStart": assessment.topic_start,
                "topicEnd": assessment.topic_end,
            }
            for assessment in item.assessments
        ],
        "topics": [{"id": topic.id, "number": topic.number, "title": topic.title} for topic in item.topics],
    }


def club_payload(item: Club) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "hasWeeklyMeeting": item.has_weekly_meeting,
        "day": item.day or "",
        "startTime": display_time(item.start_time) or "",
        "endTime": display_time(item.end_time) or "",
    }


def event_payload(item: Event) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "date": item.start_date.isoformat(),
        "endDate": item.end_date.isoformat() if item.end_date else "",
        "startTime": display_time(item.start_time),
        "endTime": display_time(item.end_time),
        "clubId": item.club_id,
    }


def task_payload(item: Task) -> dict:
    return {
        "id": item.id,
        "title": item.title,
        "date": item.task_date.isoformat() if item.task_date else "",
        "startTime": display_time(item.start_time) or "",
        "endTime": display_time(item.end_time) or "",
        "isRecurring": item.is_recurring,
        "recurringDay": item.recurring_day or "",
        "classId": item.class_id,
        "clubId": item.club_id,
        "eventId": item.event_id,
    }


def subject_payload(item: Subject) -> dict:
    return {"id": item.id, "name": item.name}


def apply_class(item: ClassSchedule, data: ClassInput, db: Session) -> None:
    if data.subjectId is not None and db.get(Subject, data.subjectId) is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="The linked subject was not found")
    item.subject = data.subject.strip()
    item.subject_id = data.subjectId
    item.day = data.day
    item.start_time = data.startTime
    item.end_time = data.endTime
    item.assessments = [
        Assessment(due_date=assessment.date, weight=assessment.weight, topic_start=assessment.topicStart, topic_end=assessment.topicEnd)
        for assessment in data.assessments
    ]
    item.topics = [Topic(number=topic.number, title=topic.title.strip()) for topic in data.topics]


def apply_club(item: Club, data: ClubInput) -> None:
    item.name = data.name.strip()
    item.has_weekly_meeting = data.hasWeeklyMeeting
    item.day = data.day if data.hasWeeklyMeeting else None
    item.start_time = data.startTime if data.hasWeeklyMeeting else None
    item.end_time = data.endTime if data.hasWeeklyMeeting else None


def apply_event(item: Event, data: EventInput, db: Session) -> None:
    if data.clubId is not None and db.get(Club, data.clubId) is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="The linked club was not found")
    item.name = data.name.strip()
    item.start_date = data.date
    item.end_date = data.endDate
    item.start_time = data.startTime
    item.end_time = data.endTime
    item.club_id = data.clubId


def apply_task(item: Task, data: TaskInput, db: Session) -> None:
    targets = ((ClassSchedule, data.classId, "class"), (Club, data.clubId, "club"), (Event, data.eventId, "event"))
    for model, target_id, label in targets:
        if target_id is not None and db.get(model, target_id) is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=f"The linked {label} was not found")
    item.title = data.title.strip()
    item.task_date = data.date
    item.start_time = data.startTime
    item.end_time = data.endTime
    item.is_recurring = data.isRecurring
    item.recurring_day = data.recurringDay if data.isRecurring else None
    item.class_id = data.classId
    item.club_id = data.clubId
    item.event_id = data.eventId


def seed_demo_data(db: Session) -> None:
    if db.scalar(select(ClassSchedule.id).limit(1)) or db.scalar(select(Club.id).limit(1)) or db.scalar(select(Event.id).limit(1)):
        return
    design_subject = Subject(name="Design Research")
    databases_subject = Subject(name="Database Systems")
    db.add_all([design_subject, databases_subject])
    db.flush()
    design = ClassSchedule(subject="Lecture", day="Monday", start_time=time(10), end_time=time(11, 30))
    apply_class(
        design,
        ClassInput(
            subject="Lecture", subjectId=design_subject.id, day="Monday", startTime=time(10), endTime=time(11, 30),
            assessments=[
                AssessmentInput(date=date(2026, 4, 17), weight=30, topicStart=1, topicEnd=3),
                AssessmentInput(date=date(2026, 5, 2), weight=40, topicStart=4, topicEnd=6),
            ],
            topics=[
                TopicInput(number=1, title="Research contexts"), TopicInput(number=2, title="Question framing"),
                TopicInput(number=3, title="Interview planning"), TopicInput(number=4, title="Synthesis methods"),
                TopicInput(number=5, title="Affinity mapping"), TopicInput(number=6, title="Research storytelling"),
            ],
        ), db,
    )
    databases = ClassSchedule(subject="Lecture", day="Tuesday", start_time=time(11), end_time=time(12, 30))
    apply_class(
        databases,
        ClassInput(
            subject="Lecture", subjectId=databases_subject.id, day="Tuesday", startTime=time(11), endTime=time(12, 30),
            assessments=[AssessmentInput(date=date(2026, 4, 18), weight=25, topicStart=1, topicEnd=3)],
            topics=[
                TopicInput(number=1, title="Relational models"), TopicInput(number=2, title="SQL foundations"),
                TopicInput(number=3, title="Data integrity"), TopicInput(number=4, title="Schema design"),
            ],
        ), db,
    )
    debate = Club(name="Debate Society", has_weekly_meeting=True, day="Tuesday", start_time=time(15, 30), end_time=time(17))
    photo = Club(name="Photo Collective", has_weekly_meeting=True, day="Saturday", start_time=time(17, 30), end_time=time(19))
    db.add_all([design, databases, debate, photo])
    db.flush()
    db.add(Event(name="Campus Fest", start_date=date(2026, 4, 18), end_date=None, start_time=time(15, 30), end_time=time(18), club_id=debate.id))
    db.commit()


def backfill_subject_links(db: Session) -> None:
    subjects = {item.name: item for item in db.scalars(select(Subject)).all()}
    changed = False
    for item in db.scalars(select(ClassSchedule).where(ClassSchedule.subject_id.is_(None))).all():
        subject = subjects.get(item.subject)
        if not subject:
            subject = Subject(name=item.subject)
            db.add(subject)
            db.flush()
            subjects[subject.name] = subject
        item.subject_id = subject.id
        changed = True
    if changed:
        db.commit()


def prepare_database() -> None:
    Base.metadata.create_all(engine)
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE planner_classes ADD COLUMN IF NOT EXISTS subject_id INTEGER REFERENCES planner_subjects(id) ON DELETE SET NULL"))
    with SessionLocal() as db:
        backfill_subject_links(db)


@asynccontextmanager
async def lifespan(_: FastAPI):
    prepare_database()
    with SessionLocal() as db:
        seed_demo_data(db)
    yield
    engine.dispose()


app = FastAPI(title="Pace Planner API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://127.0.0.1:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health(db: Session = Depends(get_db)) -> dict:
    db.execute(text("SELECT 1"))
    return {"status": "ok"}


@app.get("/api/subjects")
def list_subjects(db: Session = Depends(get_db)) -> list[dict]:
    return [subject_payload(item) for item in db.scalars(select(Subject).order_by(Subject.name)).all()]


@app.post("/api/subjects", status_code=status.HTTP_201_CREATED)
def create_subject(data: SubjectInput, db: Session = Depends(get_db)) -> dict:
    name = data.name.strip()
    if db.scalar(select(Subject).where(Subject.name == name)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A subject with this name already exists")
    item = Subject(name=name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return subject_payload(item)


@app.put("/api/subjects/{subject_id}")
def update_subject(subject_id: int, data: SubjectInput, db: Session = Depends(get_db)) -> dict:
    item = db.get(Subject, subject_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    name = data.name.strip()
    duplicate = db.scalar(select(Subject).where(Subject.name == name, Subject.id != subject_id))
    if duplicate:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A subject with this name already exists")
    item.name = name
    db.commit()
    db.refresh(item)
    return subject_payload(item)


@app.delete("/api/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(subject_id: int, db: Session = Depends(get_db)) -> Response:
    item = db.get(Subject, subject_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/api/bootstrap")
def bootstrap(db: Session = Depends(get_db)) -> dict:
    subjects = db.scalars(select(Subject).order_by(Subject.name)).all()
    classes = db.scalars(select(ClassSchedule).order_by(ClassSchedule.day, ClassSchedule.start_time)).unique().all()
    clubs = db.scalars(select(Club).order_by(Club.name)).all()
    events = db.scalars(select(Event).order_by(Event.start_date, Event.start_time)).all()
    tasks = db.scalars(select(Task).order_by(Task.task_date, Task.start_time, Task.title)).all()
    return {"subjects": [subject_payload(item) for item in subjects], "classes": [class_payload(item) for item in classes], "clubs": [club_payload(item) for item in clubs], "events": [event_payload(item) for item in events], "tasks": [task_payload(item) for item in tasks]}


@app.get("/api/classes")
def list_classes(db: Session = Depends(get_db)) -> list[dict]:
    return [class_payload(item) for item in db.scalars(select(ClassSchedule).order_by(ClassSchedule.day, ClassSchedule.start_time)).unique().all()]


@app.post("/api/classes", status_code=status.HTTP_201_CREATED)
def create_class(data: ClassInput, db: Session = Depends(get_db)) -> dict:
    item = ClassSchedule(subject=data.subject.strip(), day=data.day, start_time=data.startTime, end_time=data.endTime)
    apply_class(item, data, db)
    db.add(item)
    db.commit()
    db.refresh(item)
    return class_payload(item)


@app.put("/api/classes/{class_id}")
def update_class(class_id: int, data: ClassInput, db: Session = Depends(get_db)) -> dict:
    item = db.get(ClassSchedule, class_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    apply_class(item, data, db)
    db.commit()
    db.refresh(item)
    return class_payload(item)


@app.delete("/api/classes/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class(class_id: int, db: Session = Depends(get_db)) -> Response:
    item = db.get(ClassSchedule, class_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/api/clubs")
def list_clubs(db: Session = Depends(get_db)) -> list[dict]:
    return [club_payload(item) for item in db.scalars(select(Club).order_by(Club.name)).all()]


@app.post("/api/clubs", status_code=status.HTTP_201_CREATED)
def create_club(data: ClubInput, db: Session = Depends(get_db)) -> dict:
    item = Club(name=data.name.strip(), has_weekly_meeting=data.hasWeeklyMeeting)
    apply_club(item, data)
    db.add(item)
    db.commit()
    db.refresh(item)
    return club_payload(item)


@app.put("/api/clubs/{club_id}")
def update_club(club_id: int, data: ClubInput, db: Session = Depends(get_db)) -> dict:
    item = db.get(Club, club_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Club not found")
    apply_club(item, data)
    db.commit()
    db.refresh(item)
    return club_payload(item)


@app.delete("/api/clubs/{club_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_club(club_id: int, db: Session = Depends(get_db)) -> Response:
    item = db.get(Club, club_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Club not found")
    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/api/events")
def list_events(db: Session = Depends(get_db)) -> list[dict]:
    return [event_payload(item) for item in db.scalars(select(Event).order_by(Event.start_date, Event.start_time)).all()]


@app.post("/api/events", status_code=status.HTTP_201_CREATED)
def create_event(data: EventInput, db: Session = Depends(get_db)) -> dict:
    item = Event(name=data.name.strip(), start_date=data.date, start_time=data.startTime, end_time=data.endTime)
    apply_event(item, data, db)
    db.add(item)
    db.commit()
    db.refresh(item)
    return event_payload(item)


@app.put("/api/events/{event_id}")
def update_event(event_id: int, data: EventInput, db: Session = Depends(get_db)) -> dict:
    item = db.get(Event, event_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    apply_event(item, data, db)
    db.commit()
    db.refresh(item)
    return event_payload(item)


@app.delete("/api/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int, db: Session = Depends(get_db)) -> Response:
    item = db.get(Event, event_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/api/tasks")
def list_tasks(db: Session = Depends(get_db)) -> list[dict]:
    return [task_payload(item) for item in db.scalars(select(Task).order_by(Task.task_date, Task.start_time, Task.title)).all()]


@app.post("/api/tasks", status_code=status.HTTP_201_CREATED)
def create_task(data: TaskInput, db: Session = Depends(get_db)) -> dict:
    item = Task(title=data.title.strip())
    apply_task(item, data, db)
    db.add(item)
    db.commit()
    db.refresh(item)
    return task_payload(item)


@app.put("/api/tasks/{task_id}")
def update_task(task_id: int, data: TaskInput, db: Session = Depends(get_db)) -> dict:
    item = db.get(Task, task_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    apply_task(item, data, db)
    db.commit()
    db.refresh(item)
    return task_payload(item)


@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)) -> Response:
    item = db.get(Task, task_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
