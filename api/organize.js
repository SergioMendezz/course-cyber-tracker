export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' })
    return
  }

  const { rawText } = req.body || {}
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    res.status(400).json({ error: 'Falta rawText en el body' })
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
    res.status(500).json({ error: 'Faltan variables de entorno en el servidor (revisá Vercel > Settings > Environment Variables)' })
    return
  }

  try {
    // 1. Pedirle a Claude que estructure la nota cruda en el schema fijo
    const systemPrompt = `Sos un asistente que convierte apuntes crudos de un curso de ciberseguridad (TryHackMe) en un JSON estructurado.

Devolvé SOLO un objeto JSON válido (sin texto adicional, sin backticks, sin explicaciones), con esta forma exacta:

{
  "id": "slug-corto-en-kebab-case",
  "type": "concept" | "lab" | "glossary" | "careers",
  "title": "Título corto del módulo",
  "summary": "Resumen de 1-2 líneas",
  "callouts": [{ "text": "..." }] | [],
  "terminal": { "label": "user@thm: ~", "lines": [{ "text": "...", "style": "prompt|head|found|mute|" }] } | null,
  "steps": ["..."] | null,
  "terms": [{ "icon": "emoji", "name": "...", "tag": "...", "definition": "..." }] | null,
  "teams": [{ "color": "blue|red", "label": "..." }] | null,
  "roles": [{ "team": "blue|red", "name": "...", "tag": "...", "description": "...", "day": ["..."], "progression": ["..."], "note": "..." }] | null
}

Reglas:
- Elegí el "type" que mejor describa el contenido (concept = concepto teórico, lab = ejercicio práctico con comandos, glossary = lista de términos, careers = perfiles profesionales).
- Dejá en null los campos que no apliquen para ese type.
- Escribí todo en español, salvo comandos, código y términos técnicos que deban quedar tal cual en inglés.
- No inventes información que no esté en el texto del usuario.`

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5', // revisá docs.claude.com por si el nombre del modelo cambió
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: rawText }],
      }),
    })

    if (!aiRes.ok) {
      const errBody = await aiRes.text()
      throw new Error(`Error de la API de Claude: ${errBody}`)
    }

    const aiData = await aiRes.json()
    const textBlock = aiData.content?.find((b) => b.type === 'text')?.text || ''
    const cleaned = textBlock.replace(/```json|```/g, '').trim()
    const newModule = JSON.parse(cleaned)

    // 2. Leer el notes.json actual desde GitHub (necesitamos el sha para poder actualizarlo)
    const ghApiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/content/notes.json`
    const ghHeaders = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    }

    const getRes = await fetch(`${ghApiBase}?ref=${GITHUB_BRANCH}`, { headers: ghHeaders })
    if (!getRes.ok) throw new Error('No se pudo leer content/notes.json de GitHub')
    const getData = await getRes.json()
    const currentContent = JSON.parse(Buffer.from(getData.content, 'base64').toString('utf-8'))

    const nextOrder = (currentContent.modules?.length || 0) + 1
    newModule.order = nextOrder
    newModule.id = newModule.id || `modulo-${nextOrder}`

    currentContent.modules = [...(currentContent.modules || []), newModule]

    // 3. Escribir el archivo actualizado de vuelta en GitHub (esto genera un commit)
    const updatedContentB64 = Buffer.from(JSON.stringify(currentContent, null, 2)).toString('base64')

    const putRes = await fetch(ghApiBase, {
      method: 'PUT',
      headers: ghHeaders,
      body: JSON.stringify({
        message: `chore: agrega módulo "${newModule.title}"`,
        content: updatedContentB64,
        sha: getData.sha,
        branch: GITHUB_BRANCH,
      }),
    })

    if (!putRes.ok) {
      const errBody = await putRes.text()
      throw new Error(`No se pudo guardar en GitHub: ${errBody}`)
    }

    // Devolvemos el módulo ya generado para que el frontend lo muestre al instante,
    // sin esperar a que el CDN de raw.githubusercontent.com se actualice.
    res.status(200).json({ module: newModule })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
