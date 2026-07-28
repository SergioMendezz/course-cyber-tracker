# Pre Security Tracker

Apuntes de TryHackMe organizados por concepto, con un formulario que manda notas
crudas a Claude para estructurarlas y las guarda como commits en este mismo repo
(`content/notes.json`).

## Stack

- Frontend: React + Vite + Tailwind
- Backend: 1 función serverless de Vercel (`api/organize.js`)
- Storage: `content/notes.json` en este repo (leído en runtime vía
  `raw.githubusercontent.com`, escrito vía la API de contenidos de GitHub)

## Variables de entorno

Copiá `.env.example` a `.env` y completá los valores reales. En Vercel, estas
mismas variables van en **Settings → Environment Variables** del proyecto.

## Desarrollo local

```bash
npm install
npm i -g vercel      # una sola vez
vercel dev           # sirve el frontend Y las funciones /api juntos
```

`npm run dev` (Vite solo) sirve para ver el frontend, pero **no** ejecuta
`api/organize.js` — para probar el formulario completo necesitás `vercel dev`.

## Agregar un módulo a mano

Si por alguna razón la IA falla, siempre podés editar `content/notes.json`
directamente y hacer push — es un JSON plano, no hay magia.
