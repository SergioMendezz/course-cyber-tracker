import EmptyState from './EmptyState.jsx'
import EntryCard from './EntryCard.jsx'
import { groupBySubmodule } from '../lib/group.js'

const FIELDS = [
  { key: 'term', label: 'Término', type: 'text' },
  { key: 'tag', label: 'Etiqueta', type: 'text' },
  { key: 'definition', label: 'Definición', type: 'textarea' },
  { key: 'submodule', label: 'Submódulo', type: 'text' },
]

export default function GlossarySection({ entries, courseId, onEntryChanged }) {
  const groups = groupBySubmodule(entries)
  if (!groups.length) return <EmptyState label="términos" />

  return (
    <div className="space-y-10">
      {groups.map(([submodule, items]) => (
        <div key={submodule}>
          <h3 className="font-mono text-xs uppercase tracking-wide text-[var(--amber)] mb-4">
            {submodule}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((e) => (
              <EntryCard
                key={e.id}
                entry={e}
                section="glossary"
                courseId={courseId}
                fields={FIELDS}
                onChanged={onEntryChanged}
              >
                <h4 className="font-mono text-sm mb-2 flex items-center gap-2 flex-wrap">
                  {e.term}
                  {e.tag && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-[var(--edge)] text-[var(--mute)]">
                      {e.tag}
                    </span>
                  )}
                </h4>
                <p className="text-sm text-[var(--mute)]">{e.definition}</p>
              </EntryCard>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
