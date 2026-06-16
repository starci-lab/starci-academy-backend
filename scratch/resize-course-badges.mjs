// One-off: resize the 3 course mascots to 200x200, write to the git assets dir,
// upload to MinIO under `assets/badges/achievements/<slug>.png`.
import { createRequire } from "node:module"
import { mkdirSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const require = createRequire(import.meta.url)
const sharp = require("C:/Repositories/starci-academy/node_modules/sharp")
const { S3Client, PutObjectCommand } = require("C:/Repositories/ac/starci-academy-backend/node_modules/@aws-sdk/client-s3")

const BUCKET = "starci-academy"
const s3 = new S3Client({
    endpoint: "http://localhost:9000",
    region: "us-east-1",
    credentials: { accessKeyId: "minioadmin", secretAccessKey: "minioadmin123" },
    forcePathStyle: true,
})

const DL = join(homedir(), "Downloads")
const BADGES = {
    "architect-rhino": "Gemini_Generated_Image_4ifc3v4ifc3v4ifc.png",
    "fullstack-monkey": "Gemini_Generated_Image_1cw3hq1cw3hq1cw3.png",
    "devops-wolf": "Gemini_Generated_Image_7b0l6n7b0l6n7b0l.png",
}

const GIT_DIR = "C:/Repositories/ac/starci-academy-backend/.gitrefs/data/assets/badges/achievements"
const OUT_DIR = join(process.cwd(), "scratch", "badges-200")
mkdirSync(OUT_DIR, { recursive: true })
const SIZE = 200

const put = (key, body) => s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: body, ContentType: "image/png",
    CacheControl: "public, max-age=31536000, immutable",
}))

for (const [slug, file] of Object.entries(BADGES)) {
    const png = await sharp(join(DL, file))
        .resize(SIZE, SIZE, { fit: "cover", position: "centre" })
        .png({ compressionLevel: 9 })
        .toBuffer()
    writeFileSync(join(OUT_DIR, `${slug}.png`), png)
    writeFileSync(join(GIT_DIR, `${slug}.png`), png)
    try {
        await put(`assets/badges/achievements/${slug}.png`, png)
        console.log(`done ${slug} (${png.length} bytes) + uploaded`)
    } catch {
        console.log(`done ${slug} (${png.length} bytes) — DISK ONLY (MinIO down)`)
    }
}
console.log("3 course badges resized + uploaded")
