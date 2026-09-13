/**
 * Demo backend for the public prototype build.
 *
 * The deployed prototype is a static site, so there is no FastAPI service or
 * PostgreSQL database behind it. This module answers the same routes as
 * `backend/main.py`, with the same payload shapes and the same conflict rules,
 * against seeded sample data held in the browser.
 *
 * Enabled only when the build sets VITE_DEMO=1. Local development with the real
 * API is unaffected.
 */

export const DEMO = import.meta.env.VITE_DEMO === '1'

const STORE_KEY = 'pace-demo-state-v2'
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const pad = (n) => String(n).padStart(2, '0')
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
const fromToday = (days) => { const d = today(); d.setDate(d.getDate() + days); return isoDate(d) }
const parseDate = (value) => { const d = new Date(`${value}T00:00:00`); d.setHours(0, 0, 0, 0); return d }
const weekdayOf = (value) => WEEKDAYS[(parseDate(value).getDay() + 6) % 7]
const mins = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + m }
const overlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && aEnd > bStart

function fail(status, detail) {
  const message = typeof detail === 'string' ? detail : detail?.message || 'Something went wrong while saving your plan.'
  const error = new Error(message)
  error.status = status
  error.details = detail
  return error
}

/* ------------------------------------------------------------------ seed */

const DS_TOPICS = [
  'Arrays and complexity', 'Linked lists', 'Stacks and queues', 'Recursion',
  'Sorting algorithms', 'Searching', 'Hash tables', 'Trees',
  'Heaps and priority queues', 'Graphs', 'Shortest paths', 'Dynamic programming',
]
const DB_TOPICS = [
  'Relational model', 'Entity relationship design', 'Normalisation', 'SQL joins',
  'Indexing', 'Transactions', 'Concurrency control', 'Query planning',
]
const DR_TOPICS = [
  'Research contexts', 'Question framing', 'Interview planning',
  'Synthesis methods', 'Affinity mapping', 'Research storytelling',
]

const topicList = (titles, offset) => titles.map((title, i) => ({ id: offset + i, number: i + 1, title }))

function seed() {
  return {
    nextId: 100,
    subjects: [
      { id: 1, name: 'Data Structures' },
      { id: 2, name: 'Database Systems' },
      { id: 3, name: 'Design Research' },
    ],
    classes: [
      {
        id: 1, subject: 'Lecture', subjectId: 1, subjectName: 'Data Structures',
        day: 'Monday', startTime: '09:00', endTime: '10:30',
        // 12 topics, four weeks out: the planner turns this into 3 topics a week
        assessments: [{ id: 1, date: fromToday(28), weight: 30, topicStart: 1, topicEnd: 12 }],
        topics: topicList(DS_TOPICS, 1),
      },
      {
        id: 2, subject: 'Lab', subjectId: 1, subjectName: 'Data Structures',
        day: 'Wednesday', startTime: '14:00', endTime: '15:30',
        assessments: [], topics: [],
      },
      {
        id: 3, subject: 'Lecture', subjectId: 2, subjectName: 'Database Systems',
        day: 'Tuesday', startTime: '11:00', endTime: '12:30',
        assessments: [{ id: 2, date: fromToday(14), weight: 25, topicStart: 1, topicEnd: 8 }],
        topics: topicList(DB_TOPICS, 20),
      },
      {
        id: 4, subject: 'Studio', subjectId: 3, subjectName: 'Design Research',
        day: 'Thursday', startTime: '09:00', endTime: '11:00',
        assessments: [{ id: 3, date: fromToday(40), weight: 40, topicStart: 1, topicEnd: 6 }],
        topics: topicList(DR_TOPICS, 40),
      },
    ],
    clubs: [
      { id: 1, name: 'Debate Society', hasWeeklyMeeting: true, day: 'Tuesday', startTime: '15:30', endTime: '17:00' },
      { id: 2, name: 'Photo Collective', hasWeeklyMeeting: true, day: 'Saturday', startTime: '17:30', endTime: '19:00' },
      { id: 3, name: 'Student Council', hasWeeklyMeeting: false, day: 'Monday', startTime: '', endTime: '' },
    ],
    events: [
      { id: 1, name: 'Campus Fest', date: fromToday(5), endDate: '', startTime: '15:30', endTime: '18:00', clubId: 1 },
      { id: 2, name: 'Council briefing', date: fromToday(9), endDate: '', startTime: '16:00', endTime: '17:30', clubId: 3 },
    ],
    tasks: [
      { id: 1, title: 'Group project sync', date: fromToday(3), startTime: '18:00', endTime: '19:00', isRecurring: false, recurringDay: 'Monday', classId: null, clubId: null, eventId: null },
      { id: 2, title: 'Lab report draft', date: fromToday(6), startTime: '', endTime: '', isRecurring: false, recurringDay: 'Monday', classId: 2, clubId: null, eventId: null },
      { id: 3, title: 'Committee outreach', date: '', startTime: '', endTime: '', isRecurring: true, recurringDay: 'Friday', classId: null, clubId: 3, eventId: null },
    ],
    studyPlan: {
      minutesPerDay: 30, startTime: '20:00',
      subjectId: 1, subjectName: 'Data Structures',
      topicId: 1, topicNumber: 1, topicTitle: 'Arrays and complexity',
      dayOverrides: [], studyReschedules: [],
    },
  }
}

/* ----------------------------------------------------------------- store */

let state = null

function load() {
  if (state) return state
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // dates are generated relative to today, so a stale day's data is rebuilt
      if (parsed.seededOn === isoDate(today())) { state = parsed; return state }
    }
  } catch { /* private mode, or unreadable state: fall through to a fresh seed */ }
  state = { ...seed(), seededOn: isoDate(today()) }
  persist()
  return state
}

function persist() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)) } catch { /* not fatal for a demo */ }
}

const nextId = () => { state.nextId += 1; return state.nextId }
const clone = (value) => JSON.parse(JSON.stringify(value))

/* ------------------------------------------------- conflict rules (port) */

function studySessionForDate(plan, dateStr, movedSources) {
  if (movedSources?.has(dateStr)) return null
  const day = weekdayOf(dateStr)
  const override = (plan.dayOverrides ?? []).find((o) => o.day === day)
  if (override?.isAbsent) return null
  return { startTime: override?.startTime || plan.startTime, minutesPerDay: plan.minutesPerDay }
}

function eventRangeOnDate(event, dateStr) {
  const start = parseDate(event.date)
  const final = parseDate(event.endDate || event.date)
  const on = parseDate(dateStr)
  if (on < start || on > final) return null
  if (+start === +final) return [mins(event.startTime), mins(event.endTime)]
  if (+on === +start) return [mins(event.startTime), 24 * 60]
  if (+on === +final) return [0, mins(event.endTime)]
  return [0, 24 * 60]
}

/** Mirrors study_conflict() in backend/main.py: what already occupies this slot. */
function studyConflict(startTime, minutes, dateStr, excludeEventId) {
  const start = mins(startTime)
  const end = start + minutes
  if (end > 24 * 60) return 'A study block must finish by midnight'
  const day = weekdayOf(dateStr)

  for (const item of state.classes) {
    if (item.day === day && overlap(start, end, mins(item.startTime), mins(item.endTime))) return `${item.subject} class`
  }
  for (const item of state.clubs) {
    if (item.hasWeeklyMeeting && item.day === day && item.startTime && item.endTime
      && overlap(start, end, mins(item.startTime), mins(item.endTime))) return `${item.name} meeting`
  }
  for (const item of state.tasks) {
    if (!item.startTime || !item.endTime) continue
    const matches = item.isRecurring ? item.recurringDay === day : item.date === dateStr
    if (matches && overlap(start, end, mins(item.startTime), mins(item.endTime))) return item.title
  }
  for (const item of state.events) {
    if (excludeEventId != null && item.id === excludeEventId) continue
    const range = eventRangeOnDate(item, dateStr)
    if (range && overlap(start, end, range[0], range[1])) return item.name
  }
  return null
}

/** Mirrors event_study_conflicts(): which study sessions this event would cover. */
function eventStudyConflicts(draft, eventId) {
  const plan = state.studyPlan
  const movedByOthers = new Set((plan.studyReschedules ?? []).filter((r) => r.eventId !== eventId).map((r) => r.sourceDate))
  const conflicts = []
  const final = parseDate(draft.endDate || draft.date)
  const start = parseDate(draft.date)
  const now = today()
  for (let d = new Date(start); d <= final; d.setDate(d.getDate() + 1)) {
    const dateStr = isoDate(d)
    if (parseDate(dateStr) < now) continue
    const session = studySessionForDate(plan, dateStr, movedByOthers)
    const range = eventRangeOnDate(draft, dateStr)
    if (!session || !range) continue
    const s = mins(session.startTime)
    if (overlap(s, s + session.minutesPerDay, range[0], range[1])) {
      conflicts.push({ sourceDate: dateStr, startTime: session.startTime, minutesPerDay: session.minutesPerDay })
    }
  }
  return conflicts
}

function applyEventReschedules(draft, eventId, conflicts) {
  const supplied = draft.studyReschedules ?? []
  const conflictDates = new Set(conflicts.map((c) => c.sourceDate))

  if (conflicts.length && supplied.length < conflictDates.size) {
    throw fail(409, {
      message: 'This event overlaps your study session. Choose a replacement date and time, or cancel.',
      studyConflicts: conflicts,
    })
  }
  const plan = state.studyPlan
  const kept = (plan.studyReschedules ?? []).filter((r) => r.eventId !== eventId)
  const added = []
  for (const entry of supplied) {
    if (!conflictDates.has(entry.sourceDate)) {
      throw fail(422, 'One of the replacement study sessions no longer needs to be moved')
    }
    if (!entry.targetDate || !entry.startTime) {
      throw fail(422, 'Choose one replacement study session for each affected date')
    }
    if (entry.targetDate === entry.sourceDate) {
      throw fail(422, 'Choose another date for the replacement study session')
    }
    if (parseDate(entry.targetDate) < today()) {
      throw fail(422, 'The replacement study session cannot be in the past')
    }
    const clash = studyConflict(entry.startTime, plan.minutesPerDay, entry.targetDate, eventId)
    if (clash) {
      throw fail(422, `That replacement overlaps your ${clash}. Choose another date or time.`)
    }
    added.push({
      id: nextId(), eventId, sourceDate: entry.sourceDate, targetDate: entry.targetDate,
      startTime: entry.startTime, minutesPerDay: plan.minutesPerDay,
      subjectId: plan.subjectId, subjectName: plan.subjectName,
      topicId: plan.topicId, topicNumber: plan.topicNumber, topicTitle: plan.topicTitle,
    })
  }
  plan.studyReschedules = [...kept, ...added]
}

/* ---------------------------------------------------------------- routes */

const COLLECTIONS = {
  subjects: 'subjects', classes: 'classes', clubs: 'clubs', events: 'events', tasks: 'tasks',
}

function decorateClass(record) {
  const subject = state.subjects.find((s) => s.id === Number(record.subjectId))
  return {
    ...record,
    subjectId: record.subjectId ? Number(record.subjectId) : null,
    subjectName: subject ? subject.name : '',
    assessments: (record.assessments ?? []).map((a) => ({ ...a, id: a.id ?? nextId() })),
    topics: (record.topics ?? []).map((t) => ({ ...t, id: t.id ?? nextId() })),
  }
}

function studyPlanPayload() {
  const plan = state.studyPlan
  const subject = state.subjects.find((s) => s.id === plan.subjectId)
  const topic = state.classes.flatMap((c) => c.topics).find((t) => t.id === plan.topicId)
  return clone({
    ...plan,
    subjectName: subject ? subject.name : '',
    topicNumber: topic ? topic.number : null,
    topicTitle: topic ? topic.title : '',
  })
}

function handle(method, path, body) {
  load()
  const parts = path.replace(/^\/api\//, '').split('/')
  const [head, second, third] = parts

  if (head === 'health') return { status: 'ok' }

  if (head === 'bootstrap') {
    return clone({
      subjects: [...state.subjects].sort((a, b) => a.name.localeCompare(b.name)),
      classes: state.classes,
      clubs: state.clubs,
      events: state.events,
      tasks: state.tasks,
      studyPlan: studyPlanPayload(),
    })
  }

  if (head === 'study-plan') {
    if (method === 'GET') return studyPlanPayload()
    if (second === 'days' && method === 'PUT') {
      const day = decodeURIComponent(third)
      const overrides = state.studyPlan.dayOverrides.filter((o) => o.day !== day)
      if (body.isAbsent || body.startTime) {
        if (body.startTime && !body.isAbsent) {
          // the replacement slot has to be free on the next occurrence of that day
          const probe = today()
          for (let i = 0; i < 7; i += 1) {
            if (weekdayOf(isoDate(probe)) === day) break
            probe.setDate(probe.getDate() + 1)
          }
          const clash = studyConflict(body.startTime, state.studyPlan.minutesPerDay, isoDate(probe), null)
          if (clash) throw fail(422, `That time overlaps your ${clash}.`)
        }
        overrides.push({ day, isAbsent: Boolean(body.isAbsent), startTime: body.startTime || '' })
      }
      state.studyPlan.dayOverrides = overrides
      persist()
      return studyPlanPayload()
    }
    if (method === 'PUT') {
      const minutes = Number(body.minutesPerDay)
      const probe = today()
      for (let i = 0; i < 7; i += 1) {
        const dateStr = isoDate(probe)
        const day = weekdayOf(dateStr)
        const override = state.studyPlan.dayOverrides.find((o) => o.day === day)
        if (!override?.isAbsent) {
          const clash = studyConflict(override?.startTime || body.startTime, minutes, dateStr, null)
          if (clash) throw fail(422, `That study time overlaps your ${clash} on ${day}. Pick another time.`)
        }
        probe.setDate(probe.getDate() + 1)
      }
      Object.assign(state.studyPlan, {
        minutesPerDay: minutes,
        startTime: body.startTime,
        subjectId: body.subjectId == null ? null : Number(body.subjectId),
        topicId: body.topicId == null ? null : Number(body.topicId),
      })
      persist()
      return studyPlanPayload()
    }
  }

  const key = COLLECTIONS[head]
  if (!key) throw fail(404, `Unknown demo route ${path}`)
  const list = state[key]
  const id = second ? Number(second) : null

  if (method === 'DELETE') {
    state[key] = list.filter((item) => item.id !== id)
    if (key === 'events') {
      state.studyPlan.studyReschedules = state.studyPlan.studyReschedules.filter((r) => r.eventId !== id)
    }
    if (key === 'subjects') {
      state.classes = state.classes.map((c) => c.subjectId === id ? { ...c, subjectId: null, subjectName: '' } : c)
      if (state.studyPlan.subjectId === id) Object.assign(state.studyPlan, { subjectId: null, topicId: null })
    }
    persist()
    return null
  }

  if (key === 'events') {
    const draft = { ...body, id: id ?? nextId(), endDate: body.endDate || '', clubId: body.clubId == null ? null : Number(body.clubId) }
    const conflicts = eventStudyConflicts(draft, draft.id)
    applyEventReschedules(draft, draft.id, conflicts)
    delete draft.studyReschedules
    state.events = id ? list.map((item) => item.id === id ? draft : item) : [...list, draft]
    persist()
    return clone(draft)
  }

  let record = { ...body, id: id ?? nextId() }
  if (key === 'classes') record = decorateClass(record)
  if (key === 'tasks') {
    record = {
      ...record,
      date: record.date || '',
      classId: record.classId ?? null, clubId: record.clubId ?? null, eventId: record.eventId ?? null,
    }
  }
  state[key] = id ? list.map((item) => item.id === id ? record : item) : [...list, record]
  persist()
  return clone(record)
}

export function demoApi(path, options = {}) {
  const method = options.method ?? 'GET'
  const body = options.body ? JSON.parse(options.body) : null
  // a touch of latency so optimistic UI and busy states behave as they do live
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try { resolve(handle(method, path, body)) } catch (error) { reject(error) }
    }, 90)
  })
}
