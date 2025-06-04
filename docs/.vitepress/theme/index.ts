import DefaultTheme from 'vitepress/theme'
import BlogIndex from '../components/BlogIndex.vue'
import AboutCard from '../components/AboutCard.vue'
import ArticleStatusBadge from '../components/ArticleStatusBadge.vue'
import "./custom.css"

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component('BlogIndex', BlogIndex);
    app.component('AboutCard', AboutCard);
    app.component('ArticleStatusBadge', ArticleStatusBadge);
  }
}

