import type { APIRoute } from 'astro'

export const prerender = false

function getEnv(locals: unknown): Env {
  const env = (locals as any)?.runtime?.env as Env | undefined
  if (!env) {
    throw new Error('Cloudflare runtime env is not available (locals.runtime.env).')
  }
  return env
}

function sanitizeFileName(name: string): string {
  const base = name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')
  return base.length ? base : 'upload'
}

function extFromName(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : ''
}

function guessContentType(fileName: string, fallback: string | undefined): string {
  if (fallback && fallback !== 'application/octet-stream') return fallback

  switch (extFromName(fileName)) {
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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = getEnv(locals)

    const configuredToken = (env.UPLOAD_TOKEN ?? '').trim()
    if (configuredToken) {
      const auth = request.headers.get('authorization') ?? ''
      const expected = `Bearer ${configuredToken}`
      if (auth !== expected) {
        return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
          status: 401,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store'
          }
        })
      }
    }

    const form = await request.formData()
    const file = form.get('file')

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing file' }), {
        status: 400,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store'
        }
      })
    }

    const kind = String(form.get('kind') ?? 'file')

    const originalName = sanitizeFileName(file.name || 'upload')
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const key = `articles/${stamp}-${originalName}`

    const contentType = guessContentType(originalName, file.type)

    await env.ARTICLES.put(key, file.stream(), {
      httpMetadata: {
        contentType
      },
      customMetadata: {
        kind
      }
    })

    return new Response(
      JSON.stringify({ ok: true, key, fileName: originalName, url: `/api/file/${encodeURIComponent(key)}` }),
      {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store'
        }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store'
        }
      }
    )
  }
}
