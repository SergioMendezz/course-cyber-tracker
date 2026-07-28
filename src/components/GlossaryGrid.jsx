export default function GlossaryGrid({ terms = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {terms.map((t, i) => (
        <div key={i} className="bg-[var(--panel)] border border-[var(--edge)] rounded-xl p-5">
          <h3 className="font-mono text-sm mb-2 flex items-center gap-2 flex-wrap">
            <span>{t.icon}</span> {t.name}
            {t.tag && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-[var(--edge)] text-[var(--mute)]">
                {t.tag}
              </span>
            )}
          </h3>
          <p className="text-sm text-[var(--mute)]">{t.definition}</p>
        </div>
      ))}
    </div>
  )
}
