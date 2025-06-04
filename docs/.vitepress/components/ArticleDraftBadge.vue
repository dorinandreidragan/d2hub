<template>
  <span v-if="status === 'draft'" class="article-badge article-badge--draft">DRAFT</span>
</template>

<script setup>
import { useData } from 'vitepress';
const { frontmatter } = useData();
const status = frontmatter.value.status;
</script>

<style scoped>
.article-badge {
  display: inline-block;
  margin-bottom: 1.2em;
  padding: 0.2em 1em;
  font-size: 1em;
  font-weight: 700;
  border-radius: 0.5em;
  background: #f7b500;
  color: #222;
  letter-spacing: 0.04em;
  vertical-align: middle;
  border: 1px solid #e0a800;
}
.article-badge--draft {
  background: #f7b500;
  color: #222;
}
</style>
