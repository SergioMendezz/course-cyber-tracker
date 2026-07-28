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
  const content = JSON.parse(Buffer.from(getData.content, 'base64').toString('utf-8'))
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
  return textBlock.replace(/```json|```/g, '').trim()
}
