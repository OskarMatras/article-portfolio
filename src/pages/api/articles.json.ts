import type { APIRoute } from 'astro'

export const prerender = false

function getEnv(locals: unknown): Env {
  const env = (locals as any)?.runtime?.env as Env | undefined
  if (!env) {
    throw new Error('Cloudflare runtime env is not available (locals.runtime.env).')
  }
  return env
}

export const GET: APIRoute = async ({ locals }) => {
  try {
    const env = getEnv(locals)
    const bucket = env.ARTICLES

    const listing = await bucket.list({ prefix: 'articles/' })

    const items = listing.objects
      .map((obj) => {
        const fileName = obj.key.split('/').pop() ?? obj.key
        return {
          key: obj.key,
          fileName,
          size: obj.size,
          uploadedAt: obj.uploaded ? obj.uploaded.toISOString() : null,
          url: `/api/file/${encodeURIComponent(obj.key)}`
        }
      })
      // newest first
      .sort((a, b) => (b.uploadedAt ?? '').localeCompare(a.uploadedAt ?? ''))

    return new Response(JSON.stringify({ ok: true, items }), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store'
      }
    })
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
