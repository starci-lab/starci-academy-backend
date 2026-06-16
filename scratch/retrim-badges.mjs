// Tight-crop badges by alpha "mass" percentile: sum alpha per column/row, then
// trim columns/rows from each edge until a small fraction of total mass is passed.
// This drops sparse faint glow + scattered sparks at the edges while keeping the
// dense badge disc — then squares to SIZE so the badge fills the frame.
import { createRequire } from "node:module"
import { readdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const require = createRequire(import.meta.url)
const sharp = require("C:/Repositories/starci-academy/node_modules/sharp")

const DIR = "C:/Repositories/ac/starci-academy-backend/.gitrefs/data/assets/badges/achievements"
const CUT = 0.004   // trim until this fraction of total alpha-mass is crossed (each edge)
const SIZE = 512

const edge = (profile, total) => {
    let acc = 0, lo = 0, hi = profile.length - 1
    for (let i = 0; i < profile.length; i++) { acc += profile[i]; if (acc >= total * CUT) { lo = i; break } }
    acc = 0
    for (let i = profile.length - 1; i >= 0; i--) { acc += profile[i]; if (acc >= total * CUT) { hi = i; break } }
    return [lo, hi]
}

for (const file of readdirSync(DIR).filter((f) => f.endsWith(".png"))) {
    const src = join(DIR, file)
    const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const { width: W, height: H, channels: ch } = info

    const colMass = new Float64Array(W)
    const rowMass = new Float64Array(H)
    let total = 0
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const al = data[(y * W + x) * ch + 3]
            colMass[x] += al; rowMass[y] += al; total += al
        }
    }
    const [minX, maxX] = edge(colMass, total)
    const [minY, maxY] = edge(rowMass, total)
    const cropW = maxX - minX + 1
    const cropH = maxY - minY + 1

    const out = await sharp(src)
        .extract({ left: minX, top: minY, width: cropW, height: cropH })
        .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    writeFileSync(src, out)
    console.log(`${file}: crop ${cropW}x${cropH} (was ${W}x${H})`)
}
console.log("done.")
