<script setup lang="ts">
import { computed } from 'vue'
import Tag from 'primevue/tag'
import { parseInterfaces, parseAddresses } from '../lib/parsers'

const props = defineProps<{
  sections: Map<string, string>
}>()

const interfaces = computed(() => {
  const ifaces = parseInterfaces(props.sections.get('interface') || '')
  const addresses = parseAddresses(props.sections.get('address') || '')
  for (const iface of ifaces) {
    iface.ipAddresses = addresses.filter(a => a.iface === iface.name).map(a => a.address)
  }
  return ifaces
})

const iconFor = (type: string, name: string) => {
  if (type === 'wlan' || name.startsWith('wlan')) return 'pi pi-wifi'
  if (type === 'bridge' || name.includes('bridge')) return 'pi pi-sitemap'
  if (type === 'loopback') return 'pi pi-refresh'
  return 'pi pi-server'
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KiB', 'MiB', 'GiB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}
</script>

<template>
  <section class="interface-grid-view">
    <div class="section-header">
      <div>
        <p class="eyebrow">Network Map</p>
        <h2>Interfaces & IP Addresses</h2>
        <p>{{ interfaces.length }} interfaces detected</p>
      </div>
    </div>

    <div v-if="!interfaces.length" class="empty-state">No interface data found.</div>

    <div class="ports-grid">
      <article
        v-for="iface in interfaces"
        :key="iface.name"
        class="port-card"
        :class="{ running: iface.running, down: !iface.running, slave: iface.slave }"
      >
        <div class="port-top-row">
          <div class="port-icon"><i :class="iconFor(iface.type, iface.name)"></i></div>
          <Tag :value="iface.running ? 'running' : 'down'" :severity="iface.running ? 'success' : 'secondary'" rounded />
        </div>
        <h3>{{ iface.name }}</h3>
        <p class="port-type">{{ iface.type }} · MTU {{ iface.mtu }}</p>
        <p class="port-mac">{{ iface.mac }}</p>
        <div class="port-stats">
          <span>RX {{ formatBytes(iface.rxBytes) }}</span>
          <span>TX {{ formatBytes(iface.txBytes) }}</span>
        </div>
        <div v-if="iface.linkDowns" class="link-downs">
          <i class="pi pi-exclamation-triangle"></i> {{ iface.linkDowns }} link down(s)
        </div>
        <div v-if="iface.ipAddresses.length" class="ip-badges">
          <Tag v-for="ip in iface.ipAddresses" :key="ip" :value="ip" severity="info" rounded />
        </div>
      </article>
    </div>
  </section>
</template>
