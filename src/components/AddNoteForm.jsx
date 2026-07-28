import { useState } from 'react'

export default function AddNoteForm({ courses, defaultCourseId, onAdded }) {
  const [courseId, setCourseId] = useState(defaultCourseId || courses[0]?.id || '__new__')
  const [newCourseName, setNewCourseName] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isNew = courseId === '__new__' || courses.length === 0

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    if (isNew && !newCourseName.trim()) {
      setError('Poné un nombre para el curso nuevo')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: text,
          courseId: isNew ? null : courseId,
          newCourseName: isNew ? newCourseName : null,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Error al organizar la nota')
      }
      const result = await res.json()
      onAdded(result)
      setText('')
      if (isNew) {
        setCourseId(result.courseId)
        setNewCourseName('')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--panel)] border border-[var(--edge)] rounded-xl p-5 mb-10">
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="flex-1 min-w-[180px]">
          <label className="block font-mono text-xs text-[var(--mute)] mb-1.5" htmlFor="course-select">
            Curso
          </label>
          <select
            id="course-select"
            value={courses.length ? courseId : '__new__'}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full bg-[var(--panel-2)] border border-[var(--edge)] rounded-lg p-2 text-sm font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value="__new__">➕ Nuevo curso…</option>
          </select>
        </div>
        {isNew && (
          <div className="flex-1 min-w-[180px]">
            <label className="block font-mono text-xs text-[var(--mute)] mb-1.5" htmlFor="new-course-name">
              Nombre del curso nuevo
            </label>
            <input
              id="new-course-name"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              placeholder="ej. Auditoría de Sistemas SC-704"
              className="w-full bg-[var(--panel-2)] border border-[var(--edge)] rounded-lg p-2 text-sm font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
            />
          </div>
        )}
      </div>

      <label className="block font-mono text-xs text-[var(--mute)] mb-1.5" htmlFor="raw-notes">
        Pegá tus notas nuevas
      </label>
      <textarea
        id="raw-notes"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        className="w-full bg-[var(--panel-2)] border border-[var(--edge)] rounded-lg p-3 text-sm font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
        placeholder="Pegá texto de la lección: puede traer comandos, conceptos y términos mezclados, la IA los separa sola."
      />
      <div className="flex items-center gap-3 mt-3">
        <button
          type="submit"
          disabled={loading}
          className="font-mono text-sm px-4 py-2 rounded-lg bg-[var(--green)] text-[var(--bg)] font-semibold disabled:opacity-50"
        >
          {loading ? 'Organizando…' : 'Agregar al curso'}
        </button>
        {error && <span className="text-[var(--red)] text-sm">{error}</span>}
      </div>
    </form>
  )
}
