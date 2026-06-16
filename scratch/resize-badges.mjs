// One-off: resize the bare-animal Gemini art to 200x200 square badges (keeping
// their solid colour background — the FE clips them to a circle and draws the
// rank ring), write to the git assets dir, and upload to MinIO under each
// iconKey `assets/badges/achievements/<slug>.png`.
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

const BUCKET = "starci-academy"
const s3 = new S3Client({
    endpoint: "http://localhost:9000",
    region: "us-east-1",
    credentials: { accessKeyId: "minioadmin", secretAccessKey: "minioadmin123" },
    forcePathStyle: true,
})

const DL = join(homedir(), "Downloads")
const BADGES = {
    "baby-duckling": "Gemini_Generated_Image_94beht94beht94be.png",
    "blazing-fox": "Gemini_Generated_Image_bmnqhbbmnqhbbmnq.png",
    "sword-shark": "Gemini_Generated_Image_rbx0y5rbx0y5rbx0.png",
    "crowned-owl": "Gemini_Generated_Image_t8o34st8o34st8o3.png",
    "polyglot-parrot": "Gemini_Generated_Image_4zb48k4zb48k4zb4.png",
    "bug-hunting-chameleon": "Gemini_Generated_Image_4w4mf64w4mf64w4m.png",
    "brainy-octopus": "Gemini_Generated_Image_tpsw6xtpsw6xtpsw.png",
    "guiding-elephant": "Gemini_Generated_Image_9c6aho9c6aho9c6a.png",
    "busy-bee": "Gemini_Generated_Image_3sli6e3sli6e3sli.png",
    "champion-lion": "Gemini_Generated_Image_b28kuxb28kuxb28k.png",
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
    await put(`assets/badges/achievements/${slug}.png`, png)
    console.log(`done ${slug} (${png.length} bytes)`)
}
console.log("all 10 badges resized + uploaded")
