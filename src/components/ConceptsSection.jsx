import EmptyState from './EmptyState.jsx'
import EntryCard from './EntryCard.jsx'
import { groupBySubmodule } from '../lib/group.js'

const FIELDS = [
  { key: 'title', label: 'Título', type: 'text' },
  { key: 'explanation', label: 'Explicación', type: 'textarea' },
  { key: 'keyPoints', label: 'Puntos clave (uno por línea)', type: 'list' },
  { key: 'submodule', label: 'Submódulo', type: 'text' },
]

export default function ConceptsSection({ entries, courseId, onEntryChanged }) {
  const groups = groupBySubmodule(entries)
  if (!groups.length) return <EmptyState label="conceptos" />

  return (
    <div className="space-y-10">
      {groups.map(([submodule, items]) => (
        <div key={submodule}>
          <h3 className="font-mono text-xs uppercase tracking-wide text-[var(--amber)] mb-4">
            {submodule}
          </h3>
          <div className="grid gap-4">
            {items.map((e) => (
              <EntryCard
                key={e.id}
                entry={e}
                section="concepts"
                courseId={courseId}
                fields={FIELDS}
                onChanged={onEntryChanged}
              >
                <h4 className="font-mono text-sm mb-2">{e.title}</h4>
                {e.explanation && <p className="text-sm text-slate-300">{e.explanation}</p>}
                {e.keyPoints?.length > 0 && (
                  <ul className="list-disc list-inside text-sm text-slate-300 mt-3 space-y-1">
                    {e.keyPoints.map((k, i) => (
                      <li key={i}>{k}</li>
                    ))}
                  </ul>
                )}
              </EntryCard>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
