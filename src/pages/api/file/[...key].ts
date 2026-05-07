import type { APIRoute } from 'astro'

export const prerender = false

function getEnv(locals: unknown): Env {
  const env = (locals as any)?.runtime?.env as Env | undefined
  if (!env) {
    throw new Error('Cloudflare runtime env is not available (locals.runtime.env).')
  }
  return env
}

function guessContentType(fileName: string, fallback: string | undefined): string {
  if (fallback && fallback !== 'application/octet-stream') return fallback

  const idx = fileName.lastIndexOf('.')
  const ext = idx >= 0 ? fileName.slice(idx + 1).toLowerCase() : ''

  switch (ext) {
    case 'html':
      return 'text/html; charset=utf-8'
    case 'md':
      return 'text/markdown; charset=utf-8'
    case 'txt':
      return 'text/plain; charset=utf-8'
    case 'pdf':
      return 'application/pdf'
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'webp':
      return 'image/webp'
    case 'gif':
      return 'image/gif'
    case 'svg':
      return 'image/svg+xml'
    default:
      return 'application/octet-stream'
  }
}

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const env = getEnv(locals)

    const parts = params.key
    const key = Array.isArray(parts) ? parts.join('/') : String(parts ?? '')

    if (!key || !key.startsWith('articles/')) {
      return new Response('Not found', { status: 404 })
    }

    const obj = await env.ARTICLES.get(key)
    if (!obj) {
      return new Response('Not found', { status: 404 })
    }

    const fileName = key.split('/').pop() ?? key
    const contentType = guessContentType(fileName, obj.httpMetadata?.contentType)

    const headers = new Headers()
    headers.set('content-type', contentType)
    if (obj.httpEtag) headers.set('etag', obj.httpEtag)
    headers.set('cache-control', 'public, max-age=60')

    // Default to inline display.
    headers.set('content-disposition', `inline; filename="${fileName}"`)

    return new Response(obj.body, { headers })
  } catch (error) {
    return new Response(error instanceof Error ? error.message : String(error), { status: 500 })
  }
}
