export default function EmptyState({ label }) {
  return (
    <div className="border border-dashed border-[var(--edge)] rounded-xl p-8 text-center text-[var(--mute)] font-mono text-sm">
      Todavía no hay {label} en este curso. Pegá tus notas arriba para empezar.
    </div>
  )
}
