import { useState } from 'react'

export default function Sidebar({ courses, activeCourseId, homeActive, onSelectHome, onSelectCourse, onNewCourse }) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  function submitNew(e) {
    e.preventDefault()
    if (!name.trim()) return
    onNewCourse(name.trim())
    setName('')
    setCreating(false)
  }

  return (
    <aside className="w-64 shrink-0 border-r border-[var(--edge)] bg-[var(--panel-2)] min-h-screen flex flex-col">
      <div className="p-4 flex-1 overflow-y-auto">
        <button
          onClick={onSelectHome}
          className={`w-full text-left font-mono text-sm px-3 py-2 rounded-lg mb-4 transition-colors ${
            homeActive ? 'bg-[var(--panel)] text-slate-100' : 'text-[var(--mute)] hover:text-slate-200'
          }`}
        >
          🏠 Inicio
        </button>

        <div className="font-mono text-[11px] uppercase tracking-wide text-[var(--mute)] px-3 mb-2">
          Mis cursos
        </div>

        <nav className="space-y-1">
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCourse(c.id)}
              title={c.name}
              className={`w-full text-left font-mono text-xs px-3 py-2 rounded-lg truncate block transition-colors border ${
                activeCourseId === c.id
                  ? 'bg-[var(--blue-10)] text-[var(--blue)] border-[var(--blue-30)]'
                  : 'text-[var(--mute)] hover:text-slate-200 border-transparent'
              }`}
            >
              {c.name}
            </button>
          ))}
          {courses.length === 0 && (
            <p className="font-mono text-[11px] text-[var(--mute)] px-3">Todavía no hay cursos.</p>
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-[var(--edge)]">
        {creating ? (
          <form onSubmit={submitNew} className="space-y-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del curso"
              className="w-full bg-[var(--panel)] border border-[var(--edge)] rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="font-mono text-xs px-2.5 py-1.5 rounded-lg bg-[var(--green)] text-[var(--bg)] font-semibold"
              >
                Crear
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="font-mono text-xs px-2.5 py-1.5 rounded-lg border border-[var(--edge)] text-[var(--mute)]"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="w-full font-mono text-xs px-3 py-2 rounded-lg border border-dashed border-[var(--edge)] text-[var(--mute)] hover:text-slate-200"
          >
            ➕ Nuevo curso
          </button>
        )}
      </div>
    </aside>
  )
}
