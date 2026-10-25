// Sec-MS-GEC v2 is "<CS64 checksum>-<SHA-256>" of Edge's copyright line followed by the v1 input.
// Worked out from the analysis in https://github.com/rany2/edge-tts/pull/492.
const EDGE_COPYRIGHT = "Copyright (C) Microsoft Corporation. All rights reserved."

// CS64 multipliers from Edge, for the first and the second word of each pair of message words.
type SwapMultipliers = {swappedWord: number, swappedSum: number, swappedProduct: number}
const SWAP_FIRST_WORD: SwapMultipliers = {swappedWord: 0xEF0569FB, swappedSum: 0x76F50F34, swappedProduct: 0xC3EFEA97}
const SWAP_SECOND_WORD: SwapMultipliers = {swappedWord: 0xC31713DB, swappedSum: 0x1881CE3C, swappedProduct: 0x35BD1EC9}
const MIX_FIRST_WORD = [0xCF98B111, 0x87085B9F, 0x12CEB96D, 0x257E1D83]
const MIX_SECOND_WORD = [0xA27416F5, 0xD38396FF, 0x7C932B89, 0xBFA49F69]

export async function hashSecMsGecV2(ticksAndToken: string): Promise<string> {
    const message = new TextEncoder().encode(EDGE_COPYRIGHT + ticksAndToken)
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", message))
    return `${toUpperHex(cs64(message, digest))}-${toUpperHex(digest)}`
}

function cs64(message: Uint8Array, digest: Uint8Array): Uint8Array {
    const digestView = new DataView(digest.buffer, digest.byteOffset, digest.byteLength)
    const firstKey = (digestView.getUint32(0, true) | 1) >>> 0
    const secondKey = (digestView.getUint32(4, true) | 1) >>> 0

    // The message is read as little-endian 32-bit word pairs, zero-padded to a whole pair.
    const padded = new Uint8Array(Math.ceil(message.length / 8) * 8)
    padded.set(message)
    const words = new DataView(padded.buffer)

    let swapSum = 0
    let lastSwap = 0
    let mix = 0
    let mixSum = 0
    for (let offset = 0; offset < padded.length; offset += 8) {
        const firstWord = words.getUint32(offset, true)
        const secondWord = words.getUint32(offset + 4, true)

        const firstSwap = swapTerm(firstWord, firstKey, SWAP_FIRST_WORD)
        lastSwap = swapTerm(secondWord, secondKey, SWAP_SECOND_WORD)
        swapSum = (swapSum + firstSwap + lastSwap) >>> 0

        mix = swapAndMultiply(Math.imul(mix + firstWord, firstKey), MIX_FIRST_WORD)
        mixSum = (mixSum + mix) >>> 0
        mix = swapAndMultiply(Math.imul(mix + secondWord, secondKey), MIX_SECOND_WORD)
        mixSum = (mixSum + mix) >>> 0
    }

    const checksum = new Uint8Array(8)
    const checksumView = new DataView(checksum.buffer)
    checksumView.setUint32(0, lastSwap ^ mix, true)
    checksumView.setUint32(4, swapSum ^ mixSum, true)
    return checksum
}

function swapTerm(word: number, key: number, multipliers: SwapMultipliers): number {
    const sum = Math.imul(word, key) + Math.imul(swapHalves(word), multipliers.swappedWord)
    const product = Math.imul(swapHalves(sum), multipliers.swappedSum) >>> 0
    return (Math.imul(swapHalves(product), multipliers.swappedProduct) + product) >>> 0
}

function swapAndMultiply(value: number, multipliers: number[]): number {
    for (const multiplier of multipliers) {
        value = Math.imul(swapHalves(value), multiplier) >>> 0
    }
    return value
}

function swapHalves(value: number): number {
    return ((value << 16) | (value >>> 16)) >>> 0
}

function toUpperHex(bytes: Uint8Array): string {
    return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("").toUpperCase()
}
