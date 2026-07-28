import EmptyState from './EmptyState.jsx'
import { groupBySubmodule } from '../lib/group.js'

export default function ConceptsSection({ entries }) {
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
              <div key={e.id} className="bg-[var(--panel)] border border-[var(--edge)] rounded-xl p-5">
                <h4 className="font-mono text-sm mb-2">{e.title}</h4>
                {e.explanation && <p className="text-sm text-slate-300">{e.explanation}</p>}
                {e.keyPoints?.length > 0 && (
                  <ul className="list-disc list-inside text-sm text-slate-300 mt-3 space-y-1">
                    {e.keyPoints.map((k, i) => (
                      <li key={i}>{k}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
