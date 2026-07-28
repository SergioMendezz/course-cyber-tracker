export default function Terminal({ code = '', label = 'terminal' }) {
  return (
    <div className="rounded-lg overflow-hidden border border-[var(--edge)] bg-[var(--panel-2)] mb-3">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#0d1526] border-b border-[var(--edge)]">
        <span className="w-2 h-2 rounded-full bg-[var(--red)]"></span>
        <span className="w-2 h-2 rounded-full bg-[var(--amber)]"></span>
        <span className="w-2 h-2 rounded-full bg-[var(--green)]"></span>
        <span className="ml-1.5 font-mono text-[11px] text-[var(--mute)]">{label}</span>
      </div>
      <pre className="font-mono text-[13px] px-4 py-3 overflow-x-auto text-[var(--green)] whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  )
}
