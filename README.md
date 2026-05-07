# Article Portfolio (Cloudflare Pages)

This is a simple portfolio site that automatically lists everything you drop into `public/articles/` as clickable, soft-cornered cards.

## Add articles (upload-by-file)

Put files in `public/articles/` and redeploy:

- HTML articles: `.html` (your existing export works)
- PDFs: `.pdf`
- Photos: `.png`, `.jpg`, `.webp`, `.gif`, `.svg`
- Plain text: `.txt`
- Markdown: `.md` (rendered nicely)

The home page auto-detects new files on build and shows them as cards. Clicking a card opens `/article/<slug>`.

## Local dev

```bash
npm install
npm run dev
```

Build / preview:

```bash
npm run build
npm run preview
```

## Deploy to Cloudflare Pages (GitHub)

1. Create a new GitHub repo (separate from your game repo).
2. Push this project to that repo.
3. In Cloudflare Dashboard → **Pages** → **Create a project** → Connect to GitHub.
4. Build settings:
	- Framework preset: **Astro** (or “None”)
	- Build command: `npm run build`
	- Build output directory: `dist`
5. Deploy.

Whenever you add new files into `public/articles/` and push to GitHub, Cloudflare Pages will redeploy automatically.
