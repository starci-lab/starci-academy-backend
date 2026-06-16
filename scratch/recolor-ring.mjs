// Recolor ONLY the gold/amber ring of the chameleon badge to green, pixel-precise,
// leaving the chameleon + green inner background + icons untouched. This is the kind
// of targeted edit diffusion models can't do reliably — plain HSV math nails it.
import { createRequire } from "node:module"
import { homedir } from "node:os"
import { join } from "node:path"

const require = createRequire(import.meta.url)
const sharp = require("C:/Repositories/starci-academy/node_modules/sharp")

const SRC = join(homedir(), "Downloads", "Gemini_Generated_Image_gahcu3gahcu3gahc.png")
const OUT = join(process.cwd(), "scratch", "badges-trimmed", "bug-hunter-green-ring.png")

// rgb -> hsv (h in [0,360), s/v in [0,1])
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

// hsv -> rgb
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

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const ch = info.channels // 4 (RGBA)

let touched = 0
for (let i = 0; i < data.length; i += ch) {
    const a = data[i + 3]
    if (a === 0) continue // skip transparent
    const [h, s, v] = rgbToHsv(data[i], data[i + 1], data[i + 2])
    // gold/amber ring: yellow-orange hue, reasonably saturated & bright.
    // narrow band avoids the chameleon's lime body (h>70) and orange spots (h<35).
    if (h >= 38 && h <= 62 && s >= 0.35 && v >= 0.35) {
        // map gold -> green: shift hue to ~135°, keep its shading (s, v) so the
        // bevel/highlight of the metal ring is preserved
        const [nr, ng, nb] = hsvToRgb(135, s, v)
        data[i] = nr; data[i + 1] = ng; data[i + 2] = nb
        touched++
    }
}

await sharp(data, { raw: { width: info.width, height: info.height, channels: ch } })
    .png()
    .toFile(OUT)

console.log(`recolored ${touched} px -> ${OUT}`)
