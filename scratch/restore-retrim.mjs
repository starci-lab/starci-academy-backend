// Rebuild badges from the original Gemini art as CLEAN circles:
//  1. find the ring via its dark outer outline (alpha>=128 & dark luma)
//  2. radial-mask everything beyond the ring radius -> fully transparent outside
//     (drops the opaque glow that bleeds into the corners)
//  3. crop to the centered ring square, resize to SIZE
import { createRequire } from "node:module"
import { writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const require = createRequire(import.meta.url)
const sharp = require("C:/Repositories/starci-academy/node_modules/sharp")

const DL = join(homedir(), "Downloads")
const OUT_DIR = "C:/Repositories/ac/starci-academy-backend/.gitrefs/data/assets/badges/achievements"
const ALPHA = 128   // opaque pixels only
const DARK = 90     // the ring's outer outline is dark; glow/sparks are bright
const MARGIN = 4    // keep the ring's anti-aliased outer edge
const SIZE = 128

const SRC = {
    "first-steps": "Gemini_Generated_Image_1jsw0f1jsw0f1jsw.png",
    "on-fire": "Gemini_Generated_Image_x5ifm6x5ifm6x5if.png",
    "challenger": "Gemini_Generated_Image_8clg6c8clg6c8clg.png",
    "milestone-master": "Gemini_Generated_Image_w1sx1yw1sx1yw1sx.png",
    "polyglot": "Gemini_Generated_Image_ltmcd1ltmcd1ltmc.png",
    "bug-hunter": "Gemini_Generated_Image_osvw7uosvw7uosvw.png",
    "ai-whisperer": "Gemini_Generated_Image_mdfxipmdfxipmdfx.png",
    "mentor": "Gemini_Generated_Image_rhxjxqrhxjxqrhxj.png",
    "hive": "Gemini_Generated_Image_1j2ma1j2ma1j2ma1.png",
    "apex": "Gemini_Generated_Image_6uzzc76uzzc76uzz.png",
}

for (const [slug, file] of Object.entries(SRC)) {
    const src = join(DL, file)
    const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const { width: W, height: H, channels: ch } = info

    // ring outer edge from the dark, opaque outline
    let minX = W, minY = H, maxX = -1, maxY = -1
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const i = (y * W + x) * ch
            if (data[i + 3] < ALPHA) continue
            const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
            if (luma < DARK) {
                if (x < minX) minX = x; if (x > maxX) maxX = x
                if (y < minY) minY = y; if (y > maxY) maxY = y
            }
        }
    }
    // horizontal span is the reliable diameter; badge is centered
    const side = Math.max(maxX - minX + 1, maxY - minY + 1)
    const cx = W / 2, cy = H / 2
    const radius = side / 2 + MARGIN

    // radial mask: clear everything outside the ring -> transparent corners
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (Math.hypot(x - cx, y - cy) > radius) {
                data[(y * W + x) * ch + 3] = 0
            }
        }
    }

    // centered square crop to the ring, then resize
    const left = Math.max(0, Math.round(cx - side / 2))
    const top = Math.max(0, Math.round(cy - side / 2))
    const w = Math.min(side, W - left)
    const h = Math.min(side, H - top)
    const out = await sharp(data, { raw: { width: W, height: H, channels: ch } })
        .extract({ left, top, width: w, height: h })
        .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    writeFileSync(join(OUT_DIR, `${slug}.png`), out)
    console.log(`${slug}: ring d=${side} -> ${SIZE}px clean circle`)
}
console.log("done.")
