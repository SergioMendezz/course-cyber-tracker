export default function Home({ courses, onSelectCourse }) {
  return (
    <div className="pt-16 max-w-2xl">
      <div className="font-mono text-sm text-[var(--green)] mb-4">$ whoami</div>
      <h1 className="font-mono text-4xl mb-3">
        Hola Sergio <span className="text-[var(--mute)]">— hora de aprender :)</span>
      </h1>
      <p className="text-[var(--mute)] mb-10">
        Elegí un curso de la barra de la izquierda, o creá uno nuevo para empezar a pegar apuntes.
      </p>

      {courses.length > 0 && (
        <>
          <div className="font-mono text-xs uppercase tracking-wide text-[var(--mute)] mb-3">Tus cursos</div>
          <div className="grid sm:grid-cols-2 gap-3">
            {courses.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectCourse(c.id)}
                className="text-left bg-[var(--panel)] border border-[var(--edge)] rounded-xl p-4 hover:border-[var(--blue)] transition-colors"
              >
                <div className="font-mono text-sm mb-2">{c.name}</div>
                <div className="font-mono text-[11px] text-[var(--mute)]">
                  {c.commands.length} comandos · {c.concepts.length} conceptos · {c.glossary.length} términos
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
