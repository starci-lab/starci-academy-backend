// Mirror .gitrefs/data/assets/** to MinIO under the public assets/ prefix,
// preserving sub-paths — exactly what the refactored AssetsService does on boot.
// Run for immediacy so badges + brand assets are live without waiting for a reboot.
import { createRequire } from "node:module"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, sep, extname } from "node:path"

const require = createRequire(import.meta.url)
const { S3Client, PutObjectCommand } = require("C:/Repositories/ac/starci-academy-backend/node_modules/@aws-sdk/client-s3")

const BUCKET = "starci-academy"
const ROOT = "C:/Repositories/ac/starci-academy-backend/.gitrefs/data/assets"
const CT = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp" }

const s3 = new S3Client({
    endpoint: "http://localhost:9000",
    region: "us-east-1",
    credentials: { accessKeyId: "minioadmin", secretAccessKey: "minioadmin123" },
    forcePathStyle: true,
})

const walk = (dir) => readdirSync(dir).flatMap((name) => {
    const abs = join(dir, name)
    return statSync(abs).isDirectory() ? walk(abs) : [abs]
})

let n = 0
for (const abs of walk(ROOT)) {
    const rel = relative(ROOT, abs).split(sep).join("/")
    const key = `assets/${rel}`
    await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: readFileSync(abs),
        ContentType: CT[extname(abs).toLowerCase()] ?? "application/octet-stream",
    }))
    console.log(`-> ${key}`)
    n++
}
console.log(`done: ${n} objects`)
