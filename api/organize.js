function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function makeId(seed) {
  return `${slugify(seed || 'item') || 'item'}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

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

  const {
    ANTHROPIC_API_KEY,
    GITHUB_TOKEN,
    GITHUB_OWNER,
    GITHUB_REPO,
    GITHUB_BRANCH = 'main',
  } = process.env

  if (!ANTHROPIC_API_KEY || !GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    res.status(500).json({ error: 'Faltan variables de entorno en el servidor' })
    return
  }

  try {
    // 1. Leer el notes.json actual desde GitHub (necesitamos el sha para poder actualizarlo)
    const ghApiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/content/notes.json`
    const ghHeaders = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    }

    const getRes = await fetch(`${ghApiBase}?ref=${GITHUB_BRANCH}`, { headers: ghHeaders })
    if (!getRes.ok) throw new Error('No se pudo leer content/notes.json de GitHub')
    const getData = await getRes.json()
    const content = JSON.parse(Buffer.from(getData.content, 'base64').toString('utf-8'))
    content.courses = content.courses || []

    // 2. Resolver el curso: existente o nuevo
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

    // 3. Reunir los submódulos que ya existen en este curso, para que la IA los reutilice
    const existing = {
      commands: [...new Set(course.commands.map((e) => e.submodule).filter(Boolean))],
      concepts: [...new Set(course.concepts.map((e) => e.submodule).filter(Boolean))],
      glossary: [...new Set(course.glossary.map((e) => e.submodule).filter(Boolean))],
    }

    // 4. Pedirle a Claude que extraiga y clasifique TODAS las piezas de información del texto
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
- Si el texto no tiene información nueva organizable, devolvé un array vacío [].`

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5', // revisá docs.claude.com por si el nombre del modelo cambió
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: 'user', content: rawText }],
      }),
    })

    if (!aiRes.ok) {
      const errBody = await aiRes.text()
      throw new Error(`Error de la API de Claude: ${errBody}`)
    }

    const aiData = await aiRes.json()
    const textBlock = aiData.content?.find((b) => b.type === 'text')?.text || '[]'
    const cleaned = textBlock.replace(/```json|```/g, '').trim()
    const rawEntries = JSON.parse(cleaned)

    if (!Array.isArray(rawEntries)) throw new Error('La IA no devolvió un array válido')

    // 5. Agregar cada entrada a la sección correspondiente del curso
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

    // 6. Escribir el archivo actualizado de vuelta en GitHub (genera un commit)
    const updatedContentB64 = Buffer.from(JSON.stringify(content, null, 2)).toString('base64')

    const putRes = await fetch(ghApiBase, {
      method: 'PUT',
      headers: ghHeaders,
      body: JSON.stringify({
        message: `chore(${course.id}): agrega ${newEntries.length} entrada(s)`,
        content: updatedContentB64,
        sha: getData.sha,
        branch: GITHUB_BRANCH,
      }),
    })

    if (!putRes.ok) {
      const errBody = await putRes.text()
      throw new Error(`No se pudo guardar en GitHub: ${errBody}`)
    }

    res.status(200).json({ courseId: course.id, courseName: course.name, entries: newEntries })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
