export const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function weekdayForDate(value) {
  return weekdays[value.getDay() === 0 ? 6 : value.getDay() - 1]
}

export function dateKey(value) {
  if (typeof value === 'string') return value
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function studySessionForDay(studyPlan, day) {
  const override = (studyPlan.dayOverrides ?? []).find((item) => item.day === day)
  if (override?.isAbsent) return null
  return {
    startTime: override?.startTime || studyPlan.startTime,
    minutesPerDay: studyPlan.minutesPerDay,
    isOverride: Boolean(override?.startTime),
    subjectId: studyPlan.subjectId ?? null,
    subjectName: studyPlan.subjectName ?? '',
    topicId: studyPlan.topicId ?? null,
    topicNumber: studyPlan.topicNumber ?? null,
    topicTitle: studyPlan.topicTitle ?? '',
  }
}

export function studySessionsForDate(studyPlan, value) {
  const key = dateKey(value)
  const date = typeof value === 'string' ? new Date(`${value}T00:00:00`) : value
  const reschedules = studyPlan.studyReschedules ?? []
  const regular = reschedules.some((item) => item.sourceDate === key) ? null : studySessionForDay(studyPlan, weekdayForDate(date))
  const moved = reschedules.filter((item) => item.targetDate === key).map((item) => ({
    startTime: item.startTime,
    minutesPerDay: item.minutesPerDay,
    subjectId: item.subjectId ?? null,
    subjectName: item.subjectName ?? '',
    topicId: item.topicId ?? null,
    topicNumber: item.topicNumber ?? null,
    topicTitle: item.topicTitle ?? '',
    isRescheduled: true,
    sourceDate: item.sourceDate,
  }))
  return [...(regular ? [{ ...regular, isRescheduled: false }] : []), ...moved]
}

export function className(item) {
  return item.subjectName ? `${item.subjectName} · ${item.subject}` : item.subject
}

export function buildStudyPlans(classes) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return classes.flatMap((course) => course.assessments.map((assessment) => ({ course, assessment }))).map(({ course, assessment }) => {
    const dueDate = new Date(`${assessment.date}T00:00:00`)
    const daysRemaining = Math.ceil((dueDate.valueOf() - today.valueOf()) / 86400000)
    const totalTopics = Math.max(1, Number(assessment.topicEnd) - Number(assessment.topicStart) + 1)
    const weeksRemaining = Math.max(1, Math.ceil(Math.max(0, daysRemaining) / 7))
    const topicsPerWeek = Math.ceil(totalTopics / weeksRemaining)
    const firstTopic = Number(assessment.topicStart)
    const lastTopic = Math.min(Number(assessment.topicEnd), firstTopic + topicsPerWeek - 1)
    const topicTitles = course.topics.filter((topic) => Number(topic.number) >= firstTopic && Number(topic.number) <= lastTopic).map((topic) => topic.title)
    return { course, assessment, daysRemaining, totalTopics, weeksRemaining, topicsPerWeek, firstTopic, lastTopic, topicTitles }
  }).filter((item) => item.daysRemaining >= 0).sort((a, b) => a.assessment.date.localeCompare(b.assessment.date))
}

export function addMinutes(startTime, minutes) {
  const [hours, mins] = startTime.split(':').map(Number)
  const total = (hours * 60 + mins + Number(minutes)) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
