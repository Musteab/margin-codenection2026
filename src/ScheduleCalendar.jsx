const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const dayIndex = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 }

function dayFromDate(value) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.valueOf()) ? null : (date.getDay() + 6) % 7
}

function position(startTime, endTime) {
  if (!startTime) return { row: 1, span: 1 }
  const [hour, minute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = (endTime || startTime).split(':').map(Number)
  const start = hour + minute / 60
  const duration = Math.max(0.75, endHour + endMinute / 60 - start)
  return { row: Math.max(1, Math.min(8, Math.floor(start - 8) + 1)), span: Math.max(1, Math.min(8, Math.ceil(duration))) }
}

function entry(id, label, day, startTime, endTime, tone) {
  if (day == null) return null
  return { id, label, day, tone, ...position(startTime, endTime) }
}

function eventEntries(item) {
  const start = new Date(`${item.date}T00:00:00`)
  const end = new Date(`${item.endDate || item.date}T00:00:00`)
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || end < start) return []
  const entries = []
  const cursor = new Date(start)
  let index = 0
  while (cursor <= end && index < 31) {
    const isStart = cursor.valueOf() === start.valueOf()
    const isEnd = cursor.valueOf() === end.valueOf()
    const day = (cursor.getDay() + 6) % 7
    const label = isStart ? item.name : item.name + ' · continues'
    entries.push(entry(`event-${item.id}-${index}`, label, day, isStart ? item.startTime : '08:00', isEnd ? item.endTime : '20:00', 'orange'))
    cursor.setDate(cursor.getDate() + 1)
    index += 1
  }
  return entries
}

function plannerCalendarEntries(classes, clubs, events, tasks) {
  return [
    ...classes.map((item) => entry(`class-${item.id}`, item.subjectName ? item.subjectName + ' · ' + item.subject : item.subject, dayIndex[item.day], item.startTime, item.endTime, 'blue')),
    ...clubs.filter((item) => item.hasWeeklyMeeting).map((item) => entry(`club-${item.id}`, item.name, dayIndex[item.day], item.startTime, item.endTime, 'green')),
    ...events.flatMap(eventEntries),
    ...tasks.map((item) => entry(`task-${item.id}`, item.title, item.isRecurring ? dayIndex[item.recurringDay] : dayFromDate(item.date), item.startTime, item.endTime, 'purple')),
  ].filter(Boolean)
}

export default function ScheduleCalendar({ classes, clubs, events, tasks }) {
  const entries = plannerCalendarEntries(classes, clubs, events, tasks)
  return <div className="week-calendar" aria-label="Weekly planner calendar"><div className="day-headings"><span className="time-gutter"></span>{days.map((day) => <div className="day-label" key={day}><span>{day}</span></div>)}</div><div className="calendar-body"><div className="time-labels"><span>8 am</span><span>10 am</span><span>12 pm</span><span>2 pm</span><span>4 pm</span><span>6 pm</span></div><div className="calendar-grid">{entries.length ? entries.map((item) => <div className={`calendar-block ${item.tone}`} style={{ gridColumn: item.day + 1, gridRow: `${item.row} / span ${item.span}` }} key={item.id} title={item.label}>{item.label}</div>) : <p className="calendar-empty">No scheduled items yet.</p>}</div></div></div>
}
