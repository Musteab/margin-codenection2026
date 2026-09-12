# Margin — Ideation Boards

[Back to project overview](../README.md)

## Concept Map

```mermaid
mindmap
  root((Margin))
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
      Syllabus PDFs
      Roster images
      Pasted responsibilities
      Source review
    Understand load
      Time before deadlines
      Mental effort
      Physical effort
      Social demand
      Errands and admin
    Act
      Schedule preparation
      Preview a new commitment
      Move or batch work
      Request help or a change
      Protect recovery time
    Adapt
      Custom life spaces
      Personal work windows
      Remaining-work updates
      Optional check-ins
      Approval and undo
```

The map connects each part of student life to the information Margin needs and the actions it can propose. Life spaces organise responsibilities; load dimensions describe the demands those responsibilities place on the same student.

## Problem Tree

```mermaid
flowchart TD
    A[Schedules scattered across files and chats] --> P[Total workload stays hidden]
    B[Appointments omit preparation and travel] --> P
    C[Deadlines and dependencies change] --> P
    P --> D[Conflicts discovered late]
    E[Limited control over shifts and shared tasks] --> F[Rescheduling alone cannot resolve the conflict]
    D --> F
    F --> G[Last-minute work and displaced recovery]
    G --> H[Greater strain and missed obligations]
    A -.-> I[Import and verify sources]
    B -.-> J[Review preparation and travel needs]
    C -.-> K[Update remaining work and dependencies]
    E -.-> L[Specific requests for help or changes]
    I --> M[Earlier visibility and practical next actions]
    J --> M
    K --> M
    L --> M
```

The problem tree links fragmented information and limited control to late planning conflicts. The intervention links explain why the product needs both a calendar and support for decisions involving other people.

## User Flow

```mermaid
flowchart TD
    A[Add a calendar, file or message] --> B[Extract facts and propose tasks]
    B --> C{Ambiguous or conflicting information?}
    C -->|Yes| D[Review the source and correct]
    C -->|No| E[Confirm commitments]
    D --> E
    E --> F[Combine fixed events, tasks and personal boundaries]
    F --> G[Build a draft calendar]
    G --> H{Work fits before deadlines?}
    H -->|Yes| I[Review and approve]
    H -->|No| J[Explain the shortfall and compare actions]
    J --> K{Needs another person's agreement?}
    K -->|Yes| L[Keep the request pending]
    L -->|Agreement confirmed| G
    K -->|No| I
    J --> N[No valid plan found under current constraints]
    N --> O[Consider a scope or deadline request]
    O --> L
    I --> P[Use the plan]
    P --> Q[Update work completed or add a new commitment]
    Q --> G
    I --> U[Undo to the previous plan]
```

The flow keeps uncertainty, infeasibility and external agreements visible. Approval commits a specific plan, while remaining-work updates make later replanning possible without restarting setup.

## Idea Evolution

The initial commitment-preview concept became a calendar-centred product when the discussion focused on daily use. Including school, work, clubs and personal responsibilities made total availability the shared constraint. Syllabus and roster imports followed from the need to reduce manual setup. Preparation tasks, dependencies and pending requests then sharpened the practical meaning of a workable plan.

These are concept refinements from the ideation process. The boards describe the proposed experience rather than observed outcomes from a deployed system.
