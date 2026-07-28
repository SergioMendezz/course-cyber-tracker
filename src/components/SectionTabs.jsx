const SECTIONS = [
  { key: 'commands', label: 'Comandos', icon: '⌘' },
  { key: 'concepts', label: 'Conceptos', icon: '◆' },
  { key: 'glossary', label: 'Glosario', icon: '§' },
]

export default function SectionTabs({ active, onSelect, counts = {} }) {
  return (
    <div className="flex gap-1 mb-6 border-b border-[var(--edge)]">
      {SECTIONS.map((s) => (
        <button
          key={s.key}
          onClick={() => onSelect(s.key)}
          className={`font-mono text-sm px-4 py-2.5 border-b-2 -mb-px transition-colors ${
            active === s.key
              ? 'border-[var(--green)] text-slate-100'
              : 'border-transparent text-[var(--mute)] hover:text-slate-300'
          }`}
        >
          {s.icon} {s.label}
          {typeof counts[s.key] === 'number' && (
            <span className="ml-1.5 text-[var(--mute)]">({counts[s.key]})</span>
          )}
        </button>
      ))}
    </div>
  )
}
