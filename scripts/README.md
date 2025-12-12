# Scripts

This folder contains helper scripts for the docs site. At the moment it includes `generate_blog_index.py`, which builds the `docs/public/blog-index.json` file consumed by the VitePress `BlogIndex` component.

## generate_blog_index.py

Creates a JSON index of all markdown articles under `docs/articles/` by reading their YAML frontmatter.

- **Output:** `docs/public/blog-index.json`
- **Environments:**
  - `production` (default) — excludes articles with `status: draft`.
  - `qa` — includes drafts.
- **Frontmatter fields captured:** `title` (falls back to filename), `date`, `category`, `tag`, optional `series` (`{ name, episode }`), `order`, `summary`, `path`, `status`.
- **Path format:** `/articles/<relative-path-without-extension>`.

### Prerequisites

- Python 3.8+
- Dependencies: `PyYAML`

Install dependency (from repo root):

```bash
pip install pyyaml
```

### Usage

Run from the repo root so paths resolve correctly:

```bash
python scripts/generate_blog_index.py --env production
```

For QA (includes drafts):

```bash
python scripts/generate_blog_index.py --env qa
```

The resulting `blog-index.json` should be committed when article content changes so the homepage stays in sync.
