---
title: "how i switched from dev.to to my own documentation site"
date: 2025-06-02
category:
  - blogging
tag:
  - documentation
  - vitepress
  - vue
  - vibe coding
  - vscode
  - githubcopilot
summary: "How I left dev.to and built my own raw, fast, and fully custom docs site with vitepress, vue, and my own rules."
status: draft
---

<ArticleStatusBadge />

# how i switched from dev.to to my own doc site

[dev.to]? Too polished. Too many hearts and hashtags. I wanted something raw, minimal, and mine. No more fighting the platform. No more bending to someone else’s design. I wanted a place where I could write, tweak, break, and rebuild. No limits. No noise.

So I built my own docs site. It’s not for everyone. But it’s exactly what I need: clean, fast, and under my control. Here’s how I did it, and why you might want to do the same.

## tech stack, no apologies

No bloat, no distractions. Just the essentials:

- **[vitepress] and [vue]:** Yes! Fast. Blazing, even. vitepress makes [deployment to github pages] a joke. With vue, I shape components to my will. `BlogIndex`, `PostCard`, `AboutCard`. Each one does exactly what I want, nothing more.

- **[github pages]:** Free hosting, public, no nonsense. My site, my rules.

- **[google analytics]:** dev.to gives you numbers, but they’re not yours. On your own site, you see everything. You control what’s tracked, and you can filter out your own IP so your stats aren’t polluted.

- And yes, **[vibe coding]**! Sometimes you want to build a UI component without getting lost in vue’s boilerplate. Vibe coding lets you do that. It’s fun. Try it.

## how i did it, step by step

### vitepress installation?

Simple. `npm create vitepress@latest` and you’re off. The docs are clear. Follow them, [deploy to github pages][deployment to github pages] in minutes. Build and preview with:

```json
// package.json (excerpt)
"scripts": {
  "docs:dev": "vitepress dev docs",
  "docs:build": "vitepress build docs",
  "docs:preview": "vitepress preview docs"
}
```

### vue components?

I built `BlogIndex` to list posts, `PostCard` for each article, `AboutCard` for the personal touch. No sidebar. No clutter. Just what matters.

#### blog index

Here’s how `BlogIndex` fetches and displays articles:

```vue
<!-- docs/.vitepress/components/BlogIndex.vue (excerpt) -->
<template>
  <div>
    <div v-if="loading">Loading articles...</div>
    <div v-else-if="error">Error loading articles: {{ error }}</div>
    <div v-else-if="!articles.length">No articles found.</div>
    <template v-else>
      <div v-if="articles.length">
        <PostCard
          v-for="article in sortedArticles"
          :key="article.path"
          :title="article.title"
          :date="article.date || ''"
          :tags="article.tag || []"
          :link="article.path"
          :series="article.series ? article.series.name : ''"
          :episode="article.series && article.series.episode ? article.series.episode : null"
          :summary="article.summary"
        >
        </PostCard>
      </div>
    </template>
  </div>
</template>
```

#### post card

Sharp and neat `PostCard` component:

```vue
<!-- docs/.vitepress/components/PostCard.vue (excerpt) -->
<template>
  <div class="post-card post-card--link">
    <div class="post-card__header">
      <a class="post-card__title-link" :href="link" tabindex="0">
        <h3 class="post-card__title">{{ title }}</h3>
      </a>
      <span class="post-card__date">{{ date }}</span>
    </div>
    <div v-if="series" class="post-card__series">
      series: {{ series }}<span v-if="episode">, episode {{ episode }}</span>
    </div>
    <div class="post-card__tags">
      <span v-for="tag in tags" :key="tag" class="post-card__tag">#{{ tag }}</span>
    </div>
    <div v-if="summary" class="post-card__summary">
      {{ summary }}
    </div>
    <div class="post-card__content">
      <slot />
    </div>
  </div>
</template>
```

### vitepress config?

Stripped down. [home] page, [about] page, logo front and center. Fuzzy search. No sidebar. You want something? Search for it.

#### home page

```yaml
# index.md (excerpt)_
---
layout: home

hero:
  name: "dorin dragan hub"
  tagline: documentation represents who you are
---
<BlogIndex />
```

#### about page

Uses `AboutCard` component.

```md
# docs/about.md (excerpt)

<AboutCard avatar="profile.jpeg" title="dorin andrei dragan">
  <p>I build, break, and fix things,<br/> then share what I learn.</p>
  <p>this site is a collection of practical guides, tech insights, and lessons from real-world experience.</p>
  <p>curious? dive in and level up your skills.</p>
</AboutCard>
```

### analytics?

Here’s how analytics is added in vitepress:

```ts
// docs/.vitepress/config.mts (excerpt)
head: [
  ["script", { async: "", src: "https://www.googletagmanager.com/gtag/js?id=G-SF1X95W1XW" }],
  [
    "script",
    {},
    `if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-SF1X95W1XW');
    }`,
  ],
];
```

### github pages?

Here’s how deploy is automated:

```yaml
# .github/workflows/deploy-docs.yml (excerpt)
name: deploy d2hub to ghpages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Install dependencies
        run: npm ci
      - name: Build with VitePress
        run: npm run docs:build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## why not?

there is no reason not to have your own docs site. You own it. You control it. You decide what it looks like, what it tracks, what it shows. Want to see the code? [github repo](https://github.com/dorinandreidragan/dorinandreidragan.github.io).

[vitepress]: https://vitepress.dev/
[deployment to github pages]: https://vitepress.dev/guide/deploy#github-pages
[vue]: https://vuejs.org/
[github pages]: https://pages.github.com/
[google analytics]: https://analytics.google.com/
[vibe coding]: https://en.wikipedia.org/wiki/Vibe_coding
[home]: https://dorinandreidragan.github.io/
[about]: https://dorinandreidragan.github.io/about.html
[dev.to]: https://dev.to
