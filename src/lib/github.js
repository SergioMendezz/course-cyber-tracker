const GITHUB_USER = import.meta.env.VITE_GITHUB_USER
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO
const GITHUB_BRANCH = import.meta.env.VITE_GITHUB_BRANCH || 'main'

export async function fetchNotes() {
  if (!GITHUB_USER || !GITHUB_REPO) {
    throw new Error('Faltan VITE_GITHUB_USER / VITE_GITHUB_REPO en las variables de entorno')
  }

  // El parámetro ?t= evita que el CDN de GitHub sirva una versión en caché vieja
  const url = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/content/notes.json?t=${Date.now()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('No se pudo cargar content/notes.json desde GitHub')
  return res.json()
}
