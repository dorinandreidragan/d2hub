---
title: turn markdown into stunning pdf with eisvogel and zero hassle
date: 2025-06-06
author: dorin andrei drăgan
tag: [pdf, markdown, pandoc, eisvogel, automation]
summary: Instantly create beautiful PDFs from markdown using Eisvogel and Docker, no setup, just results.
---

<ArticleStatusBadge />

# turn markdown into stunning pdf with eisvogel and zero hassle

## skip the setup, get the style

Don’t waste time wrangling LaTeX or chasing down Pandoc dependencies. You want a beautiful PDF, not a weekend lost to package errors. Use the official Docker image. No installs. No drama. Just results. Full instructions and advanced options? [Check the git repo.](https://github.com/Wandmalfarbe/pandoc-latex-template)

## docker does the heavy lifting

Pull the image. Mount your project. Run the command. That’s it. The Eisvogel template is baked in. You get modern, sharp PDFs from markdown in seconds. No need to install Pandoc, LaTeX, or any obscure font package. The container handles everything. Page breaks? Automatic and elegant. Your sections start where they should—no manual tweaks.

```sh
docker run --rm \
  --volume "$(pwd):/data" \
  --user $(id -u):$(id -g) \
  pandoc/extra yourfile.md -o output.pdf --template eisvogel --listings
```

Your markdown stays clean. Your system stays clean. The PDF lands in your folder, styled and ready to share.

## action: a markdown example

Here’s a sample markdown file that shows off Eisvogel’s capabilities. Copy, paste, and export to see the style in action.

````markdown
---
title: "sample documentation"
author: "alex example"
date: "\\today"
titlepage: true
titlepage-color: "0A66C2"
titlepage-text-color: "FFFFFF"
titlepage-rule-color: "222222"
keywords: [sample, documentation, eisvogel]
---

# getting started

Welcome to the docs. This is a bold start. Let’s see what markdown can do.

## features

- automatic page breaks
- beautiful headings
- code blocks with syntax highlighting
- tables that don’t look like spreadsheets from 1999
- blockquotes for emphasis
- links that stand out
- lists, both ordered and unordered

## quick code

```python
def hello(name):
    print(f"Hello, {name}!")
hello("world")
```

## a table of possibilities

| feature     | supported | wow factor |
| ----------- | --------- | ---------- |
| headings    | yes       | high       |
| lists       | yes       | medium     |
| code blocks | yes       | high       |
| tables      | yes       | high       |
| blockquotes | yes       | subtle     |

## a quote to remember

> Simplicity is the soul of efficiency.
> — Austin Freeman

## more resources

- [Eisvogel on GitHub](https://github.com/Wandmalfarbe/pandoc-latex-template)
- [Pandoc](https://pandoc.org)
````

## see the result

Here’s how the exported PDF looks using Eisvogel and the sample markdown above:

![Sample Eisvogel PDF preview](../.assets/md-to-pdf/md-to-pdf.gif)

[Download the sample PDF](/md-to-pdf/sample-eisvogel.pdf)

The styling, page breaks, and layout are all handled for you. What you see is what you get.

## automate, impress, repeat

Every export is a statement. Add a Makefile, a script, or a CI job. Never ship ugly again. Share the PDF. Let your work speak before you do. Beautiful, styled documents, every time.
