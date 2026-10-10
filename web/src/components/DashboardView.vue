<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import { parseResource, parseRouterboard, parseLicense } from '../lib/parsers'

const props = defineProps<{
  sections: Map<string, string>
}>()

const resource = computed(() => parseResource(props.sections.get('resource') || ''))
const routerboard = computed(() => parseRouterboard(props.sections.get('routerboard') || ''))
const license = computed(() => parseLicense(props.sections.get('license') || ''))

const memUsedPct = computed(() => {
  const r = resource.value
  if (!r.totalMemoryBytes) return 0
  return Math.round(((r.totalMemoryBytes - r.freeMemoryBytes) / r.totalMemoryBytes) * 100)
})

const diskUsedPct = computed(() => {
  const r = resource.value
  if (!r.totalHddBytes) return 0
  return Math.round(((r.totalHddBytes - r.freeHddBytes) / r.totalHddBytes) * 100)
})

const healthColor = (pct: number) => {
  if (pct >= 90) return '#ef4444'
  if (pct >= 75) return '#f59e0b'
  return '#84cc16'
}

const Gauge = {
  props: ['label', 'value', 'detail', 'color'],
  template: `
    <div class="metric-gauge">
      <svg class="gauge-svg" viewBox="0 0 120 120" aria-hidden="true">
        <circle class="gauge-bg" cx="60" cy="60" r="50" />
        <circle
          class="gauge-progress"
          cx="60" cy="60" r="50"
          :stroke="color"
          :stroke-dasharray="314"
          :stroke-dashoffset="314 - (314 * value / 100)"
        />
      </svg>
      <div class="gauge-center">
        <strong>{{ value }}%</strong>
        <span>{{ label }}</span>
      </div>
      <small>{{ detail }}</small>
    </div>
  `,
}
</script>

<template>
  <section class="dashboard-view">
    <div class="hero-panel">
      <div>
        <p class="eyebrow">Router Snapshot</p>
        <h1>{{ resource.boardName || routerboard.model || 'MikroTik Device' }}</h1>
        <p class="hero-subtitle">
          RouterOS {{ resource.version || 'unknown' }} · {{ resource.architecture || 'unknown architecture' }}
        </p>
      </div>
      <Tag :value="resource.platform || 'MikroTik'" severity="success" rounded />
    </div>

    <div class="dashboard-grid gauges-grid">
      <component
        :is="Gauge"
        label="CPU"
        :value="resource.cpuLoad"
        :detail="resource.cpu || 'CPU load'"
        :color="healthColor(resource.cpuLoad)"
      />
      <component
        :is="Gauge"
        label="Memory"
        :value="memUsedPct"
        :detail="`${resource.freeMemory || '0'} free / ${resource.totalMemory || '0'} total`"
        :color="healthColor(memUsedPct)"
      />
      <component
        :is="Gauge"
        label="Disk"
        :value="diskUsedPct"
        :detail="`${resource.freeHdd || '0'} free / ${resource.totalHdd || '0'} total`"
        :color="healthColor(diskUsedPct)"
      />
    </div>

    <div class="dashboard-grid info-grid">
      <Card class="info-card">
        <template #title>System</template>
        <template #content>
          <dl>
            <div><dt>Board</dt><dd>{{ resource.boardName || routerboard.boardName || '—' }}</dd></div>
            <div><dt>Model</dt><dd>{{ routerboard.model || '—' }}</dd></div>
            <div><dt>Serial</dt><dd>{{ routerboard.serialNumber || '—' }}</dd></div>
            <div><dt>Platform</dt><dd>{{ resource.platform || '—' }}</dd></div>
          </dl>
        </template>
      </Card>

      <Card class="info-card">
        <template #title>RouterOS</template>
        <template #content>
          <dl>
            <div><dt>Version</dt><dd>{{ resource.version || '—' }}</dd></div>
            <div><dt>Build Time</dt><dd>{{ resource.buildTime || '—' }}</dd></div>
            <div><dt>Current FW</dt><dd>{{ routerboard.currentFirmware || '—' }}</dd></div>
            <div><dt>Factory FW</dt><dd>{{ routerboard.factoryFirmware || resource.factorySoftware || '—' }}</dd></div>
          </dl>
        </template>
      </Card>

      <Card class="info-card">
        <template #title>Clock</template>
        <template #content>
          <dl>
            <div><dt>Uptime</dt><dd>{{ resource.uptime || '—' }}</dd></div>
            <div><dt>Date</dt><dd>{{ resource.clockDate || '—' }}</dd></div>
            <div><dt>Time</dt><dd>{{ resource.clockTime || '—' }}</dd></div>
            <div><dt>Timezone</dt><dd>{{ resource.timezone || resource.gmtOffset || '—' }}</dd></div>
          </dl>
        </template>
      </Card>

      <Card class="info-card">
        <template #title>License</template>
        <template #content>
          <dl>
            <div><dt>Software ID</dt><dd>{{ license.softwareId || '—' }}</dd></div>
            <div><dt>Level</dt><dd>{{ license.level || '—' }}</dd></div>
            <div><dt>Features</dt><dd>{{ license.features || '—' }}</dd></div>
          </dl>
        </template>
      </Card>
    </div>
  </section>
</template>
