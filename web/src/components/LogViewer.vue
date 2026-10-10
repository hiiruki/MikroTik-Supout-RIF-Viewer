<script setup lang="ts">
import { computed, ref } from 'vue'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import { parseLogs } from '../lib/parsers'

const props = defineProps<{
  sections: Map<string, string>
}>()

const search = ref('')
const selectedTopics = ref<Set<string>>(new Set())

const logs = computed(() => parseLogs(props.sections.get('log') || ''))

const allTopics = computed(() => {
  const set = new Set<string>()
  for (const log of logs.value) log.topics.forEach(t => set.add(t))
  return Array.from(set).sort()
})

const filteredLogs = computed(() => {
  const q = search.value.toLowerCase().trim()
  return logs.value.filter(log => {
    const matchesSearch = !q || `${log.timestamp} ${log.topics.join(',')} ${log.message}`.toLowerCase().includes(q)
    const matchesTopic = selectedTopics.value.size === 0 || log.topics.some(t => selectedTopics.value.has(t))
    return matchesSearch && matchesTopic
  })
})

const toggleTopic = (topic: string) => {
  const next = new Set(selectedTopics.value)
  if (next.has(topic)) next.delete(topic)
  else next.add(topic)
  selectedTopics.value = next
}

const topicSeverity = (topic: string) => {
  if (['critical', 'error'].includes(topic)) return 'danger'
  if (['warning'].includes(topic)) return 'warning'
  if (['info'].includes(topic)) return 'info'
  return 'secondary'
}

const isImportant = (topics: string[]) => topics.some(t => ['critical', 'error', 'warning'].includes(t))
</script>

<template>
  <section class="log-viewer">
    <div class="section-header">
      <div>
        <p class="eyebrow">Event Timeline</p>
        <h2>Searchable Logs</h2>
        <p>{{ filteredLogs.length }} / {{ logs.length }} entries shown</p>
      </div>
      <span class="p-input-icon-left log-search">
        <i class="pi pi-search" />
        <InputText v-model="search" placeholder="Search logs..." />
      </span>
    </div>

    <div v-if="allTopics.length" class="topic-filter-row">
      <button
        v-for="topic in allTopics"
        :key="topic"
        type="button"
        class="topic-chip"
        :class="{ active: selectedTopics.has(topic) }"
        @click="toggleTopic(topic)"
      >
        {{ topic }}
      </button>
    </div>

    <div class="log-table">
      <div v-if="!logs.length" class="empty-state">No logs found in this supout file.</div>
      <div
        v-for="log in filteredLogs"
        :key="`${log.timestamp}-${log.message}`"
        class="log-row"
        :class="{ important: isImportant(log.topics) }"
      >
        <div class="log-time">{{ log.timestamp }}</div>
        <div class="log-topics">
          <Tag v-for="topic in log.topics" :key="topic" :value="topic" :severity="topicSeverity(topic)" rounded />
        </div>
        <div class="log-message">{{ log.message }}</div>
      </div>
    </div>
  </section>
</template>
