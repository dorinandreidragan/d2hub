<template>
  <div class="post-card post-card--link">
    <div class="post-card__header">
      <a class="post-card__title-link" :href="link" tabindex="0">
        <h3 class="post-card__title">{{ title }}</h3>
      </a>
      <div class="post-card__header-right">
        <ArticleStatusBadge v-if="status" :status="status" />
        <span class="post-card__date">{{ date }}</span>
      </div>
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

<script setup>
import ArticleStatusBadge from './ArticleStatusBadge.vue';
const props = defineProps({
  title: { type: String, required: true },
  date: { type: String, required: true },
  tags: { type: Array, default: () => [] },
  link: { type: String, required: true },
  series: { type: [String, null], default: '' },
  episode: { type: [Number, String, null], default: null },
  summary: { type: String, default: '' },
  status: { type: String, default: null }
});
</script>

<style scoped>
.post-card__summary {
  font-size: 1.05rem;
  color: var(--vp-c-text-2);
  margin-bottom: 0.7rem;
}
.post-card__series {
  display: block;
  margin-bottom: 0.3em;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-alt);
  border-left: 4px solid var(--vp-c-brand-2);
  padding: 0.2em 0.8em;
  font-size: 1em;
  font-style: italic;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.post-card {
  display: block;
  background: var(--vp-c-bg);
  color: var(--vp-c-brand-1);
  border-radius: 1rem;
  box-shadow: 0 2px 16px 0 rgba(0,0,0,0.07);
  padding: 1.5rem 2rem 1.2rem 2rem;
  margin: 1.5rem 0;
  transition: box-shadow 0.2s, background 0.2s;
  border: 1px solid var(--vp-c-divider);
  position: relative;
  overflow: hidden;
  text-decoration: none;
}
.post-card:hover, .post-card:focus {
  box-shadow: 0 4px 32px 0 rgba(0,0,0,0.12);
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  outline: none;
}
.post-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.7rem;
}
.post-card__header-right {
  display: flex;
  align-items: center;
  gap: 0.7em;
}
.post-card__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: var(--vp-c-text-1);
  flex: 1;
  display: inline;
}

.post-card__title-link {
  text-decoration: none;
  color: inherit;
}
.post-card__title-link:hover .post-card__title {
  text-decoration: underline;
}

.post-card__readmore {
  display: inline-block;
  margin-top: 1rem;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-weight: 500;
  font-size: 1em;
}
.post-card__readmore:hover {
  text-decoration: underline;
}
.post-card__date {
  font-size: 0.98rem;
  color: var(--vp-c-text-2);
  margin-left: 1rem;
  white-space: nowrap;
}
 .post-card__tags {
  margin-bottom: 0.8rem;
}
.post-card__tag {
  display: inline-block;
  background: transparent;
  color: var(--vp-c-brand-1);
  font-size: 0.97em;
  margin-right: 0.6em;
  margin-bottom: 0.1em;
  font-weight: 500;
  letter-spacing: 0.01em;
  border: none;
  padding: 0;
  transition: color 0.2s;
}
.post-card__tag:last-child {
  margin-right: 0;
}
.post-card__content {
  font-size: 1.04rem;
  color: var(--vp-c-text-1);
  margin-top: 0.2rem;
}
</style>

/* Badge styles are now in ArticleStatusBadge.vue */

