// Trim + upload the 5 NEW achievement mascots (final versions) to MinIO,
// overwriting the earlier placeholders. badges/* is already public-read.
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
    "bug-hunter": "Gemini_Generated_Image_osvw7uosvw7uosvw.png",
    "ai-whisperer": "Gemini_Generated_Image_mdfxipmdfxipmdfx.png",
    "mentor": "Gemini_Generated_Image_rhxjxqrhxjxqrhxj.png",
    "hive": "Gemini_Generated_Image_1j2ma1j2ma1j2ma1.png",
    "apex": "Gemini_Generated_Image_6uzzc76uzzc76uzz.png",
}

const OUT_DIR = join(process.cwd(), "scratch", "badges-trimmed")
mkdirSync(OUT_DIR, { recursive: true })

for (const [slug, file] of Object.entries(BADGES)) {
    const buffer = await sharp(join(DL, file))
        .trim()
        .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    writeFileSync(join(OUT_DIR, `${slug}.png`), buffer)
    const key = `badges/achievements/${slug}.png`
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: "image/png" }))
    console.log(`uploaded ${key} (${(buffer.length / 1024).toFixed(0)} KB)`)
}
console.log("done.")
