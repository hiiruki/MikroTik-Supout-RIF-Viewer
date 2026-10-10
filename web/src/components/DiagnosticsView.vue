<script setup lang="ts">
import { computed } from 'vue'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { runDiagnostics, DiagnosticSeverity } from '../lib/parsers'

const props = defineProps<{
  sections: Map<string, string>
}>()

const diagnostics = computed(() => runDiagnostics(props.sections))

const severityMap = (severity: DiagnosticSeverity) => {
  if (severity === 'critical') return 'error'
  if (severity === 'warning') return 'warn'
  if (severity === 'ok') return 'success'
  return 'info'
}

const iconMap = (severity: DiagnosticSeverity) => {
  if (severity === 'critical') return 'pi pi-exclamation-triangle'
  if (severity === 'warning') return 'pi pi-exclamation-circle'
  if (severity === 'ok') return 'pi pi-check-circle'
  return 'pi pi-info-circle'
}

const counts = computed(() => ({
  critical: diagnostics.value.filter(d => d.severity === 'critical').length,
  warning: diagnostics.value.filter(d => d.severity === 'warning').length,
  info: diagnostics.value.filter(d => d.severity === 'info').length,
  ok: diagnostics.value.filter(d => d.severity === 'ok').length,
}))
</script>

<template>
  <section class="diagnostics-view">
    <div class="section-header">
      <div>
        <p class="eyebrow">Automated Analysis</p>
        <h2>Smart Diagnostics</h2>
        <p>Potential issues detected from resource, log, interface, oops and routerboard sections.</p>
      </div>
      <div class="diagnostic-counters">
        <Tag :value="`${counts.critical} critical`" severity="danger" rounded />
        <Tag :value="`${counts.warning} warning`" severity="warning" rounded />
        <Tag :value="`${counts.info} info`" severity="info" rounded />
      </div>
    </div>

    <div class="diagnostic-list">
      <Message
        v-for="item in diagnostics"
        :key="`${item.severity}-${item.title}`"
        :severity="severityMap(item.severity)"
        :closable="false"
        class="diagnostic-message"
      >
        <template #messageicon>
          <i :class="[iconMap(item.severity), 'diagnostic-icon', 'p-message-icon']"></i>
        </template>
        <div class="diagnostic-content">
          <div class="diagnostic-title-row">
            <strong>{{ item.title }}</strong>
            <Tag v-if="item.section" :value="item.section" severity="secondary" rounded />
          </div>
          <p>{{ item.detail }}</p>
        </div>
      </Message>
    </div>
  </section>
</template>

<style scoped>
.diagnostics-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.diagnostic-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

:deep(.p-message.diagnostic-message) {
  margin: 0;
  border-radius: 14px;
}

:deep(.diagnostic-message .p-message-wrapper) {
  display: flex !important;
  align-items: flex-start !important;
  gap: 0.85rem !important;
  padding: 0.85rem 1.1rem !important;
}

:deep(.diagnostic-icon) {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem !important;
  line-height: 1 !important;
  margin-top: 0.15rem !important;
  margin-right: 0 !important;
  flex-shrink: 0 !important;
}

:deep(.diagnostic-message .p-message-text) {
  flex: 1 !important;
  min-width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.diagnostic-content {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
}

.diagnostic-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.diagnostic-title-row strong {
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.4;
  color: inherit;
}

.diagnostic-content p {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  opacity: 0.92;
  word-break: break-word;
}
</style>
