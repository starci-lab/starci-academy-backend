// One-off: turn the bare-animal Gemini art (solid/gradient colour background)
// into transparent 200x200 badge PNGs, then write them to the git assets dir
// AND upload to MinIO under their iconKey `assets/badges/achievements/<slug>.png`.
//
// Gemini won't emit clean transparency, so the background is removed here with a
// gradient-aware flood fill seeded from the four corners (each step only crosses
// near-identical colours, so it follows a smooth background but stops dead at the
// animal's bold dark outline). A largest-connected-component pass then drops any
// detached decorations (speech bubbles, glowing halos, corner sparkles).
//
// sharp lives in the FE node_modules; the aws-sdk S3 client in the BE node_modules.
import { createRequire } from "node:module"
import { mkdirSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const require = createRequire(import.meta.url)
const sharp = require("C:/Repositories/starci-academy/node_modules/sharp")
const {
    S3Client,
    PutObjectCommand,
} = require("C:/Repositories/ac/starci-academy-backend/node_modules/@aws-sdk/client-s3")

const ENDPOINT = "http://localhost:9000"
const BUCKET = "starci-academy"
const s3 = new S3Client({
    endpoint: ENDPOINT,
    region: "us-east-1",
    credentials: { accessKeyId: "minioadmin", secretAccessKey: "minioadmin123" },
    forcePathStyle: true,
})

const DL = join(homedir(), "Downloads")
// slug -> source PNG in Downloads (the bare-animal, solid-background versions)
const BADGES = {
    "baby-duckling": "Gemini_Generated_Image_94beht94beht94be.png",
    "blazing-fox": "Gemini_Generated_Image_bmnqhbbmnqhbbmnq.png",
    "sword-shark": "Gemini_Generated_Image_rbx0y5rbx0y5rbx0.png",
    "crowned-owl": "Gemini_Generated_Image_t8o34st8o34st8o3.png",
    "polyglot-parrot": "Gemini_Generated_Image_4zb48k4zb48k4zb4.png",
    "bug-hunting-chameleon": "Gemini_Generated_Image_4w4mf64w4mf64w4m.png",
    "brainy-octopus": "Gemini_Generated_Image_tpsw6xtpsw6xtpsw.png",
    "guiding-elephant": "Gemini_Generated_Image_9c6aho9c6aho9c6a.png",
    "busy-bee": "Gemini_Generated_Image_j8kif1j8kif1j8ki.png",
    "champion-lion": "Gemini_Generated_Image_b28kuxb28kuxb28k.png",
}

const GIT_DIR = "C:/Repositories/ac/starci-academy-backend/.gitrefs/data/assets/badges/achievements"
const OUT_DIR = join(process.cwd(), "scratch", "badges-bare-200")
mkdirSync(OUT_DIR, { recursive: true })

const WORK = 768      // process at this width (keeps flood fill fast + crisp)
const SIZE = 200      // final square badge size
const STEP_DELTA = 28 // max per-step colour distance treated as "same background"

/** Squared RGB distance between two pixels in a raw RGBA buffer. */
const dist2 = (d, a, b) => {
    const dr = d[a] - d[b]
    const dg = d[a + 1] - d[b + 1]
    const db = d[a + 2] - d[b + 2]
    return dr * dr + dg * dg + db * db
}

/** Flood the background to alpha 0 from the 4 corners, gradient-aware. */
const stripBackground = (data, w, h) => {
    const n = w * h
    const bg = new Uint8Array(n)
    const queue = new Int32Array(n)
    let qh = 0
    let qt = 0
    const thr = STEP_DELTA * STEP_DELTA
    const seed = (p) => { if (!bg[p]) { bg[p] = 1; queue[qt++] = p } }
    seed(0); seed(w - 1); seed(n - w); seed(n - 1)
    while (qh < qt) {
        const p = queue[qh++]
        const x = p % w
        const y = (p - x) / w
        const pi = p * 4
        // 4-neighbours: spread only across near-identical colour (follows gradient)
        if (x > 0) { const q = p - 1; if (!bg[q] && dist2(data, pi, q * 4) < thr) seed(q) }
        if (x < w - 1) { const q = p + 1; if (!bg[q] && dist2(data, pi, q * 4) < thr) seed(q) }
        if (y > 0) { const q = p - w; if (!bg[q] && dist2(data, pi, q * 4) < thr) seed(q) }
        if (y < h - 1) { const q = p + w; if (!bg[q] && dist2(data, pi, q * 4) < thr) seed(q) }
    }
    for (let p = 0; p < n; p++) if (bg[p]) data[p * 4 + 3] = 0
    return bg
}

/** Keep only the largest connected foreground blob; drop detached decorations. */
const keepLargestBlob = (data, w, h) => {
    const n = w * h
    const label = new Int32Array(n).fill(-1)
    const queue = new Int32Array(n)
    const fg = (p) => data[p * 4 + 3] > 16
    let best = -1
    let bestSize = 0
    let cur = 0
    for (let s = 0; s < n; s++) {
        if (label[s] !== -1 || !fg(s)) continue
        let qh = 0
        let qt = 0
        label[s] = cur
        queue[qt++] = s
        let size = 0
        while (qh < qt) {
            const p = queue[qh++]
            size++
            const x = p % w
            const y = (p - x) / w
            if (x > 0) { const q = p - 1; if (label[q] === -1 && fg(q)) { label[q] = cur; queue[qt++] = q } }
            if (x < w - 1) { const q = p + 1; if (label[q] === -1 && fg(q)) { label[q] = cur; queue[qt++] = q } }
            if (y > 0) { const q = p - w; if (label[q] === -1 && fg(q)) { label[q] = cur; queue[qt++] = q } }
            if (y < h - 1) { const q = p + w; if (label[q] === -1 && fg(q)) { label[q] = cur; queue[qt++] = q } }
        }
        if (size > bestSize) { bestSize = size; best = cur }
        cur++
    }
    for (let p = 0; p < n; p++) if (label[p] !== best) data[p * 4 + 3] = 0
}

const put = async (key, body) => s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: body, ContentType: "image/png",
    CacheControl: "public, max-age=31536000, immutable",
}))

for (const [slug, file] of Object.entries(BADGES)) {
    const src = join(DL, file)
    const { data, info } = await sharp(src)
        .resize({ width: WORK })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
    const { width, height } = info
    stripBackground(data, width, height)
    keepLargestBlob(data, width, height)

    const png = await sharp(data, { raw: { width, height, channels: 4 } })
        .png()
        .trim({ threshold: 12 })
        .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toBuffer()

    writeFileSync(join(OUT_DIR, `${slug}.png`), png)
    writeFileSync(join(GIT_DIR, `${slug}.png`), png)
    await put(`assets/badges/achievements/${slug}.png`, png)
    console.log(`done ${slug} (${png.length} bytes)`)
}

console.log("all 10 badges processed + uploaded")
