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
          <i :class="iconMap(item.severity)"></i>
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
