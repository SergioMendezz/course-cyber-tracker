const borderByTeam = { blue: 'border-l-[var(--blue)]', red: 'border-l-[var(--red)]' }
const textByTeam = { blue: 'text-[var(--blue)]', red: 'text-[var(--red)]' }

export default function CareerRoles({ teams = [], roles = [] }) {
  return (
    <div>
      <div className="flex gap-3 mb-6 flex-wrap">
        {teams.map((t, i) => (
          <span
            key={i}
            className={`font-mono text-xs px-3 py-1.5 rounded-full border border-[var(--edge)] ${textByTeam[t.color] || 'text-[var(--mute)]'}`}
          >
            {t.label}
          </span>
        ))}
      </div>

      {roles.map((r, i) => (
        <div
          key={i}
          className={`border border-[var(--edge)] border-l-[3px] rounded-xl p-6 mb-5 ${borderByTeam[r.team] || ''}`}
        >
          <div className="flex items-baseline gap-3 flex-wrap mb-1">
            <h3 className="font-mono text-lg">{r.name}</h3>
            <span className={`font-mono text-xs ${textByTeam[r.team] || 'text-[var(--mute)]'}`}>{r.tag}</span>
          </div>
          <p className="text-slate-300 text-sm mb-4 max-w-xl">{r.description}</p>
          <div className="grid sm:grid-cols-[1.2fr_1fr] gap-6">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wide text-[var(--mute)] mb-2">
                Un día típico
              </div>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                {r.day?.map((d, j) => (
                  <li key={j}>{d}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wide text-[var(--mute)] mb-2">
                Progresión
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-sm">
                {r.progression?.map((p, j) => (
                  <span key={j} className="flex items-center gap-1.5">
                    <span className="font-mono text-xs px-2 py-1 rounded border border-[var(--edge)] bg-[var(--panel-2)]">
                      {p}
                    </span>
                    {j < r.progression.length - 1 && <span className="text-[var(--mute)]">→</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {r.note && (
            <div className="mt-4 flex gap-3 p-3.5 rounded-lg bg-[var(--amber-10)] border border-[var(--amber-30)] text-sm">
              <span>⚠️</span>
              <div>{r.note}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
