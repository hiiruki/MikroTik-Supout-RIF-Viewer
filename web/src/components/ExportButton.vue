<script setup lang="ts">
import Button from 'primevue/button'
import JSZip from 'jszip'

const props = defineProps<{
  sections: Map<string, string>
  fileName?: string
}>()

const safeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_')

const exportZip = async () => {
  const zip = new JSZip()
  const folder = zip.folder('supout_sections')
  if (!folder) return

  for (const [name, content] of props.sections.entries()) {
    folder.file(`${safeFileName(name)}.txt`, content)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const baseName = props.fileName ? props.fileName.replace(/\.rif$/i, '') : 'supout'
  link.download = `${safeFileName(baseName)}_sections.zip`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <Button
    icon="pi pi-download"
    label="Export ZIP"
    severity="success"
    outlined
    class="w-full"
    :disabled="sections.size === 0"
    @click="exportZip"
  />
</template>
