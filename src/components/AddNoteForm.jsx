import { useState } from 'react'

export default function AddNoteForm({ courseId, newCourseName, onAdded }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: text,
          courseId: courseId || null,
          newCourseName: newCourseName || null,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Error al organizar la nota')
      }
      const result = await res.json()
      onAdded(result)
      setText('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--panel)] border border-[var(--edge)] rounded-xl p-5 mb-10">
      <label className="block font-mono text-xs text-[var(--mute)] mb-2" htmlFor="raw-notes">
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
          {loading ? 'Organizando…' : 'Agregar'}
        </button>
        {error && <span className="text-[var(--red)] text-sm">{error}</span>}
      </div>
    </form>
  )
}
