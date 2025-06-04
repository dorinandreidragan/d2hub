---
title: "host documentation on github pages with vuepress"
date: 2024-02-04
category:
  - documentation
order: 4
tag:
  - documentation
  - vuepress
  - github-pages
summary: "Host your documentation on GitHub Pages using VuePress for a simple, effective workflow."
---

<ArticleStatusBadge />

# host documentation on GitHub Pages with VuePress

I use VuePress for the documentation site because is simple. For the VuePress site I will be using
the [vuepress-theme-hope] Vuepress theme which is awesome.

## install prerequisites

Install VuePress and the VuePress theme.

```bash
npm init vuepress-theme-hope docs
```

## install packages for plugins

### mermaid

```bash
npm i -D mermaid
```

For more details see how to setup [Mermaid] for [vuepress-theme-hope].

[Mermaid]: https://theme-hope.vuejs.press/guide/markdown/mermaid.html
[vuepress-theme-hope]: https://theme-hope.vuejs.press/
