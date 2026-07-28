import EmptyState from './EmptyState.jsx'
import { groupBySubmodule } from '../lib/group.js'

export default function GlossarySection({ entries }) {
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
              <div key={e.id} className="bg-[var(--panel)] border border-[var(--edge)] rounded-xl p-5">
                <h4 className="font-mono text-sm mb-2 flex items-center gap-2 flex-wrap">
                  {e.term}
                  {e.tag && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-[var(--edge)] text-[var(--mute)]">
                      {e.tag}
                    </span>
                  )}
                </h4>
                <p className="text-sm text-[var(--mute)]">{e.definition}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
