// ai-whisperer octopus badge: recolor the gold ring -> cyan, and strip the soft
// outer aura/glow by clearing everything beyond the ring's outer radius. The
// octopus + inner background are left pixel-untouched (only gold pixels change).
import { createRequire } from "node:module"
import { homedir } from "node:os"
import { join } from "node:path"

const require = createRequire(import.meta.url)
const sharp = require("C:/Repositories/starci-academy/node_modules/sharp")

const SRC = join(homedir(), "Downloads", "Gemini_Generated_Image_c9sm00c9sm00c9sm.png")
const OUT = join(process.cwd(), "scratch", "badges-trimmed", "ai-whisperer-cyan-ring.png")

const rgbToHsv = (r, g, b) => {
    r /= 255; g /= 255; b /= 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    const d = max - min
    let h = 0
    if (d !== 0) {
        if (max === r) h = ((g - b) / d) % 6
        else if (max === g) h = (b - r) / d + 2
        else h = (r - g) / d + 4
        h *= 60
        if (h < 0) h += 360
    }
    return [h, max === 0 ? 0 : d / max, max]
}
const hsvToRgb = (h, s, v) => {
    const c = v * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = v - c
    let r = 0, g = 0, b = 0
    if (h < 60) [r, g, b] = [c, x, 0]
    else if (h < 120) [r, g, b] = [x, c, 0]
    else if (h < 180) [r, g, b] = [0, c, x]
    else if (h < 240) [r, g, b] = [0, x, c]
    else if (h < 300) [r, g, b] = [x, 0, c]
    else [r, g, b] = [c, 0, x]
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}
const isGold = (h, s, v) => h >= 38 && h <= 62 && s >= 0.35 && v >= 0.35

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: W, height: H, channels: ch } = info
const cx = W / 2, cy = H / 2

// pass 1: find the ring's outer radius = farthest gold pixel from center
let ringR = 0
for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
        const i = (y * W + x) * ch
        if (data[i + 3] === 0) continue
        const [h, s, v] = rgbToHsv(data[i], data[i + 1], data[i + 2])
        if (isGold(h, s, v)) {
            const d = Math.hypot(x - cx, y - cy)
            if (d > ringR) ringR = d
        }
    }
}
const cutoff = ringR + 3 // small margin keeps the ring's anti-aliased outer edge

// pass 2: recolor gold->cyan, clear anything beyond the ring (the aura)
let recolored = 0, cleared = 0
for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
        const i = (y * W + x) * ch
        if (data[i + 3] === 0) continue
        if (Math.hypot(x - cx, y - cy) > cutoff) {
            data[i + 3] = 0 // strip outer aura/glow
            cleared++
            continue
        }
        const [h, s, v] = rgbToHsv(data[i], data[i + 1], data[i + 2])
        if (isGold(h, s, v)) {
            const [nr, ng, nb] = hsvToRgb(182, Math.max(s, 0.45), v) // teal/cyan, keep bevel
            data[i] = nr; data[i + 1] = ng; data[i + 2] = nb
            recolored++
        }
    }
}

// trim transparent border + square to 512 so it's upload-ready
await sharp(data, { raw: { width: W, height: H, channels: ch } })
    .trim()
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(OUT)

console.log(`ring radius=${ringR.toFixed(0)}px  recolored=${recolored}px  aura-cleared=${cleared}px`)
console.log(`-> ${OUT}`)
