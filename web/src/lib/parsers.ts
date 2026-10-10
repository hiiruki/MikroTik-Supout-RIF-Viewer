// parsers.ts — Pure functions that extract typed structured data from raw decoded supout.rif sections
// All user data from the file is treated as untrusted text; no innerHTML or eval is used.

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface ResourceInfo {
  uptime: string
  version: string
  buildTime: string
  factorySoftware: string
  freeMemory: string
  totalMemory: string
  freeMemoryBytes: number
  totalMemoryBytes: number
  cpu: string
  cpuCount: string
  cpuFrequency: string
  cpuLoad: number
  freeHdd: string
  totalHdd: string
  freeHddBytes: number
  totalHddBytes: number
  writeSectSinceReboot: string
  writeSectTotal: string
  architecture: string
  boardName: string
  platform: string
  clockTime: string
  clockDate: string
  timezone: string
  gmtOffset: string
}

export interface RouterboardInfo {
  model: string
  revision: string
  serialNumber: string
  firmwareType: string
  factoryFirmware: string
  currentFirmware: string
  upgradeFirmware: string
  boardName: string
}

export interface LicenseInfo {
  softwareId: string
  level: string
  features: string
}

export interface InterfaceEntry {
  index: number
  flags: string
  name: string
  type: string
  mtu: number
  mac: string
  running: boolean
  slave: boolean
  rxBytes: number
  txBytes: number
  linkDowns: number
  ipAddresses: string[]
}

export interface AddressEntry {
  address: string
  network: string
  iface: string
  vrf: string
}

export interface LogEntry {
  timestamp: string
  topics: string[]
  message: string
}

export interface FirewallRule {
  chain: string
  action: string
  attrs: Record<string, string>
  disabled: boolean
}

export interface FirewallData {
  nat: FirewallRule[]
  filter: FirewallRule[]
  mangle: FirewallRule[]
  raw: FirewallRule[]
}

export interface RouteEntry {
  flags: string
  dst: string
  gateway: string
  table: string
  distance: number
  active: boolean
  dynamic: boolean
  connect: boolean
}

export type DiagnosticSeverity = 'critical' | 'warning' | 'info' | 'ok'

export interface DiagnosticItem {
  severity: DiagnosticSeverity
  title: string
  detail: string
  section: string
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Extract a key:value pair from a block of text, returns empty string if not found. */
const kv = (text: string, key: string): string => {
  const re = new RegExp(`^\\s*${key}\\s*:\\s*(.+)$`, 'm')
  const m = text.match(re)
  return m ? m[1].trim() : ''
}

/** Parse a memory/size string like "8.3MiB", "32.0MiB", "7.2MiB" into bytes */
export const parseSizeToBytes = (s: string): number => {
  if (!s) return 0
  const m = s.match(/^([\d.]+)\s*(B|KiB|MiB|GiB|KB|MB|GB)/i)
  if (!m) return 0
  const val = parseFloat(m[1])
  const unit = m[2].toLowerCase()
  if (unit === 'b') return val
  if (unit === 'kib' || unit === 'kb') return val * 1024
  if (unit === 'mib' || unit === 'mb') return val * 1024 * 1024
  if (unit === 'gib' || unit === 'gb') return val * 1024 * 1024 * 1024
  return val
}

// ──────────────────────────────────────────────────────────────────────────────
// Resource Parser
// ──────────────────────────────────────────────────────────────────────────────

export const parseResource = (text: string): ResourceInfo => {
  const cpuLoadStr = kv(text, 'cpu-load')
  const cpuLoad = parseInt(cpuLoadStr) || 0

  const freeMemory = kv(text, 'free-memory')
  const totalMemory = kv(text, 'total-memory')
  const freeHdd = kv(text, 'free-hdd-space')
  const totalHdd = kv(text, 'total-hdd-space')

  return {
    uptime: kv(text, 'uptime'),
    version: kv(text, 'version'),
    buildTime: kv(text, 'build-time'),
    factorySoftware: kv(text, 'factory-software'),
    freeMemory,
    totalMemory,
    freeMemoryBytes: parseSizeToBytes(freeMemory),
    totalMemoryBytes: parseSizeToBytes(totalMemory),
    cpu: kv(text, 'cpu'),
    cpuCount: kv(text, 'cpu-count'),
    cpuFrequency: kv(text, 'cpu-frequency'),
    cpuLoad,
    freeHdd,
    totalHdd,
    freeHddBytes: parseSizeToBytes(freeHdd),
    totalHddBytes: parseSizeToBytes(totalHdd),
    writeSectSinceReboot: kv(text, 'write-sect-since-reboot'),
    writeSectTotal: kv(text, 'write-sect-total'),
    architecture: kv(text, 'architecture-name'),
    boardName: kv(text, 'board-name'),
    platform: kv(text, 'platform'),
    clockTime: kv(text, 'time'),
    clockDate: kv(text, 'date'),
    timezone: kv(text, 'time-zone-name'),
    gmtOffset: kv(text, 'gmt-offset'),
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Routerboard Parser
// ──────────────────────────────────────────────────────────────────────────────

export const parseRouterboard = (text: string): RouterboardInfo => ({
  boardName: kv(text, 'board-name'),
  model: kv(text, 'model'),
  revision: kv(text, 'revision'),
  serialNumber: kv(text, 'serial-number'),
  firmwareType: kv(text, 'firmware-type'),
  factoryFirmware: kv(text, 'factory-firmware'),
  currentFirmware: kv(text, 'current-firmware'),
  upgradeFirmware: kv(text, 'upgrade-firmware'),
})

// ──────────────────────────────────────────────────────────────────────────────
// License Parser
// ──────────────────────────────────────────────────────────────────────────────

export const parseLicense = (text: string): LicenseInfo => ({
  softwareId: kv(text, 'software-id'),
  level: kv(text, 'nlevel'),
  features: kv(text, 'features'),
})

// ──────────────────────────────────────────────────────────────────────────────
// Interface Parser
// ──────────────────────────────────────────────────────────────────────────────

export const parseInterfaces = (text: string): InterfaceEntry[] => {
  const interfaces: InterfaceEntry[] = []
  const lines = text.split('\n')

  // Parse the first table (type, mtu, mac). Pattern: "0  S ether1       ether           1500   1598       2028  F4:1E:57:4E:1F:A0"
  const ifaceLineRe = /^\s*(\d+)\s+([RSDXIP]*)\s+(\S+)\s+(\S+)\s+(\d+)(?:\s+\d+)?(?:\s+\d+)?\s+((?:[0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2})/
  for (const line of lines) {
    const m = line.match(ifaceLineRe)
    if (m) {
      const flags = m[2]
      interfaces.push({
        index: parseInt(m[1]),
        flags,
        name: m[3],
        type: m[4],
        mtu: parseInt(m[5]),
        mac: m[6],
        running: flags.includes('R'),
        slave: flags.includes('S'),
        rxBytes: 0,
        txBytes: 0,
        linkDowns: 0,
        ipAddresses: [],
      })
    }
  }

  // Parse traffic stats table: "1 RS ether2       8 594 732  25 465 040   ..."
  // Bytes are formatted with spaces: "8 594 732" → remove spaces then parse
  const statsLineRe = /^\s*(\d+)\s+[RSDXIP]*\s+(\S+)\s+([\d\s]+?)\s+([\d\s]+?)\s+\d/
  for (const line of lines) {
    const m = line.match(statsLineRe)
    if (m) {
      const name = m[2]
      const entry = interfaces.find(i => i.name === name)
      if (entry) {
        entry.rxBytes = parseInt(m[3].replace(/\s/g, '')) || 0
        entry.txBytes = parseInt(m[4].replace(/\s/g, '')) || 0
      }
    }
  }

  // Parse link-downs from the extended listing
  const linkDownsRe = /name="([^"]+)".*?link-downs=(\d+)/g
  let ldm: RegExpExecArray | null
  while ((ldm = linkDownsRe.exec(text)) !== null) {
    const entry = interfaces.find(i => i.name === ldm![1])
    if (entry) entry.linkDowns = parseInt(ldm[2]) || 0
  }

  return interfaces
}

// ──────────────────────────────────────────────────────────────────────────────
// Address Parser
// ──────────────────────────────────────────────────────────────────────────────

export const parseAddresses = (text: string): AddressEntry[] => {
  const addresses: AddressEntry[] = []
  // Pattern: "0 192.168.1.1/24   192.168.1.0   bridge-LAN   main"
  const addrLineRe = /^\s*\d+\s+([\d.]+\/\d+)\s+([\d.]+)\s+(\S+)\s+(\S+)/
  for (const line of text.split('\n')) {
    const m = line.match(addrLineRe)
    if (m) {
      addresses.push({ address: m[1], network: m[2], iface: m[3], vrf: m[4] })
    }
  }
  return addresses
}

// ──────────────────────────────────────────────────────────────────────────────
// Log Parser
// ──────────────────────────────────────────────────────────────────────────────

export const parseLogs = (text: string): LogEntry[] => {
  const logs: LogEntry[] = []
  // Pattern: "Apr/20/2026 14:02:33 system,info          installed tr069-client-7.21.4"
  const logLineRe = /^(\w+\/\d+\/\d+\s+[\d:]+)\s+([\w,]+)\s{2,}(.+)$/
  for (const line of text.split('\n')) {
    const m = line.match(logLineRe)
    if (m) {
      logs.push({
        timestamp: m[1].trim(),
        topics: m[2].split(',').map(t => t.trim()),
        message: m[3].trim(),
      })
    }
  }
  return logs
}

// ──────────────────────────────────────────────────────────────────────────────
// Firewall Parser
// ──────────────────────────────────────────────────────────────────────────────

const parseFirewallSubsection = (text: string): FirewallRule[] => {
  const rules: FirewallRule[] = []
  // Rule lines look like: " 0 X  chain=srcnat action=masquerade out-interface=bridge-WAN log=no log-prefix=""
  // Continuation lines are indented and belong to the previous rule.
  const lines = text.split('\n')
  let current: string | null = null
  const flush = () => {
    if (!current) return
    const disabled = /^\s*\d+\s+[A-Za-z]*X/.test(current)
    const attrs: Record<string, string> = {}
    const attrRe = /(\S+?)=("[^"]*"|\S+)/g
    let m: RegExpExecArray | null
    while ((m = attrRe.exec(current)) !== null) {
      attrs[m[1]] = m[2].replace(/^"|"$/g, '')
    }
    if (attrs.chain || attrs.action) {
      rules.push({
        chain: attrs.chain || '',
        action: attrs.action || '',
        attrs,
        disabled,
      })
    }
    current = null
  }
  for (const line of lines) {
    if (/^\s*\d+\s/.test(line)) {
      flush()
      current = line
    } else if (current && /^\s+\S/.test(line)) {
      current += ' ' + line.trim()
    } else {
      flush()
    }
  }
  flush()
  return rules
}

export const parseFirewall = (text: string): FirewallData => {
  const empty: FirewallData = { nat: [], filter: [], mangle: [], raw: [] }
  if (!text) return empty
  // Split by top-level section headers (uppercase word alone on a line).
  const sections: Record<string, string> = {}
  const headerRe = /^([A-Z][A-Z-]+)\s*$/
  const lines = text.split('\n')
  let key = ''
  let buf: string[] = []
  for (const line of lines) {
    const m = line.match(headerRe)
    if (m) {
      if (key) sections[key] = buf.join('\n')
      key = m[1]
      buf = []
    } else {
      buf.push(line)
    }
  }
  if (key) sections[key] = buf.join('\n')
  return {
    nat: parseFirewallSubsection(sections['NAT'] || ''),
    filter: parseFirewallSubsection(sections['FILTER'] || ''),
    mangle: parseFirewallSubsection(sections['MANGLE'] || ''),
    raw: parseFirewallSubsection(sections['RAW'] || ''),
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Routing Parser
// ──────────────────────────────────────────────────────────────────────────────

export const parseRoutes = (text: string): RouteEntry[] => {
  const routes: RouteEntry[] = []
  if (!text) return routes
  // Compact table before the ROUTE section:
  // "DAc 192.168.1.0/24   bridge-LAN   main                  0"
  const routeRe = /^([A-Za-z ]{3,6})\s+(\S+\/\d+)\s+(\S+)\s+(\S+)\s+(\d+)/
  for (const line of text.split('\n')) {
    const m = line.match(routeRe)
    if (m) {
      const flags = m[1].trim()
      routes.push({
        flags,
        dst: m[2],
        gateway: m[3],
        table: m[4],
        distance: parseInt(m[5]) || 0,
        active: flags.includes('A'),
        dynamic: flags.includes('D'),
        connect: flags.includes('c'),
      })
    }
  }
  return routes
}

// ──────────────────────────────────────────────────────────────────────────────
// Diagnostics Engine
// ──────────────────────────────────────────────────────────────────────────────

export const runDiagnostics = (sections: Map<string, string>): DiagnosticItem[] => {
  const results: DiagnosticItem[] = []
  const get = (name: string) => sections.get(name) || ''

  const resourceText = get('resource')
  const resource = resourceText ? parseResource(resourceText) : null

  // CPU Load
  if (resource) {
    if (resource.cpuLoad >= 90) {
      results.push({
        severity: 'critical',
        title: `High CPU Load: ${resource.cpuLoad}%`,
        detail: `CPU utilization is at ${resource.cpuLoad}%, which may indicate a process overload or denial-of-service.`,
        section: 'resource',
      })
    }

    // Memory
    if (resource.totalMemoryBytes > 0) {
      const memUsedPct = Math.round(((resource.totalMemoryBytes - resource.freeMemoryBytes) / resource.totalMemoryBytes) * 100)
      if (memUsedPct >= 90) {
        results.push({
          severity: 'critical',
          title: `Critical Memory Usage: ${memUsedPct}% used`,
          detail: `Only ${resource.freeMemory} of ${resource.totalMemory} free. The router may be running out of RAM.`,
          section: 'resource',
        })
      } else if (memUsedPct >= 75) {
        results.push({
          severity: 'warning',
          title: `High Memory Usage: ${memUsedPct}% used`,
          detail: `${resource.freeMemory} of ${resource.totalMemory} remaining. Consider reviewing active processes.`,
          section: 'resource',
        })
      }
    }

    // Disk
    if (resource.totalHddBytes > 0) {
      const diskUsedPct = Math.round(((resource.totalHddBytes - resource.freeHddBytes) / resource.totalHddBytes) * 100)
      if (diskUsedPct >= 90) {
        results.push({
          severity: 'critical',
          title: `Critical Disk Usage: ${diskUsedPct}% used`,
          detail: `Only ${resource.freeHdd} of ${resource.totalHdd} remaining on the flash storage.`,
          section: 'resource',
        })
      } else if (diskUsedPct >= 75) {
        results.push({
          severity: 'warning',
          title: `High Disk Usage: ${diskUsedPct}% used`,
          detail: `${resource.freeHdd} of ${resource.totalHdd} free.`,
          section: 'resource',
        })
      }
    }
  }

  // Kernel crash check
  const oopsText = get('oops').trim()
  const backtraceText = get('backtrace').trim()
  if (oopsText) {
    results.push({ severity: 'critical', title: 'Kernel Oops Detected', detail: 'The oops section contains crash data, indicating a kernel-level fault occurred.', section: 'oops' })
  }
  if (backtraceText) {
    results.push({ severity: 'critical', title: 'Kernel Backtrace Detected', detail: 'The backtrace section contains crash stack trace data.', section: 'backtrace' })
  }

  // Watchdog reboot check
  const logText = get('log')
  if (logText) {
    const logs = parseLogs(logText)
    const watchdogReboot = logs.find(l => l.message.toLowerCase().includes('watchdog'))
    if (watchdogReboot) {
      results.push({ severity: 'critical', title: 'Watchdog Reboot Detected', detail: `Log entry: "${watchdogReboot.message}" — the router was rebooted by the watchdog timer, indicating a possible crash or hang.`, section: 'log' })
    }
    const powerReboot = logs.find(l => l.message.toLowerCase().includes('power') && l.message.toLowerCase().includes('reboot'))
    if (powerReboot) {
      results.push({ severity: 'warning', title: 'Power-Related Reboot Detected', detail: `Log entry: "${powerReboot.message}"`, section: 'log' })
    }
  }

  // Interface link-downs
  const ifaceText = get('interface')
  if (ifaceText) {
    const ifaces = parseInterfaces(ifaceText)
    const withLinkDowns = ifaces.filter(i => i.linkDowns > 0 && i.type === 'ether')
    for (const iface of withLinkDowns) {
      results.push({
        severity: 'warning',
        title: `Link Down(s) on ${iface.name}`,
        detail: `Interface ${iface.name} experienced ${iface.linkDowns} link-down event(s) since last reboot.`,
        section: 'interface',
      })
    }
  }

  // Firmware update available
  const rbText = get('routerboard')
  if (rbText) {
    const rb = parseRouterboard(rbText)
    if (rb.currentFirmware && rb.upgradeFirmware && rb.currentFirmware !== rb.upgradeFirmware) {
      results.push({
        severity: 'info',
        title: 'RouterBOARD Firmware Update Available',
        detail: `Current firmware: ${rb.currentFirmware}. Upgrade available: ${rb.upgradeFirmware}. Run /system routerboard upgrade to apply.`,
        section: 'routerboard',
      })
    }
  }

  // All clear
  if (results.length === 0) {
    results.push({ severity: 'ok', title: 'No Issues Detected', detail: 'All diagnostic checks passed. The router appears to be healthy.', section: '' })
  }

  return results
}
