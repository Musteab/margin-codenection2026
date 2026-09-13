import { useState } from 'react'
import { addMinutes, buildStudyPlans, className, studySessionsForDate, weekdayForDate } from './studyPlanUtils'

function formatTime(value) {
  const date = new Date(`2026-01-01T${value}:00`)
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(date)
}

function topicText(plan) {
  if (plan.topicTitles.length) return plan.topicTitles.join(' · ')
  return plan.firstTopic === plan.lastTopic ? `Topic ${plan.firstTopic}` : `Topics ${plan.firstTopic}–${plan.lastTopic}`
}

function sessionTitle(session, fallback) {
  if (session.topicTitle) return session.subjectName || 'Study topic'
  if (session.subjectName) return session.subjectName
  return fallback ? className(fallback.course) : 'General revision'
}

function sessionDetail(session, fallback) {
  if (session.topicTitle) return `Topic ${session.topicNumber ?? ''}${session.topicNumber ? ' · ' : ''}${session.topicTitle}`
  if (session.subjectName) return 'Choose a topic when you are ready.'
  return fallback ? topicText(fallback) : 'Review notes or prepare your next class.'
}

function weekSchedule(plans, studyPlan) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() + index)
    return {
      id: index,
      date,
      day: weekdayForDate(date),
      focus: plans.length ? plans[index % plans.length] : null,
      sessions: studySessionsForDate(studyPlan, date),
    }
  })
}

export default function StudyPlanPage({ subjects, classes, studyPlan, onSaveStudyPlan, onSaveStudyPlanDay }) {
  const [draft, setDraft] = useState(studyPlan)
  const [editingDay, setEditingDay] = useState('')
  const [dayDraft, setDayDraft] = useState({ isAbsent: false, startTime: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const plans = buildStudyPlans(classes)
  const schedule = weekSchedule(plans, studyPlan)
  const presets = [{ label: 'Morning', time: '08:00' }, { label: 'Afternoon', time: '15:00' }, { label: 'Night', time: '20:00' }]
  const selectedSubjectId = draft.subjectId == null || draft.subjectId === '' ? null : Number(draft.subjectId)
  const selectedSubject = subjects.find((item) => item.id === selectedSubjectId)
  const topicOptions = selectedSubjectId == null ? [] : classes.filter((item) => item.subjectId === selectedSubjectId).flatMap((course) => course.topics.map((topic) => ({ ...topic, className: className(course) }))).sort((a, b) => a.number - b.number || a.className.localeCompare(b.className))
  const selectedTopic = topicOptions.find((item) => item.id === Number(draft.topicId))
  const endTime = addMinutes(draft.startTime, draft.minutesPerDay)
  const selectedFocus = selectedTopic ? `Topic ${selectedTopic.number} · ${selectedTopic.title}` : selectedSubject ? selectedSubject.name : 'General revision'

  const save = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await onSaveStudyPlan({
        minutesPerDay: Number(draft.minutesPerDay),
        startTime: draft.startTime,
        subjectId: selectedSubjectId,
        topicId: selectedTopic ? selectedTopic.id : null,
      })
      setMessage('Your default study block and focus are saved.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save your study schedule.')
    } finally {
      setBusy(false)
    }
  }

  const beginDayEdit = (day) => {
    const override = (studyPlan.dayOverrides ?? []).find((item) => item.day === day)
    setEditingDay(day)
    setDayDraft({ isAbsent: override?.isAbsent ?? false, startTime: override?.startTime ?? '' })
    setError('')
    setMessage('')
  }

  const saveDay = async (day) => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await onSaveStudyPlanDay(day, { isAbsent: dayDraft.isAbsent, startTime: dayDraft.isAbsent ? '' : dayDraft.startTime })
      setEditingDay('')
      setMessage(`${day} is updated.`)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update that study day.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="page-view study-plan-page">
    <section className="page-intro"><div><p className="eyebrow">Your study routine</p><h1>Make progress a daily habit.</h1><p>Set one reliable time and a focus topic, then move or skip individual weekdays when life gets in the way.</p></div></section>
    {error && <p className="form-error" role="alert">{error}</p>}
    <section className="study-settings-card">
      <div className="study-settings-copy"><p className="eyebrow">Default daily study block</p><h2>{draft.minutesPerDay} minutes at {formatTime(draft.startTime)}</h2><p>{selectedFocus}. Every day follows this time unless you make a weekday change below. Conflicting slots cannot be saved.</p></div>
      <form className="study-settings-form" onSubmit={save}>
        <label>Minutes per day<select value={draft.minutesPerDay} onChange={(event) => setDraft({ ...draft, minutesPerDay: Number(event.target.value) })}>{[15, 30, 45, 60, 90].map((minutes) => <option value={minutes} key={minutes}>{minutes} minutes</option>)}</select></label>
        <div><span className="study-setting-label">Best time</span><div className="time-presets">{presets.map((preset) => <button type="button" className={draft.startTime === preset.time ? 'active' : ''} onClick={() => setDraft({ ...draft, startTime: preset.time })} key={preset.time}>{preset.label}</button>)}</div></div>
        <label>Custom time<input type="time" value={draft.startTime} onChange={(event) => setDraft({ ...draft, startTime: event.target.value })} /></label>
        <label>Study subject<select value={selectedSubjectId ?? ''} onChange={(event) => setDraft({ ...draft, subjectId: event.target.value ? Number(event.target.value) : null, topicId: null })}><option value="">General revision</option>{subjects.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label>Study topic<select value={draft.topicId ?? ''} disabled={selectedSubjectId == null || !topicOptions.length} onChange={(event) => setDraft({ ...draft, topicId: event.target.value ? Number(event.target.value) : null })}><option value="">{selectedSubjectId == null ? 'Choose a subject first' : topicOptions.length ? 'Choose a topic' : 'No topics for this subject'}</option>{topicOptions.map((topic) => <option value={topic.id} key={topic.id}>Topic {topic.number} · {topic.title} ({topic.className})</option>)}</select></label>
        <button className="form-submit" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save study routine'}</button>
      </form>
    </section>
    {message && <p className="save-note" role="status">{message}</p>}
    <section className="study-week-section">
      <div className="section-heading"><div><p className="eyebrow">Your next seven days</p><h2>Study schedule</h2><p className="study-pace-subtitle">Default: {formatTime(draft.startTime)}–{formatTime(endTime)} every day. A moved session replaces its original date.</p></div></div>
      <div className="study-week-list">{schedule.map((entry) => {
        const dateLabel = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(entry.date)
        const sessions = entry.sessions
        const primarySession = sessions[0]
        const isEditing = editingDay === entry.day
        const movedSession = sessions.find((item) => item.isRescheduled)
        const details = primarySession ? (sessions.length > 1 && movedSession ? `Includes a session moved from ${movedSession.sourceDate}.` : sessionDetail(primarySession, entry.focus)) : ''
        return <div className="study-day" key={entry.date.toISOString()}>
          <article className={`study-session ${sessions.length ? '' : 'absent'}`}>
            <div className="study-session-date"><strong>{entry.id === 0 ? 'TODAY' : dateLabel.split(',')[0].toUpperCase()}</strong><span>{dateLabel.includes(',') ? dateLabel.split(', ')[1] : dateLabel}</span></div>
            <div className="study-session-time">{sessions.length ? sessions.map((item) => <div className="study-time-line" key={`${item.startTime}-${item.sourceDate ?? 'routine'}`}><strong>{formatTime(item.startTime)}</strong><span>{item.minutesPerDay} min{item.isRescheduled ? ' · rescheduled' : item.isOverride ? ' · moved' : ''}</span></div>) : <><strong>Off</strong><span>Rest day</span></>}</div>
            <div className="study-session-focus">{primarySession ? <><span className="course-pill purple">{primarySession.isRescheduled ? 'MOVED STUDY' : 'STUDY'}</span><h3>{sessionTitle(primarySession, entry.focus)}</h3><p>{details}</p></> : <><span className="course-pill green">REST DAY</span><h3>No study block</h3><p>Your usual slot is clear for this date.</p></>}</div>
            <button type="button" className="edit-button study-day-button" onClick={() => beginDayEdit(entry.day)} disabled={busy}>{sessions.length ? 'Move / skip' : 'Edit day'}</button>
          </article>
          {isEditing && <div className="day-override-editor"><strong>{entry.day} adjustment</strong><label className="meeting-toggle"><input type="checkbox" checked={dayDraft.isAbsent} onChange={(event) => setDayDraft({ ...dayDraft, isAbsent: event.target.checked })} />No study this day</label>{!dayDraft.isAbsent && <label>Move study time <input type="time" value={dayDraft.startTime || studyPlan.startTime} onChange={(event) => setDayDraft({ ...dayDraft, startTime: event.target.value })} /></label>}<div className="day-override-actions">{!dayDraft.isAbsent && <button type="button" className="cancel-button" onClick={() => setDayDraft({ ...dayDraft, startTime: '' })}>Use default time</button>}<button type="button" className="form-submit" disabled={busy} onClick={() => saveDay(entry.day)}>{busy ? 'Saving…' : 'Save day'}</button><button type="button" className="cancel-button" onClick={() => setEditingDay('')}>Cancel</button></div></div>}
        </div>
      })}</div>
    </section>
    {plans.length > 0 && <section className="study-focus-section"><div className="section-heading"><div><p className="eyebrow">Why this works</p><h2>Keep each assessment moving</h2></div></div><div className="study-focus-grid">{plans.slice(0, 3).map((plan) => <article key={`focus-${plan.course.id}-${plan.assessment.id}`}><h3>{className(plan.course)}</h3><p>{plan.totalTopics} {plan.totalTopics === 1 ? 'topic' : 'topics'} over {plan.weeksRemaining} {plan.weeksRemaining === 1 ? 'week' : 'weeks'} · aim for {plan.topicsPerWeek} {plan.topicsPerWeek === 1 ? 'topic' : 'topics'} each week.</p></article>)}</div></section>}
  </div>
}
