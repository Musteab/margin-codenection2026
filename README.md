# Pace by [Team Name]

- **Team:** [Member 1], [Member 2], [Member 3], [Member 4]
- **Problem Statement:** Lifestyle Track — Beating the Burnout: Stress & Workload Manager
- **Video Presentation:** [Unlisted YouTube link]
- **Presentation Slides:** [Public link]

> Replace the bracketed team, mentor, prototype, and presentation details with the final information before submission.

## 1. Project Overview

### The Problem

University students rarely burn out because of one isolated assignment. Academic deadlines, classes, part-time shifts, club responsibilities, errands, social plans, travel, and basic recovery all compete for the same limited time and energy. These commitments are commonly scattered across learning portals, calendars, group chats, rosters, and personal notes, so students cannot easily see their total load or identify which part of life is becoming unsustainable.

The primary stakeholders are university students, especially those balancing study with work or extracurricular commitments. Secondary stakeholders include teammates, club committees, employers, lecturers, friends, and family because a student's overloaded schedule often affects shared responsibilities and relationships.

Tools such as **Google Calendar** are useful for showing when events happen, but they do not represent the preparation, effort, or recovery associated with those events. Automated planners such as **Motion** can rearrange tasks, but their productivity-first approach is not designed around student life, transparent workload trade-offs, or protecting recovery. A full calendar can therefore still look manageable even when the student carrying it is not.

### Our Solution

**Pace** is a mobile-friendly planning companion that brings a student's classes, assessments, clubs, events, tasks, and study routine into one understandable weekly view. Rather than treating every commitment as an interchangeable calendar block, Pace is designed to show where demand comes from, detect when planned work no longer fits, and present practical ways to rebalance it. The student stays in control: changes are explained, reviewed, and approved instead of being applied silently. The current prototype establishes the planning foundation; the next build phase adds the multi-dimensional load and recovery layer described below.

#### Current prototype

- **Unified weekly calendar** for classes, club meetings, events, tasks, and study sessions.
- **Study pace breakdown** that converts assessment topic ranges and due dates into manageable weekly targets.
- **Daily study routine** with a chosen duration, time, subject, and topic.
- **Conflict-aware adjustments** that let students move or skip a study session and prevent conflicting replacements.
- **Commitment editor** for subjects, classes, assessments, topics, clubs, events, and one-off or recurring tasks.
- **Class TXT import** to reduce repetitive timetable setup.
- **Responsive navigation and accessible feedback**, including semantic controls, visible validation errors, and status messages.

#### Planned build-phase features

- **Capacity snapshot:** an explainable weekly figure based on required hours versus genuinely available hours—not a medical burnout score.
- **Load-by-dimension view:** editable mental, physical, social, and administrative demand alongside time demand.
- **Rebalance proposals:** compare moving, splitting, batching, postponing, or requesting help, with the effect of each option shown before approval.
- **Recovery protection:** reserve sleep, meals, exercise, downtime, or social connection as real planning constraints rather than leftover time.
- **Lightweight check-ins:** optional reflections that help students notice changes in perceived manageability over time.

## 2. Ideation & Process

### 2.1 Ideas We Considered

Chosen directions are listed first. We selected ideas that could lead to a useful daily tool, not simply an impressive one-time dashboard.

| Idea | Why it was dropped / kept |
|---|---|
| **Unified life calendar (Chosen and prototyped)** | Kept because students need one place to see academic and non-academic commitments before any workload calculation is meaningful. It became the product's foundation. |
| **Assessment-to-study pace (Chosen and prototyped)** | Kept because a distant deadline is easy to ignore. Converting topic ranges into small weekly targets makes future workload actionable now. |
| **Conflict-aware study protection (Chosen and prototyped)** | Kept after recognising that rigid routines break as soon as a shift, event, or illness intervenes. Pace lets a student move or skip a session while keeping conflicts visible. |
| **Multi-dimensional load map (Chosen for build phase)** | Kept because two equally long tasks can demand very different levels of concentration, physical effort, social energy, or admin. Inputs will remain editable and descriptive rather than pretending to measure health. |
| **Explainable load balancer (Chosen for build phase)** | Kept because awareness alone does not reduce overload. The planner will compare a few concrete actions and show their effects, while requiring the student's approval. |
| **Recovery nudges as calendar protection (Chosen for build phase)** | Refined from generic wellness reminders. A scheduled recovery boundary is more useful than telling an overloaded student to “relax” without making room for it. |
| Passive stress detection from phone or wearable data | Dropped from the MVP because it introduces privacy, consent, device compatibility, and medical-interpretation risks. Optional self-check-ins provide a simpler and more transparent signal. |
| Anonymous comparison with other students | Dropped because comparing “productivity” could increase pressure and because course loads are not directly comparable. Pace focuses on the student's own constraints and preferences. |
| AI wellbeing chatbot | Dropped as the central concept because it duplicated existing chat tools and risked overstepping into mental-health advice. AI is better limited to extracting schedule information, with deterministic planning rules handling decisions. |
| Points, streaks, and leaderboards | Dropped because rewarding uninterrupted productivity could discourage rest or make an already overloaded student feel punished. Progress is framed around sustainable pacing instead. |

### 2.2 Ideation Boards

These working artifacts show how we connected the problem, possible inputs, and user actions. They include uncertainty and dropped assumptions rather than presenting the final concept as if it appeared fully formed.

#### Concept map

```mermaid
mindmap
  root((Pace))
    Student life
      University
        Classes and assessments
        Preparation and revision
      Part-time work
        Shifts and commuting
      Clubs and committees
        Meetings and deliverables
        Dependencies and follow-ups
      Personal life
        Errands and appointments
        Rest and connection
    Capture
      Calendar imports
      Syllabus files
      Roster images
      Pasted responsibilities
      Manual entry
    Understand load
      Time before deadlines
      Mental effort
      Physical effort
      Social demand
      Errands and admin
    Act
      Schedule preparation
      Preview a commitment
      Move or batch work
      Request help or a change
      Protect recovery time
    Adapt
      Personal work windows
      Remaining-work updates
      Optional check-ins
      Approval and undo
```

The map connects each part of student life to the information Pace needs and the actions it can propose. It helped us separate *life spaces*—where a responsibility comes from—from *load dimensions*—what that responsibility demands from the student.

#### Problem tree

```mermaid
flowchart TD
    A[Schedules scattered across files and chats] --> P[Total workload stays hidden]
    B[Appointments omit preparation and travel] --> P
    C[Deadlines and dependencies change] --> P
    P --> D[Conflicts are discovered late]
    E[Limited control over shifts and shared tasks] --> F[Rescheduling alone cannot resolve the conflict]
    D --> F
    F --> G[Last-minute work displaces recovery]
    G --> H[Greater strain and missed obligations]
    A -.-> I[Import and verify sources]
    B -.-> J[Include preparation and travel]
    C -.-> K[Update remaining work]
    E -.-> L[Create specific requests for help or changes]
    I --> M[Earlier visibility and practical actions]
    J --> M
    K --> M
    L --> M
```

The problem tree traces fragmented information and hidden preparation time to late conflict discovery and displaced recovery. It showed us that visualising workload was not enough; the product also needed practical interventions when a plan no longer fits.

#### User flow

```mermaid
flowchart TD
    A[Add a class, event, task, or imported source] --> B[Review and confirm details]
    B --> C[Combine commitments and personal boundaries]
    C --> D[Build the weekly plan]
    D --> E{Does required work fit?}
    E -->|Yes| F[Review and use the plan]
    E -->|No| G[Explain the shortfall]
    G --> H[Compare move, split, defer, help, or recovery options]
    H --> I{Does the action need another person's agreement?}
    I -->|Yes| J[Keep the request and obligation pending]
    J -->|Agreement confirmed| D
    I -->|No| K[Preview the revised plan]
    K --> L{Approve changes?}
    L -->|Yes| F
    L -->|No| H
    F --> M[Update completed or remaining work]
    M --> D
```

The flow follows a student from entering commitments through feasibility checking, proposal comparison, approval, and later replanning. Ambiguous information and requests involving another person remain visibly unresolved instead of disappearing from the workload.

Together, these boards show the evolution from a simple capacity warning into a calendar-centred, action-oriented planner. They also led us to reject an opaque “AI fixes your week” experience in favour of explainable proposals and explicit user approval.

### 2.3 Mentor Consultation

| Date | Mentor | Feedback received | What was changed |
|---|---|---|---|
| [Consultation date] | [Mentor name], prototype mentor | The first concept had too many equally prominent features and felt like a wellness dashboard rather than a tool students would use every day. The mentor asked us to define what “90% capacity” meant, avoid making unsupported burnout predictions, and demonstrate one complete flow from overload to action. | We made the weekly calendar and study routine the core interaction, defined capacity as required task time compared with compatible available time, and moved passive stress detection out of the MVP. We also changed generic recovery tips into protected calendar time and designed rebalancing as a small set of reviewable options rather than an automatic rewrite. |

Even where the mentor's feedback reduced the apparent feature count, we followed it because a narrower and explainable prototype is more credible than a broad set of unconnected wellness features.

### 2.4 Improvements After Mentor Consolidation

After consolidating the feedback, we compared every feature against three questions: **Does it reveal hidden load? Does it help the student act? Can we build and explain it safely?** This produced the following refinements:

| Before consolidation | Improvement made | Result |
|---|---|---|
| A single “90% capacity” ring with no clear denominator | Calculate required task hours against compatible open hours before the relevant deadlines; explain the numbers in plain language | Students can understand and challenge the result instead of trusting a mysterious score. |
| Separate timetable, stress tracker, and wellness-tip screens | Make the weekly plan the central screen, with load and recovery information attached to real commitments | Less navigation and a clearer daily reason to reopen the app. |
| Automatic AI rescheduling | Use deterministic conflict checks and offer two or three proposals for review | More predictable behaviour and no silent movement of classes, shifts, or shared obligations. |
| Generic “take a break” notifications | Let students define protected recovery windows and show what must move to preserve them | Recovery becomes actionable rather than another notification to dismiss. |
| Every possible import and integration in the MVP | Prototype manual entry and TXT class import first; defer calendar sync and AI document extraction | A realistic build that still proves the complete planning flow. |
| A broad solution for all students | Focus first on university students balancing classes with clubs, work, or recurring personal commitments | More representative scenarios, clearer language, and a testable target group. |

This consolidation established the prototype sequence: **enter commitments → view the whole week → set a sustainable study routine → encounter a conflict → move, skip, or protect the session → review the updated plan**.

## 3. Design & Prototype

**UI Prototype:** [Public Figma, Canva, Netlify, Vercel, or other prototype link]

The current working prototype covers the core flow end to end:

1. **Overview** — Summarises saved commitments, upcoming deadlines, study pace, and the next seven days.
2. **Plan** — Sets a repeatable daily study block and allows individual days to be moved or skipped.
3. **Calendar** — Combines academic, social, extracurricular, and personal commitments in one weekly view.
4. **Classes** — Shows each subject, assessment, weighting, topic range, and due date.
5. **Clubs** — Keeps weekly meetings and standalone events visible beside academic work.
6. **Edit plan** — Adds and updates subjects, classes, clubs, events, and tasks, including recurring items and TXT class imports.

Before submission, the public prototype link will be tested in an incognito window. The presentation will include 4–8 annotated screenshots covering the sequence above, including a study-session conflict and its resolution.

### Design principles

- **Glanceable:** the most urgent information is visible without opening every task.
- **Calm, not alarming:** overload is explained with neutral language and concrete choices.
- **Student-controlled:** suggestions never silently delete or move commitments.
- **Mobile-friendly:** core navigation and forms remain usable on a phone.
- **Accessible:** semantic labels, keyboard-operable controls, readable contrast, and text alternatives are prioritised over colour-only meaning.

## 4. What Makes It Different

Pace is not another to-do list with a wellness quote added on top. Its central twist is connecting **what a student has promised**, **what that promise demands**, and **what can realistically change**.

| Capability | Conventional calendar or task app | Pace |
|---|---|---|
| View of commitments | Events and tasks, usually separated by source | Classes, assessments, study, clubs, events, and personal tasks in one student-focused week |
| Meaning of “busy” | Mostly occupied time or task count | Available time plus editable mental, physical, social, and admin demand |
| Response to overload | Warning, notification, or automatic reschedule | A small set of explainable options with calculated effects and user approval |
| Recovery | Added only if the user manually creates an event | Treated as a protected planning constraint that other work must respect |
| Shared obligations | May be moved as if the user controls them | Remain pending until a shift swap, delegation, or deadline change is confirmed |
| Study planning | Deadline reminder | Converts assessment scope into weekly pace and a repeatable study routine |

### Novel features and twists

- **Two-layer workload model:** “University” and “Work” describe where demand comes from, while “mental” and “social” describe how it feels. This avoids confusing categories with effort.
- **Commitment preview:** before saying yes to a new shift or event, a student can see what would be displaced and whether recovery boundaries would be broken.
- **Pending reality:** asking for help does not magically remove a task. The obligation stays visible until another person agrees.
- **Recovery with consequences:** Pace shows the planning trade-off required to protect downtime instead of offering a context-free reminder.
- **Explainable infeasibility:** when work cannot fit, Pace says why—for example, “10 hours are required before Friday; 8 compatible hours are available”—rather than claiming an unexplained burnout probability.

## 5. Technical Architecture & Feasibility

### Tech stack

| Layer | Technology | Why it fits | Constraints and mitigation |
|---|---|---|---|
| Frontend | React 19 and Vite | Fast iteration, component-based UI, and a lightweight responsive web app that works well on phones | The prototype is a web app rather than a native app; mobile layouts and touch targets must be tested on real devices. |
| Backend | Python 3.12, FastAPI, and Pydantic | Typed request validation, clear REST endpoints, and automatic API documentation | Planning logic must remain separated from API handlers as it grows so it can be tested independently. |
| Data access | SQLAlchemy and Psycopg | A mature relational model and direct PostgreSQL support | The current startup creates tables directly; production would require versioned database migrations. |
| Database | PostgreSQL | Suitable for linked subjects, classes, assessments, clubs, events, tasks, and study-plan overrides | The local prototype has no per-user ownership yet; authentication and row-level access checks are required before a public launch. |
| Development proxy | Vite `/api` proxy | Keeps frontend requests simple during local development | Production needs an explicit API base URL and CORS configuration. |
| Planned hosting | Vercel for the frontend; Render or Railway for FastAPI; managed PostgreSQL such as Neon or Supabase | All provide low-cost prototype tiers and straightforward deployment paths | Free tiers can sleep, limit storage, or change over time; the demo should be warmed up and a local fallback retained. |
| Later integrations | Google Calendar/ICS import and optional server-side AI extraction | Reduces setup effort without making the basic planner depend on AI | OAuth scopes, recurring events, time zones, duplicate imports, privacy, and model cost require a later, carefully bounded phase. |

### System architecture

```mermaid
flowchart LR
    U[Student on phone or laptop] --> R[React + Vite interface]
    R -->|REST /api| F[FastAPI + Pydantic]
    F --> P[Planning and conflict rules]
    F --> S[SQLAlchemy]
    S --> D[(PostgreSQL)]
    P --> F
    G[Later: Calendar, ICS, document import] -. reviewed input .-> F
```

The current prototype uses deterministic calculations for study pacing and conflict validation. AI-assisted import is deliberately later scope: extracted facts must be reviewed before they can affect a confirmed plan.

### Planning and feasibility rules

For each deadline window, Pace will calculate capacity using quantities the student can inspect:

```text
Available task time = compatible open slots after fixed events,
                      travel and protected recovery time

Time demand = remaining work that must fit before the deadline

Shortfall = max(0, time demand - available task time)
```

The primary explanation uses hours, such as “10 hours of work are due before Friday; 8 compatible hours are available.” If a percentage is shown, Pace states its denominator. Mental, physical, social, and administrative demand remain editable planning annotations rather than medical measurements.

The planner will:

1. Reserve fixed commitments, locked blocks, travel, and protected recovery time.
2. Prioritise hard deadlines with the least remaining slack, followed by user importance and preferences.
3. Place work into compatible sessions, splitting only tasks that allow it.
4. Keep unscheduled work visible when no valid plan can be found.
5. Offer a small set of actions with their calculated effects.
6. Require approval before applying a revised plan and retain the previous version for undo.
7. Keep delegated tasks, shift swaps, and extension requests active until another person confirms the change.

### Build plan & scope

#### Implemented prototype foundation

- Persistent CRUD API for subjects, classes, assessments, topics, clubs, events, and tasks.
- Weekly calendar with overlapping-item layout.
- Assessment-based weekly study targets.
- Configurable daily study routine, subject/topic focus, day overrides, and rest days.
- Conflict validation and replacement study sessions when events disrupt the routine.
- Responsive frontend and class TXT import.

#### Building-phase MVP

1. Add duration, priority, flexibility, and editable load annotations to tasks.
2. Add personal availability and protected recovery windows.
3. Calculate deadline-window capacity and explain any time shortfall.
4. Implement three rebalancing actions: move, split, and protect recovery.
5. Show a before/after preview and require approval before saving a revised plan.
6. Add a brief optional check-in and a seven-day trend view.
7. Test the complete flow with representative student schedules and keyboard/mobile use.

#### Deliberately out of scope for the MVP

- Medical diagnosis, clinical burnout prediction, or crisis support.
- Passive biometric or wearable monitoring.
- Fully autonomous schedule changes.
- Native iOS and Android applications.
- Multi-university learning-management-system integrations.
- Live collaborative negotiation with employers, lecturers, or club members.

### Resource and time awareness

The MVP is designed for a small student team. The existing calendar, database, and editing flows can be extended rather than rebuilt. Team effort should be divided across interface and accessibility, planning rules, backend/data changes, and testing/presentation. The core stack is open source, and prototype hosting can begin on free tiers; optional AI extraction is deferred to avoid unpredictable cost and integration risk. If time becomes constrained, the load trend and external imports can be removed without breaking the central **detect → compare → approve** flow.

## 6. Local Development

### Prerequisites

- Node.js and pnpm
- Python 3.12+
- [uv](https://docs.astral.sh/uv/)
- PostgreSQL

### Run locally

1. Add a PostgreSQL connection string to `.env`:

   ```env
   DB_URI=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
   ```

2. Install dependencies:

   ```sh
   uv sync
   pnpm install
   ```

3. Start the API:

   ```sh
   uv run uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
   ```

4. In another terminal, start the frontend:

   ```sh
   pnpm dev
   ```

5. Open `http://localhost:5173`. During development, Vite proxies `/api` requests to FastAPI. Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

On first startup, the API creates its `planner_*` tables and adds starter records only when the planner is empty.

### Class TXT import

The **Classes** tab in **Edit plan** accepts one or more class-session blocks separated by `---`:

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

See [`public/mock-subjects.txt`](public/mock-subjects.txt) for a ready-to-import example.
