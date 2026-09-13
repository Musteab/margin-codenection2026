import { dateKey, studySessionsForDate, weekdayForDate } from './studyPlanUtils'

const calendarStart = 7 * 60
const calendarEnd = 24 * 60
const slotMinutes = 30
const laneUnits = 24
const calendarDays = 7
const timeLabels = Array.from({ length: 18 }, (_, index) => {
  const hour = (7 + index) % 24
  if (hour === 0) return '12 am'
  if (hour === 12) return '12 pm'
  return `${hour > 12 ? hour - 12 : hour} ${hour < 12 ? 'am' : 'pm'}`
})

function upcomingDates() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: calendarDays }, (_, index) => {
    const day = new Date(today)
    day.setDate(today.getDate() + index)
    return day
  })
}

function minutesFromTime(value) {
  if (!value) return null
  const [hour, minute] = value.split(':').map(Number)
  return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : null
}

function position(startTime, endTime) {
  const start = minutesFromTime(startTime)
  let end = minutesFromTime(endTime || startTime)
  if (start == null || end == null) return null
  if (end <= start) end += 24 * 60
  if (end <= calendarStart || start >= calendarEnd) return null
  const visibleStart = Math.max(start, calendarStart)
  const visibleEnd = Math.min(end, calendarEnd)
  if (visibleEnd <= visibleStart) return null
  return {
    row: Math.floor((visibleStart - calendarStart) / slotMinutes) + 1,
    span: Math.max(1, Math.ceil((visibleEnd - visibleStart) / slotMinutes)),
    startMinutes: visibleStart,
    endMinutes: visibleEnd,
  }
}

function entry(id, label, day, startTime, endTime, tone) {
  const placement = position(startTime, endTime)
  if (day == null || !placement) return null
  return { id, label, day, tone, ...placement }
}

function eventEntries(item, weekDates) {
  const endDate = item.endDate || item.date
  return weekDates.flatMap((day, index) => {
    const key = dateKey(day)
    if (key < item.date || key > endDate) return []
    const isStart = key === item.date
    const isEnd = key === endDate
    return [entry(`event-${item.id}-${key}`, isStart ? item.name : `${item.name} · continues`, index, isStart ? item.startTime : '07:00', isEnd ? item.endTime : '24:00', 'orange')]
  })
}

function addMinutes(startTime, minutes) {
  const start = minutesFromTime(startTime)
  const total = (start + Number(minutes)) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function studyLabel(session) {
  const focus = session.topicTitle ? `${session.subjectName || 'Study'} · ${session.topicTitle}` : session.subjectName || `${session.minutesPerDay} min`
  return `Study · ${focus}${session.isRescheduled ? ' · moved' : ''}`
}

function addLanes(entries) {
  return Array.from({ length: calendarDays }, (_, day) => {
    const dayEntries = entries.filter((item) => item.day === day).sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes)
    const laidOut = []
    let group = []
    let groupEnd = -1
    const finishGroup = () => {
      if (!group.length) return
      const laneEnds = []
      group.forEach((item) => {
        let lane = laneEnds.findIndex((end) => end <= item.startMinutes)
        if (lane === -1) {
          lane = laneEnds.length
          laneEnds.push(item.endMinutes)
        } else {
          laneEnds[lane] = item.endMinutes
        }
        item.lane = lane
      })
      group.forEach((item) => { item.laneCount = laneEnds.length })
      laidOut.push(...group)
      group = []
      groupEnd = -1
    }
    dayEntries.forEach((item) => {
      if (group.length && item.startMinutes >= groupEnd) finishGroup()
      group.push(item)
      groupEnd = Math.max(groupEnd, item.endMinutes)
    })
    finishGroup()
    return laidOut
  }).flat()
}

function plannerCalendarEntries(classes, clubs, events, tasks, studyPlan, weekDates) {
  const weekdayIndex = (weekday) => weekDates.findIndex((date) => weekdayForDate(date) === weekday)
  const entries = [
    ...classes.map((item) => entry(`class-${item.id}`, item.subjectName ? `${item.subjectName} · ${item.subject}` : item.subject, weekdayIndex(item.day), item.startTime, item.endTime, 'blue')),
    ...clubs.filter((item) => item.hasWeeklyMeeting).map((item) => entry(`club-${item.id}`, item.name, weekdayIndex(item.day), item.startTime, item.endTime, 'green')),
    ...events.flatMap((item) => eventEntries(item, weekDates)),
    ...tasks.flatMap((item) => {
      const day = item.isRecurring ? weekdayIndex(item.recurringDay) : weekDates.findIndex((date) => dateKey(date) === item.date)
      return [entry(`task-${item.id}`, item.title, day === -1 ? null : day, item.startTime, item.endTime, 'purple')]
    }),
    ...(studyPlan ? weekDates.flatMap((date, day) => studySessionsForDate(studyPlan, date).map((session, index) => entry(`study-${dateKey(date)}-${index}-${session.sourceDate ?? 'routine'}`, studyLabel(session), day, session.startTime, addMinutes(session.startTime, session.minutesPerDay), 'purple'))) : []),
  ].filter(Boolean)
  return addLanes(entries)
}

export default function ScheduleCalendar({ classes, clubs, events, tasks, studyPlan }) {
  const weekDates = upcomingDates()
  const entries = plannerCalendarEntries(classes, clubs, events, tasks, studyPlan, weekDates)
  return <div className="week-calendar" aria-label="Planner for the next seven days from 7 AM to midnight"><div className="day-headings"><span className="time-gutter"></span>{weekDates.map((date) => <div className="day-label" key={dateKey(date)}><span>{new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date)}</span><small>{date.getDate()}</small></div>)}</div><div className="calendar-body"><div className="time-labels">{timeLabels.map((label, index) => <span className={index === 0 ? 'first' : index === timeLabels.length - 1 ? 'last' : ''} style={{ top: `${index / (timeLabels.length - 1) * 100}%` }} key={label}>{label}</span>)}</div><div className="calendar-grid">{entries.length ? entries.map((item) => { const laneWidth = Math.max(1, Math.floor(laneUnits / item.laneCount)); const columnStart = item.day * laneUnits + item.lane * laneWidth + 1; return <div className={`calendar-block ${item.tone}`} style={{ gridColumn: `${columnStart} / span ${laneWidth}`, gridRow: `${item.row} / span ${item.span}` }} key={item.id} title={item.label}>{item.label}</div> }) : <p className="calendar-empty">No scheduled items yet.</p>}</div></div></div>
}
