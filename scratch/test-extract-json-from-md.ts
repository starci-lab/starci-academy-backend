/**
 * Extract sample mount files → output.json (JSON only, no input copy).
 * Run: npx ts-node -r tsconfig-paths/register scratch/test-extract-json-from-md.ts
 */

import fs from "fs"
import path from "path"
import {
    ExtractJsonFromMdService,
} from "../src/modules/init/seeders/shared/extracts/extract-json-from-md.service"

const REPO = path.join(__dirname, "..")
const OUTPUT_ROOT = path.join(__dirname, "extract-output")
const extractor = new ExtractJsonFromMdService()

const SAMPLES: Array<{ label: string; relativePath: string }> = [
    {
        label: "foundation-item",
        relativePath: ".mount/data/foundations/0-docker/foundations/0-docker-starci-video/vi.md",
    },
    {
        label: "foundation-category",
        relativePath: ".mount/data/foundations/0-docker/vi.md",
    },
    {
        label: "headhunting-company",
        relativePath: ".mount/data/headhuntings/0-pegasi/vi.md",
    },
    {
        label: "headhunting-consultant",
        relativePath: ".mount/data/headhuntings/0-pegasi/consultants/0-my-hanh-pegasi/vi.md",
    },
    {
        label: "challenge",
        relativePath: ".mount/data/courses/1-system-design-mastery/modules/1-database-fundamentals/contents/0-sql-vs-nosql/challenges/0-product-catalog-sql-nosql-mirror-easy/vi.md",
    },
    {
        label: "milestone",
        relativePath: ".mount/data/courses/0-fullstack-mastery/milestones/0-project-initialization-configuration/en.md",
    },
    {
        label: "milestone-task",
        relativePath: ".mount/data/courses/0-fullstack-mastery/milestones/0-project-initialization-configuration/tasks/0-nestjs-project-initialization/en.md",
    },
]

fs.mkdirSync(OUTPUT_ROOT, {
    recursive: true,
})

for (const sample of SAMPLES) {
    const markdown = fs.readFileSync(path.join(REPO, sample.relativePath), "utf8")
    const json = extractor.extract(markdown)
    const outDir = path.join(OUTPUT_ROOT, sample.label)
    const outPath = path.join(outDir, "output.json")

    fs.mkdirSync(outDir, {
        recursive: true,
    })
    fs.writeFileSync(outPath, `${JSON.stringify(json, null, 2)}\n`, "utf8")

    console.log(outPath)
}
