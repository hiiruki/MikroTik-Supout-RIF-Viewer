<script setup lang="ts">
import { computed, ref } from 'vue'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import { parseFirewall, parseRoutes, FirewallRule } from '../lib/parsers'

const props = defineProps<{
  sections: Map<string, string>
}>()

const firewall = computed(() => parseFirewall(props.sections.get('firewall') || ''))
const routes = computed(() => parseRoutes(props.sections.get('routing') || props.sections.get('ip') || ''))

const filter = ref('')

const matches = (r: FirewallRule) => {
  if (!filter.value) return true
  const q = filter.value.toLowerCase()
  return r.chain.toLowerCase().includes(q) ||
    r.action.toLowerCase().includes(q) ||
    Object.entries(r.attrs).some(([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q))
}

const filteredNat = computed(() => firewall.value.nat.filter(matches))
const filteredFilter = computed(() => firewall.value.filter.filter(matches))
const filteredMangle = computed(() => firewall.value.mangle.filter(matches))
const filteredRaw = computed(() => firewall.value.raw.filter(matches))

const actionSeverity = (action: string) => {
  if (['drop', 'reject'].includes(action)) return 'danger'
  if (['accept', 'passthrough'].includes(action)) return 'success'
  if (['masquerade', 'src-nat', 'dst-nat', 'redirect'].includes(action)) return 'info'
  return 'secondary'
}

const summarize = (attrs: Record<string, string>): string => {
  const keys = ['src-address', 'dst-address', 'src-address-list', 'dst-address-list',
    'protocol', 'src-port', 'dst-port', 'in-interface', 'out-interface',
    'to-addresses', 'to-ports', 'connection-state']
  return keys
    .filter(k => attrs[k])
    .map(k => `${k}=${attrs[k]}`)
    .join(' ')
}

const totalRules = computed(() =>
  firewall.value.nat.length + firewall.value.filter.length +
  firewall.value.mangle.length + firewall.value.raw.length,
)
</script>

<template>
  <section class="network-view">
    <div class="section-header">
      <div>
        <p class="eyebrow">Firewall &amp; Routing</p>
        <h2>Network Rules</h2>
        <p>{{ totalRules }} firewall rules · {{ routes.length }} routes</p>
      </div>
      <span class="p-input-icon-left search-box">
        <i class="pi pi-search"></i>
        <InputText v-model="filter" placeholder="Filter chain, action, address…" />
      </span>
    </div>

    <Card v-if="routes.length" class="net-card">
      <template #title>Routes</template>
      <template #content>
        <DataTable :value="routes" size="small" stripedRows responsiveLayout="scroll">
          <Column field="flags" header="Flags">
            <template #body="{ data }">
              <Tag v-if="data.active" value="A" severity="success" rounded />
              <Tag v-if="data.dynamic" value="D" severity="info" rounded />
              <Tag v-if="data.connect" value="c" severity="secondary" rounded />
            </template>
          </Column>
          <Column field="dst" header="Destination" />
          <Column field="gateway" header="Gateway" />
          <Column field="table" header="Table" />
          <Column field="distance" header="Dist" />
        </DataTable>
      </template>
    </Card>

    <Card v-if="filteredNat.length" class="net-card">
      <template #title>NAT ({{ filteredNat.length }}/{{ firewall.nat.length }})</template>
      <template #content>
        <div v-for="(r, i) in filteredNat" :key="`nat-${i}`" class="fw-rule" :class="{ disabled: r.disabled }">
          <Tag :value="r.chain" severity="secondary" rounded />
          <Tag :value="r.action" :severity="actionSeverity(r.action)" rounded />
          <span class="fw-attrs">{{ summarize(r.attrs) }}</span>
        </div>
      </template>
    </Card>

    <Card v-if="filteredFilter.length" class="net-card">
      <template #title>Filter ({{ filteredFilter.length }}/{{ firewall.filter.length }})</template>
      <template #content>
        <div v-for="(r, i) in filteredFilter" :key="`f-${i}`" class="fw-rule" :class="{ disabled: r.disabled }">
          <Tag :value="r.chain" severity="secondary" rounded />
          <Tag :value="r.action" :severity="actionSeverity(r.action)" rounded />
          <span class="fw-attrs">{{ summarize(r.attrs) }}</span>
        </div>
      </template>
    </Card>

    <Card v-if="filteredMangle.length" class="net-card">
      <template #title>Mangle ({{ filteredMangle.length }}/{{ firewall.mangle.length }})</template>
      <template #content>
        <div v-for="(r, i) in filteredMangle" :key="`m-${i}`" class="fw-rule" :class="{ disabled: r.disabled }">
          <Tag :value="r.chain" severity="secondary" rounded />
          <Tag :value="r.action" :severity="actionSeverity(r.action)" rounded />
          <span class="fw-attrs">{{ summarize(r.attrs) }}</span>
        </div>
      </template>
    </Card>

    <Card v-if="filteredRaw.length" class="net-card">
      <template #title>Raw ({{ filteredRaw.length }}/{{ firewall.raw.length }})</template>
      <template #content>
        <div v-for="(r, i) in filteredRaw" :key="`r-${i}`" class="fw-rule" :class="{ disabled: r.disabled }">
          <Tag :value="r.chain" severity="secondary" rounded />
          <Tag :value="r.action" :severity="actionSeverity(r.action)" rounded />
          <span class="fw-attrs">{{ summarize(r.attrs) }}</span>
        </div>
      </template>
    </Card>

    <div v-if="!totalRules && !routes.length" class="empty-state">
      No firewall or routing data found.
    </div>
  </section>
</template>

<style scoped>
.network-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.eyebrow {
  margin: 0;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #a5d634;
}

.section-header h2 {
  margin: 0.2rem 0 0.3rem;
  font-size: 1.4rem;
}

.section-header p {
  margin: 0;
  color: #9ca3af;
  font-size: 0.85rem;
}

.search-box {
  min-width: 260px;
}

.search-box :deep(input) {
  width: 100%;
}

.net-card {
  background: rgba(255, 255, 255, 0.025);
}

.fw-rule {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 0.8rem;
  flex-wrap: wrap;
}

.fw-rule:last-child {
  border-bottom: none;
}

.fw-rule.disabled {
  opacity: 0.4;
  text-decoration: line-through;
}

.fw-attrs {
  color: #cfd5c4;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  word-break: break-all;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}
</style>
