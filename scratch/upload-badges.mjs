// One-off: trim transparent padding off the Gemini badge art, square it to 512,
// upload to MinIO under `badges/achievements/<slug>.png`, and make the `badges/*`
// prefix publicly readable so <BadgeImage> can load them by their iconKey.
//
// sharp lives in the FE node_modules; the aws-sdk S3 client lives in the BE
// node_modules — both are required by absolute path so this runs from anywhere.
import { createRequire } from "node:module"
import { mkdirSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const require = createRequire(import.meta.url)
const sharp = require("C:/Repositories/starci-academy/node_modules/sharp")
const {
    S3Client,
    PutObjectCommand,
    PutBucketPolicyCommand,
} = require("C:/Repositories/ac/starci-academy-backend/node_modules/@aws-sdk/client-s3")

// MinIO connection (local dev defaults — see env config s3.minio)
const ENDPOINT = "http://localhost:9000"
const BUCKET = "starci-academy"
const s3 = new S3Client({
    endpoint: ENDPOINT,
    region: "us-east-1",
    credentials: {
        accessKeyId: "minioadmin",
        secretAccessKey: "minioadmin123",
    },
    forcePathStyle: true,
})

// slug -> source PNG in Downloads (HD versions chosen)
const DL = join(homedir(), "Downloads")
const BADGES = {
    "first-steps": "Gemini_Generated_Image_1jsw0f1jsw0f1jsw.png",
    "on-fire": "Gemini_Generated_Image_x5ifm6x5ifm6x5if.png",
    "challenger": "Gemini_Generated_Image_8clg6c8clg6c8clg.png",
    "milestone-master": "Gemini_Generated_Image_w1sx1yw1sx1yw1sx.png",
    "polyglot": "Gemini_Generated_Image_ltmcd1ltmcd1ltmc.png",
    "bug-hunter": "Gemini_Generated_Image_gahcu3gahcu3gahc.png",
    "ai-whisperer": "Gemini_Generated_Image_c9sm00c9sm00c9sm.png",
    "mentor": "Gemini_Generated_Image_isa8buisa8buisa8.png",
}

// keep a trimmed copy on disk too, so the art survives a MinIO reset
const OUT_DIR = join(process.cwd(), "scratch", "badges-trimmed")
mkdirSync(OUT_DIR, { recursive: true })

const SIZE = 512

for (const [slug, file] of Object.entries(BADGES)) {
    const src = join(DL, file)
    // trim the fully-transparent border, then fit onto a centered transparent
    // SIZE×SIZE canvas so every badge ends up the same square dimensions
    const buffer = await sharp(src)
        .trim()
        .resize(SIZE, SIZE, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer()

    // local backup
    writeFileSync(join(OUT_DIR, `${slug}.png`), buffer)

    // upload to MinIO at the exact key <BadgeImage> requests (iconKey)
    const key = `badges/achievements/${slug}.png`
    await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: "image/png",
    }))
    console.log(`uploaded ${key} (${(buffer.length / 1024).toFixed(0)} KB)`)
}

// make repo/*, assets/*, badges/* anonymously readable (one MinIO bucket policy)
const policy = {
    Version: "2012-10-17",
    Statement: [
        {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [
                `arn:aws:s3:::${BUCKET}/repo/*`,
                `arn:aws:s3:::${BUCKET}/assets/*`,
                `arn:aws:s3:::${BUCKET}/badges/*`,
            ],
        },
    ],
}
await s3.send(new PutBucketPolicyCommand({
    Bucket: BUCKET,
    Policy: JSON.stringify(policy),
}))
console.log("bucket policy updated: badges/* is now public-read")
console.log("done.")
