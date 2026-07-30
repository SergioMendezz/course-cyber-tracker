import { getEnv, readNotes, writeNotes, callClaudeForJson } from './_lib/helpers.js'

const VALID_SECTIONS = ['commands', 'concepts', 'glossary']

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' })
    return
  }

  const { action, courseId, section, entryId, fields, feedback } = req.body || {}

  if (!action || !courseId || !section || !entryId) {
    res.status(400).json({ error: 'Faltan campos requeridos (action, courseId, section, entryId)' })
    return
  }
  if (!VALID_SECTIONS.includes(section)) {
    res.status(400).json({ error: 'section inválida' })
    return
  }

  try {
    const env = getEnv()
    const { content, sha, ghApiBase, ghHeaders } = await readNotes(env)

    const course = content.courses.find((c) => c.id === courseId)
    if (!course) throw new Error('Curso no encontrado')

    const list = course[section]
    const idx = list.findIndex((e) => e.id === entryId)
    if (idx === -1) throw new Error('Entrada no encontrada')

    const original = list[idx]
    let newSection = section
    let updatedEntry = null

    if (action === 'delete') {
      list.splice(idx, 1)
      updatedEntry = null
    } else if (action === 'update') {
      // Edición manual: se mergean los campos que mandó el usuario, sin IA de por medio
      if (!fields || typeof fields !== 'object') throw new Error('Faltan fields para update')
      const merged = { ...original, ...fields, id: original.id }
      list.splice(idx, 1)
      course[section].push(merged)
      updatedEntry = merged
    } else if (action === 'refine') {
      // Corrección con IA: se le manda la entrada actual + el feedback en lenguaje natural
      if (!feedback || !feedback.trim()) throw new Error('Falta feedback para refine')

      const existingSubmodules = {
        commands: [...new Set(course.commands.map((e) => e.submodule).filter(Boolean))],
        concepts: [...new Set(course.concepts.map((e) => e.submodule).filter(Boolean))],
        glossary: [...new Set(course.glossary.map((e) => e.submodule).filter(Boolean))],
      }

      const systemPrompt = `Sos un asistente que corrige una entrada existente de una app de apuntes de estudio, según el feedback en lenguaje natural de un usuario.

La entrada actual (sección "${section}") es:
${JSON.stringify(original, null, 2)}

Los submódulos que ya existen en este curso son:
- commands: ${existingSubmodules.commands.join(', ') || '(ninguno)'}
- concepts: ${existingSubmodules.concepts.join(', ') || '(ninguno)'}
- glossary: ${existingSubmodules.glossary.join(', ') || '(ninguno)'}

Devolvé SOLO un objeto JSON válido (sin backticks, sin texto adicional) con la entrada corregida, con esta forma según la sección a la que pertenezca (puede ser la misma sección u otra distinta, si el feedback pide moverla):

// section = "commands"
{ "section": "commands", "submodule": "...", "title": "...", "command": "...", "explanation": "...", "example": "" }

// section = "concepts"
{ "section": "concepts", "submodule": "...", "title": "...", "explanation": "...", "keyPoints": [] }

// section = "glossary"
{ "section": "glossary", "submodule": "...", "term": "...", "tag": "", "definition": "..." }

Reglas:
- Aplicá el feedback del usuario sobre la entrada actual, cambiando solo lo que el feedback pide, dejando el resto igual.
- Si el feedback pide mover la entrada a otra sección, usá esa nueva "section" y adaptá los campos al nuevo formato.
- Reusá un submódulo existente si corresponde, o inventá uno corto si hace falta.
- Todo en español salvo comandos y términos técnicos.`

      const parsed = await callClaudeForJson({
        apiKey: env.ANTHROPIC_API_KEY,
        system: systemPrompt,
        userText: feedback,
        maxTokens: 1500,
        retries: 1,
      })

      const { section: aiSection, ...rest } = parsed
      const targetSection = VALID_SECTIONS.includes(aiSection) ? aiSection : section

      const merged = { ...rest, id: original.id }
      list.splice(idx, 1)
      newSection = targetSection
      course[targetSection].push(merged)
      updatedEntry = merged
    } else {
      throw new Error('action inválida')
    }

    await writeNotes({
      content,
      sha,
      ghApiBase,
      ghHeaders,
      branch: env.GITHUB_BRANCH,
      message: `chore(${course.id}): ${action} entrada ${entryId}`,
    })

    res.status(200).json({
      action,
      courseId: course.id,
      oldSection: section,
      newSection,
      entryId,
      entry: updatedEntry,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
