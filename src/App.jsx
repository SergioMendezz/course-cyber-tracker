import { useEffect, useState } from 'react'
import Terminal from './components/Terminal.jsx'
import GlossaryGrid from './components/GlossaryGrid.jsx'
import CareerRoles from './components/CareerRoles.jsx'
import AddNoteForm from './components/AddNoteForm.jsx'
import { fetchNotes } from './lib/github.js'

export default function App() {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    fetchNotes()
      .then((data) => setModules(data.modules || []))
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function handleAdded(newModule) {
    setModules((prev) => [...prev, newModule])
  }

  return (
    <div className="max-w-3xl mx-auto px-6 pb-24 min-h-screen">
      <header className="pt-16 pb-10">
        <div className="font-mono text-sm text-[var(--green)] mb-4">$ whoami</div>
        <h1 className="font-mono text-4xl mb-3">
          Pre Security <span className="text-[var(--mute)]">— apuntes de curso</span>
        </h1>
        <p className="text-[var(--mute)] max-w-xl">
          Apuntes organizados por concepto del curso Pre Security de TryHackMe. Se actualiza con IA
          a medida que avanzo.
        </p>
      </header>

      <AddNoteForm onAdded={handleAdded} />

      {loading && <p className="text-[var(--mute)] font-mono text-sm">Cargando apuntes…</p>}
      {loadError && <p className="text-[var(--red)] font-mono text-sm">{loadError}</p>}

      {modules
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((m) => (
          <section key={m.id} className="py-10 border-t border-[var(--edge)] first:border-t-0">
            <div className="font-mono text-xs text-[var(--amber)] mb-3">
              {String(m.order).padStart(2, '0')} · {m.type?.toUpperCase()}
            </div>
            <h2 className="font-mono text-2xl mb-2">{m.title}</h2>
            {m.summary && <p className="text-[var(--mute)] max-w-xl mb-6">{m.summary}</p>}

            {m.callouts?.map((c, i) => (
              <div
                key={i}
                className="flex gap-3 p-3.5 rounded-lg bg-[var(--blue-10)] border border-[var(--blue-30)] text-sm mb-4"
              >
                <span>💡</span>
                <div>{c.text}</div>
              </div>
            ))}

            {m.terminal && <Terminal label={m.terminal.label} lines={m.terminal.lines} />}

            {m.steps?.length > 0 && (
              <ol className="space-y-2 mt-4">
                {m.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-300">
                    <span className="font-mono text-[var(--green)] border border-[var(--edge)] rounded w-6 h-6 flex items-center justify-center text-xs shrink-0">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            )}

            {m.terms && <GlossaryGrid terms={m.terms} />}
            {m.roles && <CareerRoles teams={m.teams} roles={m.roles} />}
          </section>
        ))}
    </div>
  )
}
