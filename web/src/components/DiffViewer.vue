<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'

const props = defineProps<{
  primarySections: Map<string, string>
  compareSections: Map<string, string>
  primaryName: string
  compareName: string
}>()

type DiffRow = { type: 'same' | 'add' | 'remove'; left: string; right: string }

const commonSections = computed(() => {
  const a = Array.from(props.primarySections.keys())
  const b = new Set(props.compareSections.keys())
  return a.filter(k => b.has(k)).sort()
})

const selectedSection = ref('')

watch(commonSections, (sections) => {
  if (!selectedSection.value && sections.length) selectedSection.value = sections.includes('resource') ? 'resource' : sections[0]
}, { immediate: true })

// Simple LCS line-level diff: safe text only, no HTML rendering.
const createDiff = (leftText: string, rightText: string): DiffRow[] => {
  const a = leftText.split('\n')
  const b = rightText.split('\n')
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))

  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const rows: DiffRow[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      rows.push({ type: 'same', left: a[i], right: b[j] })
      i++; j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ type: 'remove', left: a[i], right: '' })
      i++
    } else {
      rows.push({ type: 'add', left: '', right: b[j] })
      j++
    }
  }
  while (i < a.length) rows.push({ type: 'remove', left: a[i++], right: '' })
  while (j < b.length) rows.push({ type: 'add', left: '', right: b[j++] })
  return rows
}

const diffRows = computed(() => {
  const section = selectedSection.value
  if (!section) return []
  return createDiff(props.primarySections.get(section) || '', props.compareSections.get(section) || '')
})

const stats = computed(() => ({
  added: diffRows.value.filter(r => r.type === 'add').length,
  removed: diffRows.value.filter(r => r.type === 'remove').length,
  same: diffRows.value.filter(r => r.type === 'same').length,
}))
</script>

<template>
  <section class="diff-viewer">
    <div class="section-header">
      <div>
        <p class="eyebrow">Compare</p>
        <h2>Configuration Diff</h2>
        <p>{{ primaryName }} ↔ {{ compareName }}</p>
      </div>
      <Dropdown v-model="selectedSection" :options="commonSections" placeholder="Select section" class="diff-section-select" />
    </div>

    <div class="diff-stats">
      <Tag :value="`${stats.added} additions`" severity="success" rounded />
      <Tag :value="`${stats.removed} removals`" severity="danger" rounded />
      <Tag :value="`${stats.same} unchanged`" severity="secondary" rounded />
    </div>

    <div v-if="!commonSections.length" class="empty-state">Upload a second compatible supout.rif file to compare sections.</div>

    <div v-else class="diff-table">
      <div class="diff-header left">{{ primaryName }}</div>
      <div class="diff-header right">{{ compareName }}</div>
      <template v-for="(row, idx) in diffRows" :key="idx">
        <pre class="diff-cell" :class="row.type === 'remove' ? 'removed' : row.type">{{ row.left }}</pre>
        <pre class="diff-cell" :class="row.type === 'add' ? 'added' : row.type">{{ row.right }}</pre>
      </template>
    </div>
  </section>
</template>
