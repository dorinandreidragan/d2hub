import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

// https://vitepress.dev/reference/site-config
// The `base` option controls the root path for all site assets and links.
// We set it dynamically using the VITEPRESS_BASE environment variable so that:
// - Production deploys to dorinandreidragan.github.io use '/'
// - QA deploys to d2hub-qa use '/d2hub-qa/'
// This ensures correct asset and link resolution in both environments.
const base = process.env.VITEPRESS_BASE || '/';

export default withMermaid(
defineConfig({
  base,
  title: "d2hub",
  description: "dorin dragan hub",
  head: [
    // Light mode favicon
    [
      'link',
      { rel: 'icon', href: '/favicon-light.png', type: 'image/png', media: '(prefers-color-scheme: light)' }
    ],
    [
      'link',
      { rel: 'icon', href: '/favicon-dark.png', type: 'image/png', media: '(prefers-color-scheme: dark)' }
    ],
    [
      'script',
      { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-SF1X95W1XW' }
    ],
    [
      'script',
      {},
      `if (
        location.hostname !== 'localhost' &&
        location.hostname !== '127.0.0.1' &&
        !location.pathname.startsWith('/d2hub-qa')
      ) {
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-SF1X95W1XW');
      }`
    ]
  ],
  themeConfig: {
    logo: {
      light: '/logo-light.svg',
      dark: '/logo-dark.svg'
    },
    search: {
      provider: "local"
    },
    nav: [
      { text: 'home', link: '/' },
      { text: 'about', link: '/about' }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/dorinandreidragan' },
      { icon: 'linkedin', link: 'https://www.linkedin.com/in/dorin-andrei-dragan-17b4667/' }
    ]
  },
  ignoreDeadLinks: 'localhostLinks',
}))
