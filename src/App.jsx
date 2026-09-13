import { useEffect, useState } from 'react'
import './App.css'
import PlannerEditor from './PlannerEditor'
import { ClassTopics, PlannerCalendar, PlannerClubs, PlannerCourses } from './PlannerViews'
import ScheduleCalendar from './ScheduleCalendar'
import StudyPlanPage from './StudyPlan'
import { buildStudyPlans } from './studyPlanUtils'
import { DEMO, demoApi } from './demoApi'

const Icon = ({ name, size = 20, stroke = 1.8 }) => {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" /></>,
    check: <path d="m5 12 4.5 4.5L19 7" />,
  }
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: 'grid' }, { id: 'plan', label: 'Plan', icon: 'target' }, { id: 'calendar', label: 'Calendar', icon: 'calendar' }, { id: 'classes', label: 'Classes', icon: 'book' }, { id: 'clubs', label: 'Clubs', icon: 'users' }, { id: 'manage', label: 'Edit plan', icon: 'plus' },
]

async function api(path, options = {}) {
  // the public prototype build ships without the FastAPI service behind it
  if (DEMO) return demoApi(path, options)
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) } })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const detail = Array.isArray(body?.detail) ? body.detail[0]?.msg : body?.detail
    const error = new Error(typeof detail === 'string' ? detail : detail?.message || 'Something went wrong while saving your plan.')
    error.details = detail
    throw error
  }
  return response.status === 204 ? null : response.json()
}

function formatDate(value) {
  if (!value) return 'Unscheduled'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
}

function StudyPace({ goTo, classes }) {
  const plans = buildStudyPlans(classes).slice(0, 3)
  const className = (item) => item.subjectName ? `${item.subjectName} · ${item.subject}` : item.subject
  return <section className="study-pace-section"><div className="section-heading"><div><p className="eyebrow">Steady progress</p><h2>Your study pace</h2><p className="study-pace-subtitle">Small weekly targets make every assessment feel manageable.</p></div><button className="subtle-action" onClick={() => goTo('manage', 'classes')}>Edit assessments <Icon name="chevron" size={15} /></button></div><div className="study-pace-grid">{plans.length ? plans.map((plan) => { const dueLabel = plan.daysRemaining === 0 ? 'Due today' : plan.daysRemaining === 1 ? 'Due tomorrow' : plan.weeksRemaining === 1 ? 'Due this week' : `${plan.weeksRemaining} weeks to go`; const weeklyText = plan.topicsPerWeek === 1 ? '1 topic each week' : `${plan.topicsPerWeek} topics each week`; const topicText = plan.firstTopic === plan.lastTopic ? `Topic ${plan.firstTopic}` : `Topics ${plan.firstTopic}–${plan.lastTopic}`; const startText = plan.topicTitles.length ? plan.topicTitles.join(' · ') : topicText; return <article className="study-pace-card" key={`pace-${plan.course.id}-${plan.assessment.id}`}><div className="study-pace-card-head"><span className="course-pill purple">STUDY PLAN</span><span className="study-due">{dueLabel}</span></div><h3>{className(plan.course)}</h3><p className="study-assessment">Assessment · {formatDate(plan.assessment.date)} · {plan.assessment.weight}%</p><div className="study-target"><strong>{weeklyText}</strong><span>{plan.totalTopics} {plan.totalTopics === 1 ? 'topic' : 'topics'} over {plan.weeksRemaining} {plan.weeksRemaining === 1 ? 'week' : 'weeks'}</span></div><p className="study-start"><b>Start this week:</b> {startText}</p></article> }) : <article className="study-pace-empty"><h3>No upcoming study targets yet.</h3><p>Add an assessment with a topic range and we’ll turn it into a weekly pace.</p><button className="small-dark-button" onClick={() => goTo('manage', 'classes')}>Add assessment</button></article>}</div></section>
}

function Overview({ goTo, classes, clubs, events, tasks, studyPlan }) {
  const className = (item) => item.subjectName ? `${item.subjectName} · ${item.subject}` : item.subject
  const plannedItems = [
    ...classes.map((item) => ({ id: `class-${item.id}`, title: className(item), detail: `${item.day} · ${item.startTime}–${item.endTime}`, type: 'class' })),
    ...clubs.filter((item) => item.hasWeeklyMeeting).map((item) => ({ id: `club-${item.id}`, title: item.name, detail: `Every ${item.day} · ${item.startTime}–${item.endTime}`, type: 'club' })),
    ...tasks.filter((item) => item.isRecurring || item.date).map((item) => ({ id: `task-${item.id}`, title: item.title, detail: item.isRecurring ? `Every ${item.recurringDay}` : formatDate(item.date), type: 'focus' })),
  ].slice(0, 4)
  const upcoming = [
    ...events.map((item) => ({ id: `event-${item.id}`, date: item.date, title: item.name, detail: item.endDate ? `${formatDate(item.date)}–${formatDate(item.endDate)}` : `${formatDate(item.date)} · ${item.startTime}–${item.endTime}`, type: 'Event' })),
    ...tasks.filter((item) => !item.isRecurring && item.date).map((item) => ({ id: `task-${item.id}`, date: item.date, title: item.title, detail: 'Task', type: 'Task' })),
    ...classes.flatMap((course) => course.assessments.map((assessment) => ({ id: `assessment-${assessment.id}`, date: assessment.date, title: `${className(course)} assessment`, detail: `Topics ${assessment.topicStart}–${assessment.topicEnd} · ${assessment.weight}%`, type: 'Assessment' }))),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4)

  return <><section className="welcome-section"><div className="welcome-copy"><p className="eyebrow">Your study rhythm</p><h1>Your week, clearly mapped.</h1><p className="welcome-subtitle">Everything below comes from the schedule and tasks you have saved.</p></div><button className="create-button" onClick={() => goTo('manage', 'tasks')}><Icon name="plus" size={18} />Add task</button></section>
    <section className="pace-banner"><div className="pace-overview"><div className="pace-orbit"><span className="orbit-core"><Icon name="target" size={19} /></span></div><div><p className="eyebrow">Your plan</p><h2>{plannedItems.length ? 'Your week is taking shape.' : 'Start building your week.'}</h2><p className="pace-description">{classes.length} classes · {clubs.length} clubs · {tasks.length} tasks</p></div></div><div className="pace-stat"><strong>{events.length}</strong><span>events saved</span></div><div className="pace-stat"><strong>{upcoming.length}</strong><span>upcoming items</span></div><button className="text-link button-link" onClick={() => goTo('calendar')}>View calendar <Icon name="arrow" size={16} /></button></section>
    <StudyPace goTo={goTo} classes={classes} />
    <div className="content-grid"><div className="dashboard-column"><section className="section-block"><div className="section-heading"><div><p className="eyebrow">From your planner</p><h2>Your commitments</h2></div><button className="subtle-action" onClick={() => goTo('calendar')}>View calendar <Icon name="chevron" size={15} /></button></div><div className="session-list">{plannedItems.length ? plannedItems.map((item) => <article className={`session-card ${item.type}`} key={item.id}><div className="session-time"><strong>{item.type === 'class' ? 'CLASS' : item.type === 'club' ? 'CLUB' : 'TASK'}</strong></div><span className="session-icon"><Icon name={item.type === 'class' ? 'book' : item.type === 'club' ? 'users' : 'target'} size={18} /></span><div className="session-detail"><h3>{item.title}</h3><p>{item.detail}</p></div></article>) : <p className="empty-state">Add a class, club, event, or task to see it here.</p>}</div><button className="add-line" onClick={() => goTo('manage', 'tasks')}><Icon name="plus" size={16} />Add a task</button></section><section className="section-block calendar-section"><div className="section-heading"><div><p className="eyebrow">Your saved weekly schedule</p><h2>Week at a glance</h2></div><button className="subtle-action" onClick={() => goTo('calendar')}>Full calendar <Icon name="chevron" size={15} /></button></div><ScheduleCalendar classes={classes} clubs={clubs} events={events} tasks={tasks} studyPlan={studyPlan} /></section></div>
    <aside className="right-rail"><section className="rail-card deadlines-card"><div className="rail-heading"><div><p className="eyebrow">Keep an eye on</p><h2>Upcoming</h2></div></div>{upcoming.length ? upcoming.map((item) => <article className="deadline-item" key={item.id}><span className="date-badge"><strong>{formatDate(item.date).split(' ')[1] ?? ''}</strong><small>{formatDate(item.date).split(' ')[0] ?? ''}</small></span><div><span className="course-pill purple">{item.type.toUpperCase()}</span><h3>{item.title}</h3><p>{item.detail}</p></div></article>) : <p className="empty-state">No dated tasks, events, or assessments yet.</p>}<button className="rail-link button-link" onClick={() => goTo('manage', 'tasks')}>Manage tasks <Icon name="arrow" size={15} /></button></section><section className="upload-card"><p className="eyebrow">Stay in control</p><h2>Everything is editable in one place.</h2><p>Keep your classes, clubs, events, and tasks current as your week changes.</p><button onClick={() => goTo('manage', 'classes')}>Edit plan <Icon name="arrow" size={16} /></button></section></aside></div>
  </>
}

function App() {
  const [activePage, setActivePage] = useState('overview')
  const [editTab, setEditTab] = useState('classes')
  const [subjects, setSubjects] = useState([])
  const [classes, setClasses] = useState([])
  const [clubs, setClubs] = useState([])
  const [events, setEvents] = useState([])
  const [tasks, setTasks] = useState([])
  const [studyPlan, setStudyPlan] = useState({ minutesPerDay: 30, startTime: '20:00', subjectId: null, subjectName: '', topicId: null, topicNumber: null, topicTitle: '', dayOverrides: [], studyReschedules: [] })
  const [loadError, setLoadError] = useState('')

  const goTo = (page, targetTab) => {
    if (page === 'manage') setEditTab(targetTab || 'classes')
    setActivePage(page)
  }
  useEffect(() => {
    let cancelled = false
    api('/api/bootstrap').then((planner) => {
      if (!cancelled) { setSubjects(planner.subjects ?? []); setClasses(planner.classes); setClubs(planner.clubs); setEvents(planner.events); setTasks(planner.tasks ?? []); setStudyPlan(planner.studyPlan ?? { minutesPerDay: 30, startTime: '20:00', subjectId: null, subjectName: '', topicId: null, topicNumber: null, topicTitle: '', dayOverrides: [], studyReschedules: [] }) }
    }).catch((error) => { if (!cancelled) setLoadError(error.message) })
    return () => { cancelled = true }
  }, [])

  const save = (path, setter) => async (record, id) => {
    const saved = await api(id ? `${path}/${id}` : path, { method: id ? 'PUT' : 'POST', body: JSON.stringify(record) })
    setter((current) => id ? current.map((item) => item.id === id ? saved : item) : [...current, saved])
  }
  const remove = (path, setter) => async (id) => { await api(`${path}/${id}`, { method: 'DELETE' }); setter((current) => current.filter((item) => item.id !== id)) }
  const saveSubject = async (record, id) => {
    const saved = await api(id ? `/api/subjects/${id}` : '/api/subjects', { method: id ? 'PUT' : 'POST', body: JSON.stringify(record) })
    setSubjects((current) => (id ? current.map((item) => item.id === id ? saved : item) : [...current, saved]).sort((a, b) => a.name.localeCompare(b.name)))
    if (id) setClasses((current) => current.map((item) => item.subjectId === id ? { ...item, subjectName: saved.name } : item))
  }
  const saveClass = save('/api/classes', setClasses)
  const saveClub = save('/api/clubs', setClubs)
  const saveEvent = async (record, id) => {
    const saved = await api(id ? `/api/events/${id}` : '/api/events', { method: id ? 'PUT' : 'POST', body: JSON.stringify(record) })
    setEvents((current) => id ? current.map((item) => item.id === id ? saved : item) : [...current, saved])
    setStudyPlan(await api('/api/study-plan'))
  }
  const saveTask = save('/api/tasks', setTasks)
  const saveStudyPlan = async (record) => {
    const saved = await api('/api/study-plan', { method: 'PUT', body: JSON.stringify(record) })
    setStudyPlan(saved)
  }
  const saveStudyPlanDay = async (day, record) => {
    const saved = await api(`/api/study-plan/days/${encodeURIComponent(day)}`, { method: 'PUT', body: JSON.stringify(record) })
    setStudyPlan(saved)
    return saved
  }
  const deleteSubject = async (id) => {
    await remove('/api/subjects', setSubjects)(id)
    setClasses((current) => current.map((item) => item.subjectId === id ? { ...item, subjectId: null, subjectName: '' } : item))
    setStudyPlan(await api('/api/study-plan'))
  }
  const deleteClass = async (id) => { await remove('/api/classes', setClasses)(id); setTasks((current) => current.map((item) => item.classId === id ? { ...item, classId: null } : item)); setStudyPlan(await api('/api/study-plan')) }
  const deleteClub = async (id) => { await remove('/api/clubs', setClubs)(id); setEvents((current) => current.map((item) => item.clubId === id ? { ...item, clubId: null } : item)); setTasks((current) => current.map((item) => item.clubId === id ? { ...item, clubId: null } : item)) }
  const deleteEvent = async (id) => { await remove('/api/events', setEvents)(id); setTasks((current) => current.map((item) => item.eventId === id ? { ...item, eventId: null } : item)); setStudyPlan(await api('/api/study-plan')) }
  const deleteTask = remove('/api/tasks', setTasks)
  const importClasses = async (records) => {
    const knownSubjects = new Map(subjects.map((item) => [item.name.trim().toLocaleLowerCase(), item]))
    const addedSubjects = []
    const addedClasses = []
    for (const record of records) {
      const subjectName = record.subjectName.trim()
      const key = subjectName.toLocaleLowerCase()
      let linkedSubject = knownSubjects.get(key)
      if (!linkedSubject) {
        linkedSubject = await api('/api/subjects', { method: 'POST', body: JSON.stringify({ name: subjectName }) })
        knownSubjects.set(key, linkedSubject)
        addedSubjects.push(linkedSubject)
      }
      const saved = await api('/api/classes', {
        method: 'POST',
        body: JSON.stringify({ subject: record.subject, subjectId: linkedSubject.id, day: record.day, startTime: record.startTime, endTime: record.endTime, topics: record.topics, assessments: [] }),
      })
      addedClasses.push(saved)
    }
    if (addedSubjects.length) setSubjects((current) => [...current, ...addedSubjects].sort((a, b) => a.name.localeCompare(b.name)))
    if (addedClasses.length) setClasses((current) => [...current, ...addedClasses])
  }
  const pageLabel = navItems.find((item) => item.id === activePage)?.label ?? 'Overview'
  const page = activePage === 'overview' ? <Overview goTo={goTo} classes={classes} clubs={clubs} events={events} tasks={tasks} studyPlan={studyPlan} /> : activePage === 'plan' ? <StudyPlanPage key={JSON.stringify(studyPlan)} subjects={subjects} classes={classes} studyPlan={studyPlan} onSaveStudyPlan={saveStudyPlan} onSaveStudyPlanDay={saveStudyPlanDay} /> : activePage === 'calendar' ? <PlannerCalendar goTo={goTo} classes={classes} clubs={clubs} events={events} tasks={tasks} studyPlan={studyPlan} /> : activePage === 'classes' ? <><PlannerCourses goTo={goTo} classes={classes} /><ClassTopics classes={classes} /></> : activePage === 'clubs' ? <PlannerClubs goTo={goTo} clubs={clubs} events={events} /> : <PlannerEditor key={editTab} subjects={subjects} classes={classes} clubs={clubs} events={events} tasks={tasks} initialTab={editTab} onSaveSubject={saveSubject} onDeleteSubject={deleteSubject} onSaveClass={saveClass} onDeleteClass={deleteClass} onSaveClub={saveClub} onDeleteClub={deleteClub} onSaveEvent={saveEvent} onDeleteEvent={deleteEvent} onSaveTask={saveTask} onDeleteTask={deleteTask} onImportClasses={importClasses} />

  return <div className="app-shell"><aside className="sidebar"><button className="brand brand-button" onClick={() => goTo('overview')} aria-label="Pace home"><span className="brand-mark"><span></span><span></span><span></span></span><span>pace</span></button><nav className="primary-nav" aria-label="Main navigation">{navItems.map((item) => <button className={`nav-item ${activePage === item.id ? 'active' : ''}`} key={item.id} onClick={() => goTo(item.id, item.id === 'manage' ? 'classes' : undefined)} aria-current={activePage === item.id ? 'page' : undefined}><Icon name={item.icon} size={18} />{item.label}</button>)}</nav><div className="sidebar-bottom"><button className="nav-item"><span className="settings-dot"></span>Settings</button><button className="profile"><span className="avatar">ML</span><span><strong>Maria Lee</strong><small>Product Design</small></span><Icon name="chevron" size={15} /></button></div></aside><main className="main-content" id={activePage}><header className="topbar"><button className="mobile-brand brand-button" onClick={() => goTo('overview')} aria-label="Pace home"><span className="brand-mark"><span></span><span></span><span></span></span>pace</button><p>{pageLabel}</p></header>{loadError && <p className="form-error" role="alert">Could not load planner data: {loadError}</p>}{page}</main><nav className="mobile-nav" aria-label="Main navigation">{navItems.map((item) => <button className={activePage === item.id ? 'active' : ''} key={item.id} onClick={() => goTo(item.id, item.id === 'manage' ? 'classes' : undefined)} aria-current={activePage === item.id ? 'page' : undefined}><Icon name={item.icon} size={18} /><span>{item.id === 'overview' ? 'Home' : item.id === 'manage' ? 'Edit' : item.label}</span></button>)}</nav></div>
}

export default App
