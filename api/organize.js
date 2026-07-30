import { slugify, makeId, getEnv, readNotes, writeNotes, callClaudeForJson } from './_lib/helpers.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' })
    return
  }

  const { rawText, courseId, newCourseName } = req.body || {}
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    res.status(400).json({ error: 'Falta rawText en el body' })
    return
  }
  if (!courseId && !(newCourseName && newCourseName.trim())) {
    res.status(400).json({ error: 'Falta courseId o newCourseName' })
    return
  }

  try {
    const env = getEnv()
    const { content, sha, ghApiBase, ghHeaders } = await readNotes(env)

    // Resolver el curso: existente o nuevo
    let course
    if (courseId) {
      course = content.courses.find((c) => c.id === courseId)
      if (!course) throw new Error('Curso no encontrado')
    } else {
      const slug = slugify(newCourseName) || makeId('curso')
      course = content.courses.find((c) => c.id === slug)
      if (!course) {
        course = { id: slug, name: newCourseName.trim(), commands: [], concepts: [], glossary: [] }
        content.courses.push(course)
      }
    }

    const existing = {
      commands: [...new Set(course.commands.map((e) => e.submodule).filter(Boolean))],
      concepts: [...new Set(course.concepts.map((e) => e.submodule).filter(Boolean))],
      glossary: [...new Set(course.glossary.map((e) => e.submodule).filter(Boolean))],
    }

    const systemPrompt = `Sos un asistente que organiza apuntes crudos de cursos técnicos dentro de una app de estudio con tres secciones fijas: "commands" (comandos de terminal/Linux con su explicación y ejemplo), "concepts" (conceptos teóricos) y "glossary" (términos cortos con definición).

Tu tarea: leer el texto del usuario y extraer TODAS las piezas de información distintas que contenga, devolviendo un array JSON. Un mismo texto puede traer varias piezas de secciones distintas mezcladas (ej: un comando + dos conceptos + tres términos) — extraelas todas por separado, no las mezcles en una sola entrada.

Devolvé SOLO un array JSON válido (sin texto adicional, sin backticks, sin explicaciones). Cada elemento tiene esta forma según su "section":

// section = "commands"
{ "section": "commands", "submodule": "...", "title": "...", "command": "...", "explanation": "...", "example": "" }

// section = "concepts"
{ "section": "concepts", "submodule": "...", "title": "...", "explanation": "...", "keyPoints": [] }

// section = "glossary"
{ "section": "glossary", "submodule": "...", "term": "...", "tag": "", "definition": "..." }

Reglas para "submodule":
- Nombre corto (2-4 palabras) que agrupa entradas relacionadas dentro de la sección, como una pestaña temática.
- Submódulos que YA EXISTEN en este curso — reusalos EXACTO si el contenido nuevo encaja, para no duplicar pestañas:
  - commands: ${existing.commands.join(', ') || '(ninguno todavía)'}
  - concepts: ${existing.concepts.join(', ') || '(ninguno todavía)'}
  - glossary: ${existing.glossary.join(', ') || '(ninguno todavía)'}
- Si no encaja en ninguno, inventá uno nuevo corto y descriptivo.

Reglas generales:
- Todo en español, salvo comandos, código y términos técnicos que deban quedar en inglés.
- No inventes información que no esté en el texto.
- Los campos "example", "keyPoints" y "tag" pueden quedar vacíos ("" o []) si no aplican, pero el campo debe existir siempre.
- Si el texto no tiene información nueva organizable, devolvé un array vacío [].
- SIEMPRE devolvé al menos el array vacío "[]" — nunca dejes la respuesta en blanco.`

    const rawEntries = await callClaudeForJson({
      apiKey: env.ANTHROPIC_API_KEY,
      system: systemPrompt,
      userText: rawText,
      maxTokens: 3000,
      retries: 1,
    })

    if (!Array.isArray(rawEntries)) throw new Error('La IA no devolvió un array válido')

    const newEntries = []
    for (const raw of rawEntries) {
      const { section, ...rest } = raw
      if (!['commands', 'concepts', 'glossary'].includes(section)) continue
      const entry = { id: makeId(rest.title || rest.term), ...rest }
      course[section].push(entry)
      newEntries.push({ section, entry })
    }

    if (newEntries.length === 0) {
      res.status(200).json({ courseId: course.id, courseName: course.name, entries: [] })
      return
    }

    await writeNotes({
      content,
      sha,
      ghApiBase,
      ghHeaders,
      branch: env.GITHUB_BRANCH,
      message: `chore(${course.id}): agrega ${newEntries.length} entrada(s)`,
    })

    res.status(200).json({ courseId: course.id, courseName: course.name, entries: newEntries })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
