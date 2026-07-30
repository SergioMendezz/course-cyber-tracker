export function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function makeId(seed) {
  return `${slugify(seed || 'item') || 'item'}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function getEnv() {
  const {
    ANTHROPIC_API_KEY,
    GITHUB_TOKEN,
    GITHUB_OWNER,
    GITHUB_REPO,
    GITHUB_BRANCH = 'main',
  } = process.env

  if (!ANTHROPIC_API_KEY || !GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error('Faltan variables de entorno en el servidor')
  }
  return { ANTHROPIC_API_KEY, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH }
}

export async function readNotes(env) {
  const ghApiBase = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/content/notes.json`
  const ghHeaders = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
  }

  const getRes = await fetch(`${ghApiBase}?ref=${env.GITHUB_BRANCH}`, { headers: ghHeaders })
  if (!getRes.ok) throw new Error('No se pudo leer content/notes.json de GitHub')
  const getData = await getRes.json()

  let content
  try {
    content = JSON.parse(Buffer.from(getData.content, 'base64').toString('utf-8'))
  } catch {
    throw new Error('content/notes.json en GitHub no es un JSON válido — revisalo a mano')
  }
  content.courses = content.courses || []

  return { content, sha: getData.sha, ghApiBase, ghHeaders }
}

export async function writeNotes({ content, sha, ghApiBase, ghHeaders, branch, message }) {
  const body = Buffer.from(JSON.stringify(content, null, 2)).toString('base64')
  const putRes = await fetch(ghApiBase, {
    method: 'PUT',
    headers: ghHeaders,
    body: JSON.stringify({ message, content: body, sha, branch }),
  })
  if (!putRes.ok) {
    const errBody = await putRes.text()
    throw new Error(`No se pudo guardar en GitHub: ${errBody}`)
  }
}

export async function callClaude({ apiKey, system, userText, maxTokens = 2000 }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5', // revisá docs.claude.com por si el nombre del modelo cambió
      max_tokens: maxTokens,
      thinking: { type: 'disabled' }, // no necesitamos razonamiento largo para esta extracción, y así todo el presupuesto de tokens va al JSON de salida
      system,
      messages: [{ role: 'user', content: userText }],
    }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`Error de la API de Claude: ${errBody}`)
  }

  const data = await res.json()
  const textBlock = data.content?.find((b) => b.type === 'text')?.text || ''
  return {
    text: textBlock.replace(/```json|```/g, '').trim(),
    stopReason: data.stop_reason,
  }
}

/**
 * Igual que callClaude, pero espera JSON de vuelta: si Claude devuelve texto
 * vacío o algo que no parsea, reintenta una vez antes de fallar con un
 * mensaje claro (en vez de romper con "Unexpected end of JSON input"). Si la
 * respuesta se cortó por llegar al límite de tokens, avisa eso puntualmente
 * en vez de reintentar a ciegas (el reintento fallaría igual).
 */
export async function callClaudeForJson({ apiKey, system, userText, maxTokens = 2000, retries = 1 }) {
  let lastRaw = ''
  for (let attempt = 0; attempt <= retries; attempt++) {
    const { text: cleaned, stopReason } = await callClaude({ apiKey, system, userText, maxTokens })
    lastRaw = cleaned

    if (stopReason === 'max_tokens') {
      throw new Error(
        'El texto es demasiado largo para procesarlo en una sola pasada (se cortó la respuesta de la IA). Pegalo en partes más chicas.',
      )
    }
    if (!cleaned) continue
    try {
      return JSON.parse(cleaned)
    } catch {
      continue
    }
  }
  console.error('Respuesta de Claude no parseable como JSON:', lastRaw.slice(0, 500))
  throw new Error('La IA no devolvió una respuesta válida. Probá de nuevo, o con un texto un poco distinto.')
}
