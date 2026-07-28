export default function Terminal({ label, lines = [] }) {
  const styleClass = {
    prompt: 'text-[var(--green)]',
    head: 'text-[var(--amber)]',
    found: 'text-[var(--green)]',
    mute: 'text-[var(--mute)]',
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--edge)] bg-[var(--panel-2)] shadow-lg mb-6">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0d1526] border-b border-[var(--edge)]">
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--red)]"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--amber)]"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--green)]"></span>
        <span className="ml-2 font-mono text-xs text-[var(--mute)]">{label}</span>
      </div>
      <pre className="font-mono text-[13px] px-5 py-4 overflow-x-auto text-slate-300">
        {lines.map((line, i) => (
          <div key={i} className={styleClass[line.style] || ''}>
            {line.text || '\u00A0'}
          </div>
        ))}
      </pre>
    </div>
  )
}
