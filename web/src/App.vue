<script setup lang="ts">
import Card from 'primevue/card'
import Listbox from 'primevue/listbox'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import FileUpload, {FileUploadUploaderEvent} from 'primevue/fileupload'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'

import {Ref, ref, computed} from 'vue'

import {decode} from './lib/decoder.ts'
import DashboardView from './components/DashboardView.vue'
import DiagnosticsView from './components/DiagnosticsView.vue'
import LogViewer from './components/LogViewer.vue'
import InterfaceGrid from './components/InterfaceGrid.vue'
import DiffViewer from './components/DiffViewer.vue'
import ExportButton from './components/ExportButton.vue'
import NetworkView from './components/NetworkView.vue'

type UploadedFileInfo = {
  name: string
  size: number
  lastModified: number
}

const sections: Ref<Map<string, string>> = ref(new Map())
const compareSections: Ref<Map<string, string>> = ref(new Map())

const selectedSection: Ref<string | null> = ref(null)
const uploadedFile: Ref<UploadedFileInfo | null> = ref(null)
const compareFile: Ref<UploadedFileInfo | null> = ref(null)
const sectionQuery = ref('')

const selectableSections = computed(() => {
  const q = sectionQuery.value.trim().toLowerCase()
  const all = Array.from(sections.value.keys()).sort()
  if (!q) return all
  return all.filter(name =>
    name.toLowerCase().includes(q) ||
    (sections.value.get(name) || '').toLowerCase().includes(q),
  )
})
const hasPrimaryFile = computed(() => sections.value.size > 0)
const hasCompareFile = computed(() => compareSections.value.size > 0)

const features = [
  { icon: 'pi pi-chart-bar', title: 'Dashboard', desc: 'CPU, memory, uptime, storage & board info at a glance.' },
  { icon: 'pi pi-exclamation-triangle', title: 'Diagnostics', desc: 'Warnings, errors, and suspicious configuration flags.' },
  { icon: 'pi pi-list', title: 'Log Analysis', desc: 'Searchable, filterable RouterOS system logs.' },
  { icon: 'pi pi-sitemap', title: 'Interfaces', desc: 'Port status, MAC addresses, traffic stats & IP info.' },
  { icon: 'pi pi-shield', title: 'Firewall & Routes', desc: 'NAT, filter, mangle rules and routing table at a glance.' },
  { icon: 'pi pi-code', title: 'Raw Sections', desc: 'Browse and search all decoded supout.rif sections.' },
  { icon: 'pi pi-copy', title: 'Compare / Diff', desc: 'Side-by-side diff two supout.rif files section by section.' },
]

// Layout fills 100vh viewport without body overflow on desktop

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KiB', 'MiB', 'GiB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + units[i]
}

const formatDate = (timestamp: number): string => new Date(timestamp).toLocaleString()

const selectInitialSection = () => {
  const keys = Array.from(sections.value.keys())
  selectedSection.value = keys.find(k => k.toLowerCase() === 'resource') || keys[0] || null
}

const readSupoutFile = (file: File): Promise<Map<string, string>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Unable to read file'))
    reader.onloadend = () => {
      try {
        resolve(decode(reader.result as string))
      } catch (error) {
        reject(error)
      }
    }
    reader.readAsText(file)
  })
}

const onUpload = async (event: FileUploadUploaderEvent) => {
  const file = (event.files as File[])[0]
  uploadedFile.value = {
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
  }
  sections.value = await readSupoutFile(file)
  selectInitialSection()
}

const onCompareUpload = async (event: FileUploadUploaderEvent) => {
  const file = (event.files as File[])[0]
  compareFile.value = {
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
  }
  compareSections.value = await readSupoutFile(file)
}


const clearFile = () => {
  uploadedFile.value = null
  compareFile.value = null
  sections.value = new Map()
  compareSections.value = new Map()
  selectedSection.value = null
}

const clearCompareFile = () => {
  compareFile.value = null
  compareSections.value = new Map()
}

// Mobile sidebar toggle for app-shell
const sidebarOpen = ref(false)
const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value }
</script>

<template>
  <!-- Homepage: full-screen layout -->
  <div v-if="!hasPrimaryFile" class="home-shell">
    <!-- Subtle animated background grid -->
    <div class="home-bg-grid"></div>
    <!-- Floating diagnostic chips -->
    <div class="floating-chips">
      <span class="chip chip-1">resource</span>
      <span class="chip chip-2">interface</span>
      <span class="chip chip-3">log</span>
      <span class="chip chip-4">ip address</span>
      <span class="chip chip-5">system</span>
    </div>

    <div class="home-container">
      <div class="home-sidebar">
        <Card>
          <template #title>File</template>
          <template #content>
            <FileUpload auto customUpload @uploader="onUpload" :multiple="false" accept=".rif">
              <template #header="{ chooseCallback }">
                <Button @click="chooseCallback()" icon="pi pi-plus" rounded outlined />
              </template>
              <template #empty>
                <p>Drag and drop supout.rif here.</p>
              </template>
            </FileUpload>

          </template>
        </Card>
      </div>

      <div class="home-main">
        <div class="welcome-panel">
          <div class="welcome-badge">
            <img src="/made-for-mikrotik.svg" alt="Made for MikroTik" class="welcome-badge-img" />
          </div>
          <h1>MikroTik Supout<br/>RIF Viewer</h1>
          <p class="welcome-description">Upload a supout.rif to unlock diagnostics, dashboards, logs, interfaces, diffing, and export.</p>

          <div class="welcome-actions">
            <a href="https://github.com/hiiruki/MikroTik-Supout-RIF-Viewer" target="_blank" rel="noopener noreferrer" class="action-link">
              <i class="pi pi-github"></i> View on GitHub
            </a>
          </div>

          <div class="features-grid">
            <div v-for="(f, i) in features" :key="i" class="feature-card">
              <div class="feature-icon">
                <i :class="f.icon"></i>
              </div>
              <div class="feature-text">
                <h3>{{ f.title }}</h3>
                <p>{{ f.desc }}</p>
              </div>
            </div>
          </div>

          <p class="welcome-privacy"><i class="pi pi-lock"></i> Your file is decoded locally in the browser. Nothing is uploaded to a server.</p>
        </div>

        <footer class="home-footer">
          <span>&copy; {{ new Date().getFullYear() }} Hiiruki labs. All rights reserved.</span>
        </footer>
      </div>
    </div>
  </div>

  <!-- App view: sidebar + tabbed main content -->
  <div v-else class="app-shell" :class="{ 'sidebar-open': sidebarOpen }">
    <!-- Mobile sidebar toggle button -->
    <button class="sidebar-toggle" @click="toggleSidebar" :aria-label="sidebarOpen ? 'Close sidebar' : 'Open sidebar'">
      <i :class="sidebarOpen ? 'pi pi-times' : 'pi pi-bars'"></i>
    </button>
    <!-- Mobile sidebar overlay -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="toggleSidebar"></div>
    <aside class="sidebar file-sidebar" :class="{ 'is-open': sidebarOpen }">
      <Card>
        <template #title>File</template>
        <template #content>
          <div v-if="uploadedFile" class="file-info">
            <div class="file-info-icon">
              <i class="pi pi-file"></i>
            </div>
            <div class="file-info-details">
              <div class="file-info-name" :title="uploadedFile.name">{{ uploadedFile.name }}</div>
              <div class="file-info-meta"><i class="pi pi-database"></i> {{ formatFileSize(uploadedFile.size) }}</div>
              <div class="file-info-meta"><i class="pi pi-calendar"></i> {{ formatDate(uploadedFile.lastModified) }}</div>
              <div class="file-info-meta"><i class="pi pi-list"></i> {{ sections.size }} sections</div>
            </div>
            <Button
              @click="clearFile"
              icon="pi pi-times"
              severity="danger"
              text
              rounded
              size="small"
              class="file-info-remove"
              title="Remove file"
            />
          </div>

          <ExportButton v-if="hasPrimaryFile" :sections="sections" :file-name="uploadedFile?.name" class="mt-3" />
        </template>
      </Card>
    </aside>

    <main class="main-panel">
      <TabView @tab-change="sidebarOpen = false">
        <TabPanel header="Dashboard">
          <DashboardView :sections="sections" />
        </TabPanel>

        <TabPanel header="Diagnostics">
          <DiagnosticsView :sections="sections" />
        </TabPanel>

        <TabPanel header="Logs">
          <LogViewer :sections="sections" />
        </TabPanel>

        <TabPanel header="Interfaces">
          <InterfaceGrid :sections="sections" />
        </TabPanel>

        <TabPanel header="Firewall &amp; Routes">
          <NetworkView :sections="sections" />
        </TabPanel>

        <TabPanel header="Raw Sections">
          <div class="raw-layout">
            <Card class="sections-card">
              <template #title>Sections</template>
              <template #content>
                <span class="p-input-icon-left section-search">
                  <i class="pi pi-search"></i>
                  <InputText v-model="sectionQuery" placeholder="Search name or content…" />
                </span>
                <p v-if="sectionQuery" class="section-search-hint">
                  {{ selectableSections.length }} of {{ sections.size }} match
                </p>
                <Listbox v-model="selectedSection" :options="selectableSections" class="w-full" />
              </template>
            </Card>
            <Card class="raw-code-card">
              <template #content>
                <highlightjs
                  v-if="!!selectedSection"
                  class="code"
                  language="bash"
                  :code="sections.get(selectedSection || '') || ''"
                />
                <p v-else>No section selected.</p>
              </template>
            </Card>
          </div>
        </TabPanel>

        <TabPanel header="Compare">
          <!-- Compare file upload inline when no compare file loaded -->
          <div v-if="!hasCompareFile" class="compare-upload-panel">
            <div class="compare-upload-inner">
              <i class="pi pi-copy compare-upload-icon"></i>
              <h3>Upload a second supout.rif to compare</h3>
              <p>Select or drag a second supout.rif file to diff configurations side-by-side.</p>
              <FileUpload auto customUpload @uploader="onCompareUpload" :multiple="false" accept=".rif" class="compare-file-upload">
                <template #header="{ chooseCallback }">
                  <Button @click="chooseCallback()" icon="pi pi-plus" label="Add compare file" outlined class="w-full" />
                </template>
                <template #empty>
                  <p>Drag and drop supout.rif here.</p>
                </template>
              </FileUpload>
            </div>
          </div>

          <!-- Diff viewer when compare file is loaded -->
          <div v-else class="compare-diff-panel">
            <div class="compare-file-bar">
              <div class="file-info compare-info">
                <div class="file-info-icon compare"><i class="pi pi-copy"></i></div>
                <div class="file-info-details">
                  <div class="file-info-name" :title="compareFile?.name">{{ compareFile?.name }}</div>
                  <div class="file-info-meta"><i class="pi pi-database"></i> {{ formatFileSize(compareFile?.size || 0) }}</div>
                  <div class="file-info-meta"><i class="pi pi-list"></i> {{ compareSections.size }} sections</div>
                </div>
                <Button @click="clearCompareFile" icon="pi pi-times" severity="danger" text rounded size="small" title="Remove compare file" />
              </div>
            </div>
            <DiffViewer
              :primary-sections="sections"
              :compare-sections="compareSections"
              :primary-name="uploadedFile?.name || 'Primary file'"
              :compare-name="compareFile?.name || 'Compare file'"
            />
          </div>
        </TabPanel>
      </TabView>
    </main>
  </div>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100vh;
  overflow: hidden;
  background: radial-gradient(circle at top left, rgba(165, 214, 52, 0.12), transparent 28%), #121212;
}

body.no-scroll {
  overflow: hidden;
}
</style>

<style scoped>
/* ============ HOMEPAGE LAYOUT ============ */
.home-shell {
  height: 100vh;
  display: flex;
  align-items: stretch;
  overflow: hidden;
  position: relative;
}

/* Subtle animated grid background */
.home-bg-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    linear-gradient(rgba(165, 214, 52, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(165, 214, 52, 0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 70% 60% at 70% 40%, black 20%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 70% 40%, black 20%, transparent 70%);
  animation: gridPulse 6s ease-in-out infinite alternate;
}

@keyframes gridPulse {
  0% { opacity: 0.4; }
  100% { opacity: 0.9; }
}

/* Floating diagnostic chips */
.floating-chips {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.chip {
  position: absolute;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.68rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(165, 214, 52, 0.12);
  background: rgba(165, 214, 52, 0.06);
  color: rgba(165, 214, 52, 0.35);
  animation: chipFloat 18s ease-in-out infinite;
  white-space: nowrap;
}

.chip-1 { top: 12%; right: 8%; animation-delay: 0s; animation-duration: 22s; }
.chip-2 { top: 28%; right: 18%; animation-delay: -4s; animation-duration: 20s; }
.chip-3 { top: 55%; right: 6%; animation-delay: -8s; animation-duration: 24s; }
.chip-4 { top: 72%; right: 22%; animation-delay: -12s; animation-duration: 19s; }
.chip-5 { top: 40%; right: 30%; animation-delay: -6s; animation-duration: 21s; }

@keyframes chipFloat {
  0%, 100% { transform: translateY(0) translateX(0); opacity: 0.5; }
  25% { transform: translateY(-12px) translateX(6px); opacity: 0.8; }
  50% { transform: translateY(6px) translateX(-8px); opacity: 0.4; }
  75% { transform: translateY(-8px) translateX(4px); opacity: 0.7; }
}

.home-container {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: .75rem;
  max-width: 100%;
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: .75rem;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
}

.home-sidebar {
  overflow-y: auto;
  min-height: 0;
}


.home-main {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}

.welcome-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2.5rem 3rem;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 24px;
  background:
    radial-gradient(circle at 30% 15%, rgba(165,214,52,.18), transparent 35%),
    radial-gradient(circle at 85% 80%, rgba(34,211,238,.06), transparent 30%),
    rgba(255,255,255,.035);
  position: relative;
  overflow: hidden;
}

.welcome-badge {
  margin-bottom: 1rem;
}

.welcome-badge-img {
  height: 28px;
  opacity: 0.92;
}

.welcome-panel h1 {
  margin: 0;
  font-size: clamp(2rem, 4.5vw, 3.8rem);
  line-height: 1.02;
  letter-spacing: -.05em;
  font-weight: 800;
  max-width: 750px;
}

.welcome-description {
  margin: 1rem 0 0;
  color: #cfd5c4;
  font-size: 1.1rem;
  line-height: 1.5;
  max-width: 620px;
}

/* ============ ACTION BUTTONS ============ */
.welcome-actions {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-top: 1.75rem;
  flex-wrap: wrap;
}

.action-btn-primary {
  background: linear-gradient(135deg, #a5d634, #8bc022) !important;
  border: none !important;
  color: #111 !important;
  font-weight: 700 !important;
  padding: 0.65rem 1.5rem !important;
  border-radius: 12px !important;
  font-size: 0.92rem !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease !important;
  box-shadow: 0 4px 20px rgba(165, 214, 52, 0.25);
}

.action-btn-primary:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 6px 28px rgba(165, 214, 52, 0.4) !important;
}

.action-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #9ca3af;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.2s ease;
  padding: 0.5rem 0;
}

.action-link:hover {
  color: #e0e0e0;
}

.action-link .pi {
  font-size: 1.1rem;
}

/* ============ FEATURE CARDS ============ */
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-top: 2rem;
}

.feature-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.025);
  transition: border-color 0.3s ease, background 0.3s ease, transform 0.2s ease;
}

.feature-card:hover {
  border-color: rgba(165, 214, 52, 0.25);
  background: rgba(165, 214, 52, 0.04);
  transform: translateY(-2px);
}

.feature-icon {
  flex-shrink: 0;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 10px;
  background: rgba(165, 214, 52, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a5d634;
  font-size: 1rem;
}

.feature-card:nth-child(4) .feature-icon,
.feature-card:nth-child(6) .feature-icon {
  background: rgba(34, 211, 238, 0.1);
  color: #22d3ee;
}

.feature-card:nth-child(2) .feature-icon {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.feature-text h3 {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: #e8e8e8;
}

.feature-text p {
  margin: 0.2rem 0 0;
  font-size: 0.75rem;
  color: #9ca3af;
  line-height: 1.35;
}

/* ============ PRIVACY ============ */
.welcome-privacy {
  margin-top: 2rem;
  color: #6b7280;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.welcome-privacy .pi {
  font-size: 0.78rem;
  color: #a5d634;
  opacity: 0.7;
}

.home-footer {
  padding: 0.75rem 0;
  text-align: center;
  color: #4b5563;
  font-size: 0.74rem;
}

/* ============ APP LAYOUT ============ */
.app-shell {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: .75rem;
  max-width: 100%;
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: .75rem;
  box-sizing: border-box;
  overflow: hidden;
}

.sidebar {
  overflow-y: auto;
  min-height: 0;
  height: 100%;
}

.main-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding-bottom: 0;
}

.main-panel :deep(.p-tabview) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
}

.main-panel :deep(.p-tabview-nav-container) {
  flex-shrink: 0;
}

.main-panel :deep(.p-tabview-panels) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: .75rem 0 0;
  background: transparent;
}

/* Eliminate redundant scrollbars for panel views with their own scroll containers */
.main-panel :deep(.p-tabview-panels:has(.raw-layout)),
.main-panel :deep(.p-tabview-panels:has(.compare-diff-panel)) {
  overflow-y: hidden;
}

.main-panel :deep(.p-tabview-panel) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ============ RAW SECTIONS ============ */
.raw-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: .75rem;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.sections-card,
.raw-code-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.sections-card :deep(.p-card-body),
.raw-code-card :deep(.p-card-body) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 1rem;
  overflow: hidden;
}

.sections-card :deep(.p-card-content) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0;
}

.sections-card :deep(.p-listbox) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  width: 100% !important;
  border: unset;
}

.raw-code-card :deep(.p-card-content) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0;
}

.code {
  white-space: pre-wrap;
  font-size: .8rem;
  padding: unset;
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.code :deep(.hljs) {
  background-color: transparent !important;
  padding: unset;
}

.code :deep(.hljs-comment) {
  font-style: italic !important;
}

.p-listbox {
  width: unset !important;
  border: unset;
}

.p-listbox :deep(.p-listbox-header) {
  padding: unset;
  margin-bottom: .5rem;
}

.p-listbox :deep(.p-listbox-list) {
  padding: unset;
}

.p-listbox :deep(.p-listbox-list .p-listbox-item) {
  padding: 0.5rem 0.5rem;
}

.section-search {
  display: block;
  width: 100%;
  margin-bottom: 0.5rem;
}

.section-search :deep(input) {
  width: 100%;
}

.section-search-hint {
  margin: 0 0 0.5rem;
  font-size: 0.7rem;
  color: #9ca3af;
}

/* ============ FILE INFO ============ */
.file-info {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0.75rem;
  position: relative;
}

.file-info-icon {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 10px;
  background: rgba(165, 214, 52, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #a5d634;
}

.file-info-icon.compare {
  background: rgba(34, 211, 238, 0.14);
  color: #22d3ee;
}

.file-info-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.file-info-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.file-info-meta {
  font-size: 0.72rem;
  color: #9e9e9e;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.file-info-meta .pi {
  font-size: 0.7rem;
  color: #a5d634;
  opacity: 0.8;
}

.file-info-remove {
  flex-shrink: 0;
  margin-top: -0.25rem;
  margin-right: -0.25rem;
}

/* ============ COMPARE TAB ============ */
.compare-upload-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
}

.compare-upload-inner {
  text-align: center;
  max-width: 420px;
  padding: 2rem;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.025);
}

.compare-upload-icon {
  font-size: 2.5rem;
  color: #22d3ee;
  margin-bottom: 1rem;
}

.compare-upload-inner h3 {
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
  font-weight: 700;
}

.compare-upload-inner p {
  margin: 0 0 1.5rem;
  color: #9ca3af;
  font-size: 0.9rem;
}

.compare-file-bar {
  margin-bottom: 1rem;
  max-width: 400px;
}

.compare-diff-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

/* ============ TABVIEW ============ */
:deep(.p-tabview-nav) {
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255,255,255,.035);
}

:deep(.p-tabview-panels) {
  padding: .75rem 0 0;
  background: transparent;
}

/* ============ FILE UPLOAD ============ */
.p-fileupload :deep(.p-message) {
  border-radius: 10px;
}
.p-fileupload :deep(.p-message-wrapper) {
  display: flex;
  align-items: flex-start;
  gap: .5rem;
}
.p-fileupload :deep(.p-message-text) {
  overflow-wrap: anywhere;
}
.p-fileupload :deep(.p-message-close) {
  width: 1.6rem;
  height: 1.6rem;
  flex-shrink: 0;
}

/* ============ RESPONSIVE ============ */
@media (max-width: 1100px) {
  /* Homepage: stack sidebar below main on mobile — show main first via order */
  .home-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    overflow-y: auto;
    height: auto;
    min-height: 100vh;
    padding: 1rem;
  }
  .home-main { order: -1; }
  .home-sidebar { order: 0; overflow-y: visible; }
  .home-shell { height: auto; min-height: 100vh; overflow: visible; }
  body.no-scroll { overflow: auto; }
  html, body { overflow-y: auto; }

  /* App shell: hide sidebar off-screen on mobile, show via toggle */
  .app-shell {
    display: block;
    height: auto;
    min-height: 100vh;
    padding: 0;
    position: relative;
  }

  .sidebar-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    bottom: 1.25rem;
    right: 1.25rem;
    z-index: 200;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    border: 1px solid rgba(165, 214, 52, 0.35);
    background: linear-gradient(135deg, rgba(165, 214, 52, 0.18), rgba(255,255,255,0.06));
    backdrop-filter: blur(12px);
    color: #a5d634;
    font-size: 1.1rem;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    transition: background 0.2s ease, transform 0.2s ease;
  }

  .sidebar-toggle:hover {
    background: linear-gradient(135deg, rgba(165, 214, 52, 0.3), rgba(255,255,255,0.1));
    transform: scale(1.05);
  }

  .sidebar-overlay {
    position: fixed;
    inset: 0;
    z-index: 150;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(2px);
  }

  .file-sidebar {
    position: fixed;
    top: 0;
    right: -100%;
    width: min(320px, 90vw);
    height: 100dvh;
    overflow-y: auto;
    z-index: 160;
    padding: 1rem;
    background: #161818;
    border-left: 1px solid rgba(255,255,255,0.08);
    transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: -8px 0 40px rgba(0,0,0,0.5);
  }

  .file-sidebar.is-open {
    right: 0;
  }

  .main-panel {
    padding: .75rem;
    padding-bottom: 5rem; /* space above FAB */
  }

  .raw-layout { grid-template-columns: 1fr; }
  .features-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .features-grid { grid-template-columns: 1fr; }
  .welcome-panel { padding: 1.25rem 1rem; }
  .welcome-actions { flex-direction: column; align-items: stretch; }
  .action-btn-primary { text-align: center; justify-content: center; }
  .home-container { padding: .75rem; gap: .75rem; }

  /* Tabs: allow horizontal scroll for narrow screens */
  :deep(.p-tabview-nav) {
    overflow-x: auto;
    overflow-y: hidden;
    flex-wrap: nowrap;
    border-radius: 12px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  :deep(.p-tabview-nav)::-webkit-scrollbar { display: none; }
  :deep(.p-tabview-nav-link) { white-space: nowrap; }

  /* Raw sections: limit section list height */
  .raw-layout {
    grid-template-columns: 1fr;
    gap: .75rem;
  }
  .sections-card :deep(.p-listbox) {
    max-height: 200px;
    overflow-y: auto;
  }

  .compare-upload-inner { padding: 1.25rem; }
  .compare-file-bar { max-width: 100%; }
}

/* Hide sidebar toggle on desktop */
.sidebar-toggle { display: none; }
.sidebar-overlay { display: none; }
</style>
