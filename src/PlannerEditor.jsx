import { useState } from 'react'

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const allDays = [...weekdays, 'Saturday', 'Sunday']
const blankSubject = () => ({ name: '' })
const blankClass = () => ({ subject: '', subjectId: '', day: 'Monday', startTime: '', endTime: '', assessments: [], topics: [] })
const blankClub = () => ({ name: '', hasWeeklyMeeting: false, day: 'Monday', startTime: '', endTime: '' })
const blankEvent = () => ({ name: '', date: '', endDate: '', startTime: '', endTime: '', clubId: 'standalone' })
const blankTask = () => ({ title: '', date: '', startTime: '', endTime: '', isRecurring: false, recurringDay: 'Monday', link: 'standalone' })

function messageFrom(error) {
  return error instanceof Error ? error.message : 'Something went wrong while saving your plan.'
}

function className(item) {
  return item.subjectName ? item.subjectName + ' · ' + item.subject : item.subject
}

function scheduleForTask(task) {
  const date = task.isRecurring ? 'Every ' + task.recurringDay : task.date || 'No date set'
  return date + (task.startTime && task.endTime ? ' · ' + task.startTime + '–' + task.endTime : '')
}

function parseImportedClasses(text) {
  const required = ['Subject', 'Class', 'Day', 'Start', 'End']
  return text.split(/^---\s*$/m).map((section) => section.trim()).filter(Boolean).map((section, index) => {
    const lines = section.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    const values = Object.fromEntries(required.map((label) => {
      const line = lines.find((item) => item.startsWith(label + ':'))
      return [label, line?.slice(label.length + 1).trim()]
    }))
    if (required.some((label) => !values[label])) throw new Error('Block ' + (index + 1) + ' needs Subject, Class, Day, Start, and End.')
    const topicsStart = lines.findIndex((line) => line === 'Topics:')
    if (topicsStart === -1) throw new Error('Block ' + (index + 1) + ' needs a Topics: line.')
    const topics = lines.slice(topicsStart + 1).map((line) => {
      const match = line.match(/^(\d+)\s*\|\s*(.+)$/)
      if (!match) throw new Error('Topic "' + line + '" must use: number | title.')
      return { number: Number(match[1]), title: match[2].trim() }
    })
    if (!topics.length) throw new Error('Block ' + (index + 1) + ' needs at least one topic.')
    return { subjectName: values.Subject, subject: values.Class, day: values.Day, startTime: values.Start, endTime: values.End, topics, assessments: [] }
  })
}

export default function PlannerEditor({
  subjects, classes, clubs, events, tasks, initialTab = 'classes',
  onSaveSubject, onDeleteSubject, onSaveClass, onDeleteClass, onSaveClub, onDeleteClub, onSaveEvent, onDeleteEvent, onSaveTask, onDeleteTask, onImportClasses,
}) {
  const [tab, setTab] = useState(initialTab)
  const [subjectDraft, setSubjectDraft] = useState(blankSubject)
  const [classDraft, setClassDraft] = useState(blankClass)
  const [clubDraft, setClubDraft] = useState(blankClub)
  const [eventDraft, setEventDraft] = useState(blankEvent)
  const [taskDraft, setTaskDraft] = useState(blankTask)
  const [assessmentDraft, setAssessmentDraft] = useState({ date: '', weight: '', topicStart: '', topicEnd: '' })
  const [topicDraft, setTopicDraft] = useState({ number: '', title: '' })
  const [subjectEditId, setSubjectEditId] = useState(null)
  const [classEditId, setClassEditId] = useState(null)
  const [clubEditId, setClubEditId] = useState(null)
  const [eventEditId, setEventEditId] = useState(null)
  const [taskEditId, setTaskEditId] = useState(null)
  const [eventConflict, setEventConflict] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const resetSubject = () => { setSubjectDraft(blankSubject()); setSubjectEditId(null) }
  const resetClass = () => { setClassDraft(blankClass()); setClassEditId(null); setAssessmentDraft({ date: '', weight: '', topicStart: '', topicEnd: '' }); setTopicDraft({ number: '', title: '' }) }
  const resetClub = () => { setClubDraft(blankClub()); setClubEditId(null) }
  const resetEvent = () => { setEventDraft(blankEvent()); setEventEditId(null); setEventConflict(null) }
  const changeEventDraft = (changes) => { setEventDraft((draft) => ({ ...draft, ...changes })); setEventConflict(null) }
  const resetTask = () => { setTaskDraft(blankTask()); setTaskEditId(null) }
  const run = async (work) => { setBusy(true); setError(''); try { await work() } catch (saveError) { setError(messageFrom(saveError)) } finally { setBusy(false) } }

  const addAssessment = () => {
    if (!assessmentDraft.date || !assessmentDraft.weight || !assessmentDraft.topicStart || !assessmentDraft.topicEnd) return
    if (Number(assessmentDraft.topicEnd) < Number(assessmentDraft.topicStart)) { setError('The end of a topic range must not come before its start.'); return }
    setClassDraft((draft) => ({ ...draft, assessments: [...draft.assessments, { ...assessmentDraft, id: crypto.randomUUID() }] }))
    setAssessmentDraft({ date: '', weight: '', topicStart: '', topicEnd: '' })
  }
  const addTopic = () => {
    if (!topicDraft.number || !topicDraft.title.trim()) return
    const number = Number(topicDraft.number)
    if (classDraft.topics.some((topic) => Number(topic.number) === number)) { setError('Each topic number can only be used once.'); return }
    setClassDraft((draft) => ({ ...draft, topics: [...draft.topics, { id: crypto.randomUUID(), number, title: topicDraft.title.trim() }].sort((a, b) => a.number - b.number) }))
    setTopicDraft({ number: '', title: '' })
  }

  const saveSubject = () => run(async () => {
    if (!subjectDraft.name.trim()) throw new Error('Add a subject name.')
    await onSaveSubject(subjectDraft, subjectEditId)
    resetSubject()
  })
  const saveClass = () => run(async () => {
    if (!classDraft.subject.trim() || !classDraft.startTime || !classDraft.endTime) throw new Error('Add a class name, start time, and end time.')
    const maxTopic = Math.max(0, ...classDraft.assessments.map((item) => Number(item.topicEnd)), ...classDraft.topics.map((item) => Number(item.number)))
    const titles = new Map(classDraft.topics.map((item) => [Number(item.number), item.title]))
    const topics = Array.from({ length: maxTopic }, (_, index) => ({ number: index + 1, title: titles.get(index + 1) || 'Topic ' + (index + 1) }))
    await onSaveClass({ ...classDraft, subjectId: classDraft.subjectId ? Number(classDraft.subjectId) : null, topics }, classEditId)
    resetClass()
  })
  const saveClub = () => run(async () => {
    if (!clubDraft.name.trim()) throw new Error('Add a club name.')
    if (clubDraft.hasWeeklyMeeting && (!clubDraft.startTime || !clubDraft.endTime)) throw new Error('Add start and end times for the weekly meeting.')
    await onSaveClub(clubDraft, clubEditId)
    resetClub()
  })
  const eventPayload = (studyReschedules = []) => ({ ...eventDraft, clubId: eventDraft.clubId === 'standalone' ? null : Number(eventDraft.clubId), studyReschedules })
  const showStudyReschedule = (saveError) => {
    const conflicts = saveError instanceof Error ? saveError.details?.studyConflicts : null
    if (!Array.isArray(conflicts) || !conflicts.length) return false
    setEventConflict({
      conflicts,
      replacements: Object.fromEntries(conflicts.map((item) => [item.sourceDate, { targetDate: '', startTime: '' }])),
    })
    setError('')
    return true
  }
  const saveEvent = () => run(async () => {
    if (!eventDraft.name.trim() || !eventDraft.date || !eventDraft.startTime || !eventDraft.endTime) throw new Error('Add an event name, date, start time, and end time.')
    try {
      await onSaveEvent(eventPayload(), eventEditId)
    } catch (saveError) {
      if (showStudyReschedule(saveError)) return
      throw saveError
    }
    resetEvent()
  })
  const saveEventWithReschedule = () => run(async () => {
    if (!eventConflict) return
    const studyReschedules = eventConflict.conflicts.map((item) => ({ sourceDate: item.sourceDate, ...eventConflict.replacements[item.sourceDate] }))
    if (studyReschedules.some((item) => !item.targetDate || !item.startTime)) throw new Error('Choose a new date and time for every affected study session.')
    try {
      await onSaveEvent(eventPayload(studyReschedules), eventEditId)
    } catch (saveError) {
      if (showStudyReschedule(saveError)) return
      throw saveError
    }
    resetEvent()
  })
  const saveTask = () => run(async () => {
    if (!taskDraft.title.trim()) throw new Error('Add a task title.')
    const [type, rawId] = taskDraft.link.split(':')
    await onSaveTask({ ...taskDraft, classId: type === 'class' ? Number(rawId) : null, clubId: type === 'club' ? Number(rawId) : null, eventId: type === 'event' ? Number(rawId) : null }, taskEditId)
    resetTask()
  })
  const importClasses = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    await run(async () => { await onImportClasses(parseImportedClasses(await file.text())) })
    event.target.value = ''
  }

  const taskLinkOptions = [{ value: 'standalone', label: 'General / standalone' }, ...classes.map((item) => ({ value: 'class:' + item.id, label: 'Class · ' + className(item) })), ...clubs.map((item) => ({ value: 'club:' + item.id, label: 'Club · ' + item.name })), ...events.map((item) => ({ value: 'event:' + item.id, label: 'Event · ' + item.name }))]
  const taskLink = (item) => item.classId ? 'class:' + item.classId : item.clubId ? 'club:' + item.clubId : item.eventId ? 'event:' + item.eventId : 'standalone'
  const taskLinkLabel = (item) => taskLinkOptions.find((option) => option.value === taskLink(item))?.label ?? 'General / standalone'
  const tabs = [{ id: 'subjects', label: 'Subjects', count: subjects.length }, { id: 'classes', label: 'Classes', count: classes.length }, { id: 'clubs', label: 'Clubs', count: clubs.length }, { id: 'events', label: 'Events', count: events.length }, { id: 'tasks', label: 'Tasks', count: tasks.length }]

  return <div className="page-view manage-page">
    <section className="page-intro"><div><p className="eyebrow">Your editable schedule</p><h1>Keep your real week up to date.</h1><p>Subjects, classes, clubs, events, and tasks are managed here and saved to your planner.</p></div></section>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="editor-tabs" role="tablist" aria-label="Schedule editor">{tabs.map((item) => <button type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => { setTab(item.id); setError('') }} key={item.id}>{item.label}<span>{item.count}</span></button>)}</div>

    {tab === 'subjects' && <section className="editor-layout"><form className="editor-form" onSubmit={(event) => { event.preventDefault(); saveSubject() }}><div className="form-heading"><div><p className="eyebrow">{subjectEditId ? 'Update a subject' : 'Add a subject'}</p><h2>{subjectEditId ? 'Edit subject' : 'Subject details'}</h2></div></div><label>Subject name<input value={subjectDraft.name} onChange={(event) => setSubjectDraft({ name: event.target.value })} placeholder="e.g. Data Structures" /></label><div className="form-actions"><button className="form-submit" type="submit" disabled={busy}>{busy ? 'Saving…' : subjectEditId ? 'Save subject' : 'Add subject'}</button>{subjectEditId && <button className="cancel-button" type="button" onClick={resetSubject}>Cancel</button>}</div></form><div className="editor-list"><div className="editor-list-heading"><div><p className="eyebrow">Your subjects</p><h2>{subjects.length} subjects</h2></div></div>{subjects.length ? subjects.map((item) => { const count = classes.filter((entry) => entry.subjectId === item.id).length; return <article className="editable-item detailed-item" key={item.id}><span className="item-symbol purple">S</span><div><h3>{item.name}</h3><p>{count} linked class{count === 1 ? '' : 'es'}</p></div><div className="item-actions"><button type="button" className="edit-button" onClick={() => { setSubjectEditId(item.id); setSubjectDraft({ name: item.name }) }}>Edit</button><button type="button" className="delete-button" disabled={busy} onClick={() => run(() => onDeleteSubject(item.id))}>Delete</button></div></article> }) : <p className="empty-state">Add a subject before linking class sessions to it.</p>}</div></section>}

    {tab === 'classes' && <section className="editor-layout"><form className="editor-form assessment-form" onSubmit={(event) => { event.preventDefault(); saveClass() }}><div className="form-heading"><div><p className="eyebrow">{classEditId ? 'Update a class session' : 'Add a class session'}</p><h2>{classEditId ? 'Edit class' : 'Class details'}</h2></div></div><label>Subject <span>optional</span><select value={classDraft.subjectId} onChange={(event) => setClassDraft({ ...classDraft, subjectId: event.target.value })}><option value="">No linked subject</option>{subjects.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Class name<input value={classDraft.subject} onChange={(event) => setClassDraft({ ...classDraft, subject: event.target.value })} placeholder="e.g. Lecture or Practical" /></label><label>Day<select value={classDraft.day} onChange={(event) => setClassDraft({ ...classDraft, day: event.target.value })}>{weekdays.map((day) => <option key={day}>{day}</option>)}</select></label><div className="form-row"><label>Start time<input type="time" value={classDraft.startTime} onChange={(event) => setClassDraft({ ...classDraft, startTime: event.target.value })} /></label><label>End time<input type="time" value={classDraft.endTime} onChange={(event) => setClassDraft({ ...classDraft, endTime: event.target.value })} /></label></div><div className="assessment-builder"><div className="assessment-builder-heading"><div><p className="eyebrow">Topics</p><h3>List your class content</h3></div><span>{classDraft.topics.length}</span></div><div className="form-row"><label>Topic number<input type="number" min="1" step="1" value={topicDraft.number} onChange={(event) => setTopicDraft({ ...topicDraft, number: event.target.value })} /></label><label>Topic title<input value={topicDraft.title} onChange={(event) => setTopicDraft({ ...topicDraft, title: event.target.value })} placeholder="e.g. Linked lists" /></label></div><button type="button" className="secondary-add" onClick={addTopic}>+ Add topic</button>{classDraft.topics.length > 0 && <div className="assessment-list">{classDraft.topics.map((topic) => <div className="assessment-chip" key={topic.id ?? topic.number}><span><b>{topic.number}</b>{topic.title}</span><button type="button" aria-label={'Remove topic ' + topic.number} onClick={() => setClassDraft((draft) => ({ ...draft, topics: draft.topics.filter((item) => Number(item.number) !== Number(topic.number)) }))}>×</button></div>)}</div>}</div><div className="assessment-builder"><div className="assessment-builder-heading"><div><p className="eyebrow">Assessments</p><h3>Add as many as you need</h3></div><span>{classDraft.assessments.length}</span></div><div className="form-row"><label>Date<input type="date" value={assessmentDraft.date} onChange={(event) => setAssessmentDraft({ ...assessmentDraft, date: event.target.value })} /></label><label>Weightage %<input type="number" min="0" max="100" value={assessmentDraft.weight} onChange={(event) => setAssessmentDraft({ ...assessmentDraft, weight: event.target.value })} placeholder="30" /></label></div><div className="form-row"><label>Topics from<input type="number" min="1" step="1" value={assessmentDraft.topicStart} onChange={(event) => setAssessmentDraft({ ...assessmentDraft, topicStart: event.target.value })} /></label><label>Topics to<input type="number" min="1" step="1" value={assessmentDraft.topicEnd} onChange={(event) => setAssessmentDraft({ ...assessmentDraft, topicEnd: event.target.value })} /></label></div><button type="button" className="secondary-add" onClick={addAssessment}>+ Add assessment</button>{classDraft.assessments.length > 0 && <div className="assessment-list">{classDraft.assessments.map((assessment) => <div className="assessment-chip" key={assessment.id}><span><b>{assessment.date}</b>{assessment.weight}% · topics {assessment.topicStart}–{assessment.topicEnd}</span><button type="button" aria-label={'Remove assessment on ' + assessment.date} onClick={() => setClassDraft((draft) => ({ ...draft, assessments: draft.assessments.filter((item) => item.id !== assessment.id) }))}>×</button></div>)}</div>}</div><div className="import-note"><strong>Import class sessions from a TXT file</strong><p>Use <code>Subject:</code>, <code>Class:</code>, <code>Day:</code>, <code>Start:</code>, <code>End:</code>, then <code>Topics:</code> with <code>number | title</code>. Separate sessions with <code>---</code>.</p><a href="/mock-subjects.txt" download>Download the two-subject sample</a><input type="file" accept=".txt,text/plain" onChange={importClasses} disabled={busy} /></div><div className="form-actions"><button className="form-submit" type="submit" disabled={busy}>{busy ? 'Saving…' : classEditId ? 'Save class' : 'Add class'}</button>{classEditId && <button className="cancel-button" type="button" onClick={resetClass}>Cancel</button>}</div></form><div className="editor-list"><div className="editor-list-heading"><div><p className="eyebrow">Your weekly classes</p><h2>{classes.length} classes</h2></div></div>{classes.length ? classes.map((item) => <article className="editable-item detailed-item" key={item.id}><span className="item-symbol purple">C</span><div><h3>{className(item)}</h3><p>{item.day} · {item.startTime}–{item.endTime}</p><small>{item.assessments.length ? item.assessments.length + ' assessment' + (item.assessments.length === 1 ? '' : 's') : 'No assessments added'}</small></div><div className="item-actions"><button type="button" className="edit-button" onClick={() => { setClassEditId(item.id); setClassDraft({ ...item, subjectId: item.subjectId ? String(item.subjectId) : '' }); setError('') }}>Edit</button><button type="button" className="delete-button" disabled={busy} onClick={() => run(() => onDeleteClass(item.id))}>Delete</button></div></article>) : <p className="empty-state">No classes yet. Add your first weekly class.</p>}</div></section>}

    {tab === 'clubs' && <section className="editor-layout"><form className="editor-form" onSubmit={(event) => { event.preventDefault(); saveClub() }}><div className="form-heading"><div><p className="eyebrow">{clubEditId ? 'Update a club' : 'Add a club'}</p><h2>{clubEditId ? 'Edit club' : 'Club details'}</h2></div></div><label>Club name<input value={clubDraft.name} onChange={(event) => setClubDraft({ ...clubDraft, name: event.target.value })} placeholder="e.g. Coding Society" /></label><label className="meeting-toggle"><input type="checkbox" checked={clubDraft.hasWeeklyMeeting} onChange={(event) => setClubDraft({ ...clubDraft, hasWeeklyMeeting: event.target.checked })} />This club meets weekly</label>{clubDraft.hasWeeklyMeeting && <><label>Meeting day<select value={clubDraft.day} onChange={(event) => setClubDraft({ ...clubDraft, day: event.target.value })}>{allDays.map((day) => <option key={day}>{day}</option>)}</select></label><div className="form-row"><label>Start time<input type="time" value={clubDraft.startTime} onChange={(event) => setClubDraft({ ...clubDraft, startTime: event.target.value })} /></label><label>End time<input type="time" value={clubDraft.endTime} onChange={(event) => setClubDraft({ ...clubDraft, endTime: event.target.value })} /></label></div></>}<div className="form-actions"><button className="form-submit" type="submit" disabled={busy}>{busy ? 'Saving…' : clubEditId ? 'Save club' : 'Add club'}</button>{clubEditId && <button className="cancel-button" type="button" onClick={resetClub}>Cancel</button>}</div></form><div className="editor-list"><div className="editor-list-heading"><div><p className="eyebrow">Your clubs</p><h2>{clubs.length} clubs</h2></div></div>{clubs.length ? clubs.map((item) => <article className="editable-item detailed-item" key={item.id}><span className="item-symbol green">C</span><div><h3>{item.name}</h3><p>{item.hasWeeklyMeeting ? 'Every ' + item.day + ' · ' + item.startTime + '–' + item.endTime : 'No weekly meeting'}</p><small>{item.hasWeeklyMeeting ? 'Weekly commitment' : 'Flexible club'}</small></div><div className="item-actions"><button type="button" className="edit-button" onClick={() => { setClubEditId(item.id); setClubDraft({ ...item }); setError('') }}>Edit</button><button type="button" className="delete-button" disabled={busy} onClick={() => run(() => onDeleteClub(item.id))}>Delete</button></div></article>) : <p className="empty-state">No clubs yet. Add one whenever you are ready.</p>}</div></section>}

    {tab === 'events' && <section className="editor-layout">
      <form className="editor-form" onSubmit={(event) => { event.preventDefault(); saveEvent() }}>
        <div className="form-heading"><div><p className="eyebrow">{eventEditId ? 'Update a one-off item' : 'Add a one-off item'}</p><h2>{eventEditId ? 'Edit event' : 'Event details'}</h2></div></div>
        <label>Event name<input value={eventDraft.name} onChange={(event) => changeEventDraft({ name: event.target.value })} placeholder="e.g. Hackathon" /></label>
        <div className="form-row date-row"><label>Start date<input type="date" value={eventDraft.date} onChange={(event) => changeEventDraft({ date: event.target.value })} /></label><label>End date <span>optional</span><input type="date" value={eventDraft.endDate} onChange={(event) => changeEventDraft({ endDate: event.target.value })} /></label></div>
        <div className="form-row"><label>Start time<input type="time" value={eventDraft.startTime} onChange={(event) => changeEventDraft({ startTime: event.target.value })} /></label><label>End time<input type="time" value={eventDraft.endTime} onChange={(event) => changeEventDraft({ endTime: event.target.value })} /></label></div>
        <label>Linked club<select value={eventDraft.clubId} onChange={(event) => changeEventDraft({ clubId: event.target.value })}><option value="standalone">Standalone event</option>{clubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}</select></label>
        {eventConflict ? <section className="event-study-conflict" role="alert"><div><p className="eyebrow">Study session needs a new slot</p><h3>This event overlaps your study time.</h3><p>Pick a replacement date and time for every affected session, or cancel this event.</p></div><div className="reschedule-list">{eventConflict.conflicts.map((item) => <div className="reschedule-row" key={item.sourceDate}><div className="reschedule-source"><strong>{item.sourceDate}</strong><span>{item.startTime} · {item.minutesPerDay} min study</span></div><label>New date<input type="date" value={eventConflict.replacements[item.sourceDate]?.targetDate ?? ''} onChange={(event) => setEventConflict((current) => ({ ...current, replacements: { ...current.replacements, [item.sourceDate]: { ...current.replacements[item.sourceDate], targetDate: event.target.value } } }))} /></label><label>New time<input type="time" value={eventConflict.replacements[item.sourceDate]?.startTime ?? ''} onChange={(event) => setEventConflict((current) => ({ ...current, replacements: { ...current.replacements, [item.sourceDate]: { ...current.replacements[item.sourceDate], startTime: event.target.value } } }))} /></label></div>)}</div><div className="form-actions"><button className="form-submit" type="button" onClick={saveEventWithReschedule} disabled={busy}>{busy ? 'Saving…' : 'Save event & reschedule'}</button><button className="cancel-button" type="button" onClick={resetEvent} disabled={busy}>Cancel event</button></div></section> : <div className="form-actions"><button className="form-submit" type="submit" disabled={busy}>{busy ? 'Saving…' : eventEditId ? 'Save event' : 'Add event'}</button>{eventEditId && <button className="cancel-button" type="button" onClick={resetEvent}>Cancel</button>}</div>}
      </form>
      <div className="editor-list"><div className="editor-list-heading"><div><p className="eyebrow">Dates to remember</p><h2>{events.length} events</h2></div></div>{events.length ? events.map((item) => { const club = clubs.find((entry) => entry.id === item.clubId); return <article className="editable-item detailed-item" key={item.id}><span className="item-symbol orange">E</span><div><h3>{item.name}</h3><p>{item.endDate ? item.date + ' → ' + item.endDate : item.date} · {item.startTime}–{item.endTime}</p><small>{club ? 'Linked to ' + club.name : 'Standalone event'}</small></div><div className="item-actions"><button type="button" className="edit-button" onClick={() => { setEventEditId(item.id); setEventDraft({ ...item, clubId: item.clubId == null ? 'standalone' : String(item.clubId) }); setEventConflict(null); setError('') }}>Edit</button><button type="button" className="delete-button" disabled={busy} onClick={() => run(() => onDeleteEvent(item.id))}>Delete</button></div></article> }) : <p className="empty-state">No events yet. Add a date worth protecting.</p>}</div>
    </section>}

    {tab === 'tasks' && <section className="editor-layout"><form className="editor-form" onSubmit={(event) => { event.preventDefault(); saveTask() }}><div className="form-heading"><div><p className="eyebrow">{taskEditId ? 'Update a task' : 'Add a task'}</p><h2>{taskEditId ? 'Edit task' : 'Task details'}</h2></div></div><label>Task title<input value={taskDraft.title} onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })} placeholder="e.g. Review lecture notes" /></label><label>Associate with<select value={taskDraft.link} onChange={(event) => setTaskDraft({ ...taskDraft, link: event.target.value })}>{taskLinkOptions.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label className="meeting-toggle"><input type="checkbox" checked={taskDraft.isRecurring} onChange={(event) => setTaskDraft({ ...taskDraft, isRecurring: event.target.checked })} />This task repeats weekly</label>{taskDraft.isRecurring ? <label>Repeat every<select value={taskDraft.recurringDay} onChange={(event) => setTaskDraft({ ...taskDraft, recurringDay: event.target.value })}>{allDays.map((day) => <option key={day}>{day}</option>)}</select></label> : <label>Target date <span>optional</span><input type="date" value={taskDraft.date} onChange={(event) => setTaskDraft({ ...taskDraft, date: event.target.value })} /></label>}<div className="form-row"><label>Start time <span>optional</span><input type="time" value={taskDraft.startTime} onChange={(event) => setTaskDraft({ ...taskDraft, startTime: event.target.value })} /></label><label>End time <span>optional</span><input type="time" value={taskDraft.endTime} onChange={(event) => setTaskDraft({ ...taskDraft, endTime: event.target.value })} /></label></div><div className="form-actions"><button className="form-submit" type="submit" disabled={busy}>{busy ? 'Saving…' : taskEditId ? 'Save task' : 'Add task'}</button>{taskEditId && <button className="cancel-button" type="button" onClick={resetTask}>Cancel</button>}</div></form><div className="editor-list"><div className="editor-list-heading"><div><p className="eyebrow">Tasks in your plan</p><h2>{tasks.length} tasks</h2></div></div>{tasks.length ? tasks.map((item) => <article className="editable-item detailed-item" key={item.id}><span className="item-symbol purple">T</span><div><h3>{item.title}</h3><p>{scheduleForTask(item)}</p><small>{taskLinkLabel(item)}</small></div><div className="item-actions"><button type="button" className="edit-button" onClick={() => { setTaskEditId(item.id); setTaskDraft({ ...item, link: taskLink(item) }); setError('') }}>Edit</button><button type="button" className="delete-button" disabled={busy} onClick={() => run(() => onDeleteTask(item.id))}>Delete</button></div></article>) : <p className="empty-state">No tasks yet. Add something you want to stay on top of.</p>}</div></section>}
  </div>
}
