import Terminal from './Terminal.jsx'
import EmptyState from './EmptyState.jsx'
import { groupBySubmodule } from '../lib/group.js'

export default function CommandsSection({ entries }) {
  const groups = groupBySubmodule(entries)
  if (!groups.length) return <EmptyState label="comandos" />

  return (
    <div className="space-y-10">
      {groups.map(([submodule, items]) => (
        <div key={submodule}>
          <h3 className="font-mono text-xs uppercase tracking-wide text-[var(--amber)] mb-4">
            {submodule}
          </h3>
          <div className="space-y-6">
            {items.map((e) => (
              <div key={e.id} className="bg-[var(--panel)] border border-[var(--edge)] rounded-xl p-5">
                <h4 className="font-mono text-sm mb-3">{e.title}</h4>
                {e.command && <Terminal code={e.command} />}
                {e.explanation && <p className="text-sm text-slate-300 mb-3">{e.explanation}</p>}
                {e.example && (
                  <>
                    <div className="font-mono text-[11px] uppercase tracking-wide text-[var(--mute)] mb-1.5">
                      Ejemplo
                    </div>
                    <pre className="font-mono text-[12.5px] bg-[var(--panel-2)] border border-[var(--edge)] rounded-lg p-3 overflow-x-auto text-slate-300 whitespace-pre-wrap">
                      {e.example}
                    </pre>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
