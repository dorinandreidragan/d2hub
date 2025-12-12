# d2hub

Personal documentation site built with VitePress. Raw, fast, and fully custom. No platform noise. Just content.

## what is this?

A collection of practical guides, technical insights, and lessons from real-world experience. Topics span:

- **System Design**: Architecture, caching, observability, testing
- **DevOps**: CI/CD, containers, high availability, automation
- **Programming**: ASP.NET, Python, testing strategies
- **Tools**: VSCode, MCP, Jupyter, Ansible
- **Scripting**: PowerShell, bash, config management

## structure

```
docs/
├── articles/           # all articles live here
│   ├── *.md           # standalone articles
│   └── books-inventory/  # series articles grouped by topic
├── .vitepress/
│   ├── components/    # Vue components (BlogIndex, PostCard, etc.)
│   ├── config.mts     # VitePress config
│   └── theme/         # custom theme
├── .assets/           # images, diagrams, cover art
└── public/            # static files (blog-index.json, PDFs, etc.)
```

## tech stack

- **VitePress**: Static site generator, fast builds, Vue-powered components
- **Vue 3**: Custom components for article listing and navigation
- **GitHub Pages**: Free hosting with automated deployments
- **Google Analytics**: Traffic tracking (disabled on localhost and QA)
- **Python**: Scripts for generating `blog-index.json` from article frontmatter

## local development

Install dependencies:

```bash
npm install
```

Start dev server:

```bash
npm run docs:dev
```

Build for production:

```bash
npm run docs:build
```

Preview production build:

```bash
npm run docs:preview
```

## writing articles

### article structure

Every article starts with YAML frontmatter:

```yaml
---
title: "your article title in lowercase"
date: YYYY-MM-DD
category:
  - main-category
order: N  # optional
tag:
  - tag1
  - tag2
summary: "one-sentence hook explaining the value."
series:  # optional, for multi-part articles
  name: "series name"
  episode: N
status: draft  # optional, excludes from production
---
```

Follow with:

```markdown
<ArticleStatusBadge />

# your article title

Content goes here...
```

### generating the blog index

After adding or updating articles, regenerate `blog-index.json`:

```bash
python scripts/generate_blog_index.py --env production
```

For QA (includes drafts):

```bash
python scripts/generate_blog_index.py --env qa
```

See `scripts/README.md` for details.

## deployment

Two environments, both automated via GitHub Actions:

### production

- **Trigger**: Push to `main` branch
- **Workflow**: `.github/workflows/deploy-docs.yml`
- **Destination**: `dorinandreidragan.github.io` (main branch)
- **Base path**: `/`
- **Excludes**: Articles with `status: draft`

### qa

- **Trigger**: Push to any branch except `main`
- **Workflow**: `.github/workflows/deploy-docs-qa.yml`
- **Destination**: `d2hub-qa` repo (main branch)
- **Base path**: `/d2hub-qa/`
- **Includes**: Draft articles for preview

Both workflows:

1. Checkout code
2. Install Node.js 20 and dependencies
3. Build with VitePress (setting `VITEPRESS_BASE` for correct paths)
4. Deploy to target GitHub Pages repo using `peaceiris/actions-gh-pages`

## custom components

### BlogIndex

Fetches `blog-index.json` and renders article cards sorted by date. Used on the homepage.

### PostCard

Displays article metadata: title, date, tags, summary, series info, and status badge. Supports series episodes and draft indicators.

### ArticleStatusBadge

Shows a badge for draft articles or other status markers. Automatically included in articles.

### AboutCard

Personal intro card with avatar and bio. Used on `/about`.

## key features

- **No sidebar**: Clean, focused reading experience
- **Fuzzy search**: VitePress local search for quick navigation
- **Series support**: Multi-part articles grouped with episode numbers
- **Draft workflow**: Preview drafts in QA before publishing
- **Analytics**: Google Analytics (skips localhost and QA)
- **Dark mode**: Automatic theme switching with custom favicons and logo

## why this exists

Platform limitations get in the way. This site gives complete control over content, design, and deployment. No algorithm. No distractions. Just documentation.

Want to see it live? [dorinandreidragan.github.io](https://dorinandreidragan.github.io/)

Source on [GitHub](https://github.com/dorinandreidragan/d2hub).
