import { useState } from 'react'

function initFromFields(entry, fields) {
  const v = {}
  for (const f of fields) {
    v[f.key] = f.type === 'list' ? (entry[f.key] || []).join('\n') : entry[f.key] || ''
  }
  return v
}

export default function EntryCard({ entry, section, courseId, fields, onChanged, children }) {
  const [mode, setMode] = useState('view') // view | edit | refine
  const [formValues, setFormValues] = useState(() => initFromFields(entry, fields))
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function callApi(body) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const b = await res.json().catch(() => ({}))
        throw new Error(b.error || 'Error al actualizar')
      }
      return await res.json()
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveEdit() {
    try {
      const payload = {}
      for (const f of fields) {
        payload[f.key] =
          f.type === 'list'
            ? formValues[f.key].split('\n').map((s) => s.trim()).filter(Boolean)
            : formValues[f.key]
      }
      const result = await callApi({
        action: 'update',
        courseId,
        section,
        entryId: entry.id,
        fields: payload,
      })
      onChanged(result)
      setMode('view')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleRefine() {
    if (!feedback.trim()) return
    try {
      const result = await callApi({
        action: 'refine',
        courseId,
        section,
        entryId: entry.id,
        feedback,
      })
      onChanged(result)
      setFeedback('')
      setMode('view')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete() {
    if (!window.confirm('¿Borrar esta entrada? No se puede deshacer.')) return
    try {
      const result = await callApi({
        action: 'delete',
        courseId,
        section,
        entryId: entry.id,
      })
      onChanged(result)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="bg-[var(--panel)] border border-[var(--edge)] rounded-xl p-5">
      <div className="flex justify-between items-start gap-3 mb-1">
        <div className="flex-1 min-w-0">{mode === 'view' && children}</div>
        <div className="flex gap-1 shrink-0">
          <button
            title="Editar"
            onClick={() => setMode(mode === 'edit' ? 'view' : 'edit')}
            className="font-mono text-xs px-1.5 py-1 rounded border border-[var(--edge)] text-[var(--mute)] hover:text-slate-200"
          >
            ✏️
          </button>
          <button
            title="Corregir con IA"
            onClick={() => setMode(mode === 'refine' ? 'view' : 'refine')}
            className="font-mono text-xs px-1.5 py-1 rounded border border-[var(--edge)] text-[var(--mute)] hover:text-slate-200"
          >
            🪄
          </button>
          <button
            title="Borrar"
            onClick={handleDelete}
            className="font-mono text-xs px-1.5 py-1 rounded border border-[var(--edge)] text-[var(--red)] hover:bg-[var(--amber-10)]"
          >
            🗑️
          </button>
        </div>
      </div>

      {mode === 'edit' && (
        <div className="space-y-3 mt-2">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block font-mono text-[11px] text-[var(--mute)] mb-1">{f.label}</label>
              {f.type === 'text' ? (
                <input
                  value={formValues[f.key]}
                  onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="w-full bg-[var(--panel-2)] border border-[var(--edge)] rounded-lg p-2 text-sm font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                />
              ) : (
                <textarea
                  value={formValues[f.key]}
                  onChange={(e) => setFormValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  rows={f.type === 'list' ? 4 : 3}
                  placeholder={f.type === 'list' ? 'Una línea por punto' : undefined}
                  className="w-full bg-[var(--panel-2)] border border-[var(--edge)] rounded-lg p-2 text-sm font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                />
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={loading}
              className="font-mono text-xs px-3 py-1.5 rounded-lg bg-[var(--green)] text-[var(--bg)] font-semibold disabled:opacity-50"
            >
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              onClick={() => setMode('view')}
              className="font-mono text-xs px-3 py-1.5 rounded-lg border border-[var(--edge)] text-[var(--mute)]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {mode === 'refine' && (
        <div className="mt-2">
          <label className="block font-mono text-[11px] text-[var(--mute)] mb-1">
            Decile qué está mal — puede pedirte mover de sección, acortar, corregir, etc.
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            placeholder='ej: "esto debería estar en Conceptos, no en Comandos" o "acortá la explicación"'
            className="w-full bg-[var(--panel-2)] border border-[var(--edge)] rounded-lg p-2 text-sm font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleRefine}
              disabled={loading}
              className="font-mono text-xs px-3 py-1.5 rounded-lg bg-[var(--blue)] text-[var(--bg)] font-semibold disabled:opacity-50"
            >
              {loading ? 'Corrigiendo…' : 'Aplicar corrección'}
            </button>
            <button
              onClick={() => setMode('view')}
              className="font-mono text-xs px-3 py-1.5 rounded-lg border border-[var(--edge)] text-[var(--mute)]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-[var(--red)] text-xs font-mono mt-2">{error}</p>}
    </div>
  )
}
