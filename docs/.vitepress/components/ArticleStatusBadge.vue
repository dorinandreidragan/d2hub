
<template>
  <span v-if="effectiveStatus" :class="['article-badge', statusClass]">
    {{ effectiveStatus.toUpperCase() }}
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { useData } from 'vitepress';
const props = defineProps({
  status: { type: String, default: null }
});
const { frontmatter } = useData();
const effectiveStatus = computed(() => props.status || frontmatter.value.status || null);
const statusClass = computed(() => {
  if (!effectiveStatus.value) return '';
  if (effectiveStatus.value === 'draft') return 'article-badge--draft';
  // Add more status types here if needed
  return '';
});
</script>

<style scoped>
.article-badge {
  display: inline-block;
  margin-left: 0.7em;
  margin-bottom: 1.2em;
  padding: 0.2em 1em;
  font-size: 0.95em;
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
