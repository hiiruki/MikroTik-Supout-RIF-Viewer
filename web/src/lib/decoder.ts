import {inflate} from 'pako'

type Section = {
    name: string
    content: string
}

export const decode = (data: string): Map<string, string> => {
    const rawSections = splitSections(data)
    return decodeSections(rawSections)
}

const decodeSections = (rawSections: string[]): Map<string, string> => {
    const decodedSections: Map<string, string> = new Map()
    rawSections.forEach((section) => {
        const decodedSection = decodeSection(section)
        if (decodedSections.has(decodedSection.name)) {
            console.log(`Found duplicate section: ${decodedSection.name}`)
        }
        decodedSections.set(decodedSection.name, decodedSection.content)
    })

    return decodedSections
}

const decodeSection = (rawSection: string): Section => {
    const dSection = customB64Decode(rawSection)
    const splitIndex = dSection.indexOf(0)

    const textDecoder = new TextDecoder()

    const name = textDecoder.decode(dSection.subarray(0, splitIndex))

    const zContent = dSection.subarray(splitIndex + 1)
    const content = inflate(zContent)
    const contentTxt = textDecoder.decode(content).replaceAll('\r', '')

    return {
        name: name,
        content: contentTxt,
    }
}

const customB64Decode = (section: string): Uint8Array => {
    const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
    let out = []

    for (let i = 0; i < section.length; i += 4) {
        let packet = section.substring(i, i + 4)
        let o = (b64.indexOf(packet[3]) % 64) << 18 |
            (b64.indexOf(packet[2]) % 64) << 12 |
            (b64.indexOf(packet[1]) % 64) << 6 |
            (b64.indexOf(packet[0]) % 64);

        out.push(o % 256, (o >> 8) % 256, (o >> 16) % 256)
    }

    return new Uint8Array(out)
}

const splitSections = (data: string): string[] => {
    const sections: string[] = []
    let section = ''
    let inSection = false
    data.replaceAll('\r', '').split('\n').forEach((line, i) => {
        if (line === '--BEGIN ROUTEROS SUPOUT SECTION') {
            if (inSection) {
                throw new Error(`Unexpected section start marker within a section on line ${i}`)
            }
            inSection = true
            return
        }
        if (line === '--END ROUTEROS SUPOUT SECTION') {
            sections.push(section.trim())
            section = ''
            inSection = false
            return
        }
        section += line.trim()
    })

    if (inSection) {
        throw new Error('Last section is missing end marker')
    }

    return sections
}