import fs from 'node:fs'
import path from 'node:path'

export type ArticleKind = 'html' | 'pdf' | 'image' | 'markdown' | 'text' | 'file'

export interface ArticleEntry {
  slug: string
  fileName: string
  kind: ArticleKind
  title: string
  description?: string
  href: string
  updatedAt?: string
}

const articlesDir = path.join(process.cwd(), 'public', 'articles')

const imageExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'])

function slugify(fileBase: string) {
  return fileBase
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]+/g, '')
    .replace(/\-+/g, '-')
    .replace(/^\-+|\-+$/g, '')
}

function titleFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function extractHtmlMeta(html: string) {
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i)
  const title = titleMatch?.[1]?.trim()

  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']\s*\/?\s*>/i)
  const description = descMatch?.[1]?.trim()

  return { title, description }
}

function extractMarkdownMeta(md: string) {
  const lines = md.split(/\r?\n/)
  const titleLine = lines.find((l) => l.trim().startsWith('# '))
  const title = titleLine ? titleLine.replace(/^#\s+/, '').trim() : undefined

  const descLine = lines
    .slice(titleLine ? lines.indexOf(titleLine) + 1 : 0)
    .map((l) => l.trim())
    .find((l) => l.length > 0)

  return { title, description: descLine }
}

function extractTextMeta(txt: string) {
  const lines = txt.split(/\r?\n/).map((l) => l.trim())
  const title = lines.find((l) => l.length > 0)
  const description = lines.slice(1).find((l) => l.length > 0)
  return { title, description }
}

function kindFromExt(ext: string): ArticleKind {
  if (ext === '.html' || ext === '.htm') return 'html'
  if (ext === '.pdf') return 'pdf'
  if (ext === '.md' || ext === '.markdown') return 'markdown'
  if (ext === '.txt') return 'text'
  if (imageExts.has(ext)) return 'image'
  return 'file'
}

export function listArticles(): ArticleEntry[] {
  if (!fs.existsSync(articlesDir)) return []

  const entries = fs
    .readdirSync(articlesDir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => {
      const fileName = d.name
      const ext = path.extname(fileName).toLowerCase()
      const base = path.basename(fileName, ext)
      const slug = slugify(base)
      const fullPath = path.join(articlesDir, fileName)
      const kind = kindFromExt(ext)
      const href = `/article/${slug}`

      let title = titleFromSlug(slug)
      let description: string | undefined

      try {
        if (kind === 'html') {
          const html = fs.readFileSync(fullPath, 'utf8')
          const meta = extractHtmlMeta(html)
          if (meta.title) title = meta.title
          if (meta.description) description = meta.description
        } else if (kind === 'markdown') {
          const md = fs.readFileSync(fullPath, 'utf8')
          const meta = extractMarkdownMeta(md)
          if (meta.title) title = meta.title
          if (meta.description) description = meta.description
        } else if (kind === 'text') {
          const txt = fs.readFileSync(fullPath, 'utf8')
          const meta = extractTextMeta(txt)
          if (meta.title) title = meta.title
          if (meta.description) description = meta.description
        }
      } catch {
        // Ignore parse errors; fall back to filename-based title.
      }

      let updatedAt: string | undefined
      try {
        const stat = fs.statSync(fullPath)
        updatedAt = new Date(stat.mtimeMs).toISOString().slice(0, 10)
      } catch {
        // ignore
      }

      return {
        slug,
        fileName,
        kind,
        title,
        description,
        href,
        updatedAt,
      } satisfies ArticleEntry
    })

  // Stable ordering: newest first when possible, then title.
  return entries.sort((a, b) => {
    if (a.updatedAt && b.updatedAt && a.updatedAt !== b.updatedAt) return a.updatedAt < b.updatedAt ? 1 : -1
    if (a.updatedAt && !b.updatedAt) return -1
    if (!a.updatedAt && b.updatedAt) return 1
    return a.title.localeCompare(b.title)
  })
}

export function findArticleBySlug(slug: string) {
  return listArticles().find((a) => a.slug === slug)
}

export function publicAssetUrl(entry: ArticleEntry) {
  return `/articles/${entry.fileName}`
}

export function readArticleTextFile(entry: ArticleEntry) {
  const fullPath = path.join(articlesDir, entry.fileName)
  return fs.readFileSync(fullPath, 'utf8')
}
