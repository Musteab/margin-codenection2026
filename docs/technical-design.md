# Margin — Technical Design

[Back to project overview](../README.md)

## Design Goal

Turn confirmed commitments and personal constraints into an explainable calendar. Use AI to interpret messy inputs and application logic to check whether the resulting plan is possible.

## Input Pipeline

1. Accept structured calendar data, syllabus PDFs, roster images and pasted text.
2. Extract factual titles, dates, recurrence and responsibilities with source references.
3. Propose preparation tasks and duration estimates separately from extracted facts.
4. Validate the structure and flag missing or conflicting information.
5. Let the student correct and confirm the import before scheduling it.

A syllabus reference to “Week 7” requires the teaching calendar, including recess weeks. A deadline with no time keeps that uncertainty instead of silently becoming 23:59. An all-day deadline is a due-date marker, not an all-day appointment. Committee messages must distinguish this student's responsibilities from other members' work.

Source identity and version support duplicate detection and changes. Re-importing the same syllabus must not create another set of assignments. Conflicting dates from different sources return to review.

## Information Model

| Object | Essential data | Purpose |
|---|---|---|
| Source | Owner, type, identity/version, reference, import time | Trace confirmed facts and subsequent updates. |
| Fixed event | Source ID, start/end, time zone, recurrence, life space | Occupy time for a class, shift or meeting. |
| Task | Deadline, remaining duration/range, priority, earliest start, dependencies, minimum session, life space | Describe work that must be completed. |
| Suggested subtask | Parent, proposed duration, accepted/rejected state | Represent preparation without silently inventing obligations. |
| Personal constraint | Availability, protected time, travel, work preferences | Define usable planning windows. |
| Scheduled block | Task ID, start/end, locked/flexible state, plan version | Place part of a task in the calendar. |
| Load annotation | Dimension, effort level, estimated/confirmed status | Represent personal effort preferences. |
| Action proposal | Changes, reason, calculated effect, approval, external dependencies | Make a plan revision reviewable. |
| Check-in | Optional perceived load and remaining-work feedback | Refine later estimates and suggestions. |

Life spaces and effort dimensions are separate. A Work filter controls the view; hiding it does not make shifts disappear from availability calculations.

## Time Feasibility

For a particular deadline window:

```text
Available task time = compatible open slots after fixed events,
                     travel and protected personal time

Time demand = remaining work that must fit inside the window

Shortfall = max(0, time demand - available task time)
```

The primary explanation uses hours: “10 hours to fit before Friday; 8 available.” If a percentage is displayed, its label identifies the denominator, such as “125% of available task time.” A window with zero availability has an explicit no-available-slot state.

Overlapping fixed events occupy the union of their intervals. A task's remaining estimate is not added again when its work blocks appear on the calendar. Minimum session length, location and dependencies can prevent a task from fitting even if total hours look sufficient.

Mental, physical, social and admin demand begin as editable annotations and personal preferences. A useful explanation is “Three demanding focus sessions are planned; you prefer two.” These values are planning aids, not physiological measurements or a probability of burnout.

## Planning Rules

1. Reserve fixed commitments, locked blocks, travel and the student's protected time.
2. Identify work whose dependencies are ready.
3. Prioritise hard deadlines with little remaining slack, then user importance and preferences.
4. Place work in compatible sessions before deadlines; split only tasks that permit it.
5. Prefer fewer unnecessary schedule changes and less fragmentation where feasible.
6. Retain unscheduled work and explain conflicting constraints if a valid plan cannot be found.
7. Offer a small set of concrete alternatives with their calculated effects.

The initial planner can use a deterministic heuristic; it does not need to claim globally optimal scheduling. The same planning function powers preview and apply. Before saving, check that the input plan version is still current.

## Actions and Approval

| Action | Required behaviour |
|---|---|
| Move | Preserve task duration and latest acceptable completion; show its new placement. |
| Batch | Group compatible errands or tasks without inventing unsupported time savings. |
| Split | Respect the task's minimum useful session and total remaining work. |
| Reduce scope | Require an explicit user choice about what work is removed. |
| Request help | Retain the task until the user confirms a handover. |
| Request a new deadline or shift | Preserve the original commitment while the request is pending. |
| Protect recovery | Respect chosen boundaries and offer practical options based on preferences. |
| Undo | Restore the previous internal plan version. |

If the planner cannot produce a valid schedule, the app reports that it could not find a plan under the current constraints. A proven time shortfall is distinguished from a search that failed to find a solution. The app can support a specific conversation about scope, deadline or staffing while keeping the unresolved obligation visible.

## Integration and Reliability

Google Calendar imports use the narrow scopes needed for the selected calendars. Stable event IDs, recurrence exceptions, time zones and deleted/updated events must be handled consistently. Show the last successful sync and a reconnect path. `.ics` import/export remains available when live account access is unavailable. [Google Calendar scope documentation](https://developers.google.com/workspace/calendar/api/auth), [synchronisation guide](https://developers.google.com/workspace/calendar/api/guides/sync).

Selective write-back is later scope, targeted at an app-created calendar with explicit approval. Imported external commitments are not silently moved by an internal replan.

AI output is validated before it changes confirmed data. Uploaded text supplies information, not execution instructions. Model credentials stay server-side; data access is scoped per user. Extraction size/request limits and version-based caching control cost, while ordinary calendar operations remain available if the AI service fails.

## Acceptance Checks

- An ambiguous syllabus date stays unresolved until reviewed; proposed durations are labelled as estimates.
- Re-importing a source creates no duplicates; a revised deadline can be reviewed and replanned.
- A shift crossing midnight and a cancelled recurring class retain correct local dates and availability.
- Preparation, travel and responsibility ownership are represented without assigning another person's work to the student.
- Six hours of report work split across three blocks still count as six hours.
- A workload shortfall remains visible without silently dropping tasks or consuming protected time.
- Short fragmented gaps do not satisfy a task that requires a longer uninterrupted session.
- A delegation or extension request does not change the confirmed workload before agreement.
- Increasing remaining work from two to five hours updates the plan while preserving locked commitments.
- Approval creates a plan version; undo restores the prior state; stale proposals are rejected.
- Failed AI extraction or revoked calendar access preserves saved data and allows manual recovery.
- Import review, approval, rejection and undo are usable on a phone and with a keyboard.
- One signed-in user cannot access another user's calendar, source files or check-ins.
- Hiding a life space changes visibility rather than planning constraints.

## Deployment Evaluation

The student pilot will measure time to a confirmed usable plan, extraction corrections, constraint failures, proposal acceptance/editing and repeated weekly use. Optional check-ins can describe perceived manageability. Report sample sizes, missing responses and service costs alongside the results; a short pilot evaluates planning usefulness rather than establishing medical efficacy.
