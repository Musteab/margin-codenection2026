# Pace planner

Pace is a study-planning UI backed by FastAPI and PostgreSQL. Subjects, class sessions, assessments, topics, clubs, events, and tasks are stored through the API; no sign-in is required for this local version.

## Run locally

1. Add a PostgreSQL connection string as `DB_URI` in `.env`.
2. Install the backend environment:

   ```sh
   uv sync
   ```

3. Start the API in one terminal:

   ```sh
   uv run uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
   ```

4. Start the React app in another terminal:

   ```sh
   pnpm dev
   ```

Open `http://localhost:5173`. Vite proxies `/api` requests to FastAPI during development.

On first startup, the API creates its `planner_*` tables and adds a small set of starter records only when the planner is empty.

## API

- `GET /api/bootstrap` loads all planner data.
- `GET`, `POST`, `PUT`, and `DELETE` are available for `/api/subjects`, `/api/classes`, `/api/clubs`, `/api/events`, and `/api/tasks`.
- `GET /api/health` verifies API and database connectivity.

The interactive API documentation is at `http://127.0.0.1:8000/docs` while the backend is running.

## Class TXT import

The Classes tab in Edit plan accepts a `.txt` file containing one or more class-session blocks. Each block has a subject, a session name (such as `Lecture` or `Practical`), a weekday, times, and its topics. Separate blocks with `---`.

```text
Subject: Data Structures and Algorithms
Class: Lecture
Day: Monday
Start: 09:00
End: 10:30
Topics:
1 | Arrays and algorithm analysis
2 | Linked lists and stacks
```

See [public/mock-subjects.txt](public/mock-subjects.txt) for a ready-to-import example with two subjects, including both a lecture and practical session for one subject.
