export default function CourseTabs({ courses, activeCourseId, onSelect }) {
  if (!courses.length) return null
  return (
    <div className="flex gap-2 mb-8 flex-wrap">
      {courses.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
            c.id === activeCourseId
              ? 'border-[var(--blue)] text-[var(--blue)] bg-[var(--blue-10)]'
              : 'border-[var(--edge)] text-[var(--mute)] hover:text-slate-200'
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  )
}
