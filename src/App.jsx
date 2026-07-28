import { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Home from './components/Home.jsx'
import SectionTabs from './components/SectionTabs.jsx'
import CommandsSection from './components/CommandsSection.jsx'
import ConceptsSection from './components/ConceptsSection.jsx'
import GlossarySection from './components/GlossarySection.jsx'
import AddNoteForm from './components/AddNoteForm.jsx'
import { fetchNotes } from './lib/github.js'

export default function App() {
  const [courses, setCourses] = useState([])
  const [activeCourseId, setActiveCourseId] = useState(null) // null = Inicio
  const [pendingNewCourseName, setPendingNewCourseName] = useState(null)
  const [activeSection, setActiveSection] = useState('commands')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    fetchNotes()
      .then((data) => setCourses(data.courses || []))
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const activeCourse = courses.find((c) => c.id === activeCourseId)
  const showHome = !pendingNewCourseName && !activeCourse

  function handleSelectHome() {
    setActiveCourseId(null)
    setPendingNewCourseName(null)
    setActiveSection('commands')
    setQuery('')
  }

  function handleSelectCourse(id) {
    setActiveCourseId(id)
    setPendingNewCourseName(null)
    setActiveSection('commands')
    setQuery('')
  }

  function handleStartNewCourse(name) {
    setPendingNewCourseName(name)
    setActiveCourseId(null)
    setActiveSection('commands')
    setQuery('')
  }

  function handleAdded(result) {
    setCourses((prev) => {
      const exists = prev.some((c) => c.id === result.courseId)
      const next = exists
        ? prev.map((c) => (c.id === result.courseId ? { ...c } : c))
        : [...prev, { id: result.courseId, name: result.courseName, commands: [], concepts: [], glossary: [] }]

      const target = next.find((c) => c.id === result.courseId)
      for (const { section, entry } of result.entries) {
        target[section] = [...target[section], entry]
      }
      return next
    })
    setActiveCourseId(result.courseId)
    setPendingNewCourseName(null)
    setQuery('')
  }

  function handleEntryChanged(result) {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== result.courseId) return c
        const next = { ...c }
        next[result.oldSection] = next[result.oldSection].filter((e) => e.id !== result.entryId)
        if (result.entry) {
          next[result.newSection] = [...next[result.newSection], result.entry]
        }
        return next
      }),
    )
  }

  const filteredEntries = useMemo(() => {
    if (!activeCourse) return []
    const list = activeCourse[activeSection] || []
    if (!query.trim()) return list
    const q = query.toLowerCase()
    return list.filter((e) => JSON.stringify(e).toLowerCase().includes(q))
  }, [activeCourse, activeSection, query])

  const counts = activeCourse
    ? {
        commands: activeCourse.commands.length,
        concepts: activeCourse.concepts.length,
        glossary: activeCourse.glossary.length,
      }
    : {}

  return (
    <div className="flex min-h-screen">
      <Sidebar
        courses={courses}
        activeCourseId={activeCourseId}
        homeActive={showHome}
        onSelectHome={handleSelectHome}
        onSelectCourse={handleSelectCourse}
        onNewCourse={handleStartNewCourse}
      />

      <main className="flex-1 px-6 pb-24">
        <div className="max-w-3xl mx-auto">
          {loading && <p className="pt-16 text-[var(--mute)] font-mono text-sm">Cargando apuntes…</p>}
          {loadError && <p className="pt-16 text-[var(--red)] font-mono text-sm">{loadError}</p>}

          {!loading && !loadError && showHome && <Home courses={courses} onSelectCourse={handleSelectCourse} />}

          {!loading && !loadError && pendingNewCourseName && (
            <>
              <header className="pt-16 pb-10">
                <div className="font-mono text-sm text-[var(--green)] mb-4">$ whoami</div>
                <h1 className="font-mono text-4xl mb-3">
                  Nuevo curso <span className="text-[var(--mute)]">— {pendingNewCourseName}</span>
                </h1>
                <p className="text-[var(--mute)] max-w-xl">
                  Pegá tu primera nota para crear el curso — se guarda apenas la IA la organiza.
                </p>
              </header>
              <AddNoteForm newCourseName={pendingNewCourseName} onAdded={handleAdded} />
            </>
          )}

          {!loading && !loadError && activeCourse && (
            <>
              <header className="pt-16 pb-10">
                <div className="font-mono text-sm text-[var(--green)] mb-4">$ whoami</div>
                <h1 className="font-mono text-4xl mb-3">{activeCourse.name}</h1>
                <p className="text-[var(--mute)] max-w-xl">
                  Se organiza solo con IA a medida que voy pegando notas.
                </p>
              </header>

              <AddNoteForm courseId={activeCourse.id} onAdded={handleAdded} />

              <SectionTabs active={activeSection} onSelect={setActiveSection} counts={counts} />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar en esta sección…"
                className="w-full bg-[var(--panel-2)] border border-[var(--edge)] rounded-lg p-2.5 text-sm font-mono text-slate-200 mb-8 focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              />

              {activeSection === 'commands' && (
                <CommandsSection
                  entries={filteredEntries}
                  courseId={activeCourse.id}
                  onEntryChanged={handleEntryChanged}
                />
              )}
              {activeSection === 'concepts' && (
                <ConceptsSection
                  entries={filteredEntries}
                  courseId={activeCourse.id}
                  onEntryChanged={handleEntryChanged}
                />
              )}
              {activeSection === 'glossary' && (
                <GlossarySection
                  entries={filteredEntries}
                  courseId={activeCourse.id}
                  onEntryChanged={handleEntryChanged}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
