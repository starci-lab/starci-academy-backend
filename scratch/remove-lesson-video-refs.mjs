import fs from "fs"
import path from "path"

function walk(dir, files = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name)
        if (e.isDirectory()) walk(p, files)
        else if (e.name.endsWith(".ts")) files.push(p)
    }
    return files
}

const files = walk("src").filter((f) => {
    const c = fs.readFileSync(f, "utf8")
    return /LessonVideo|lessonVideo|lesson-video|numLessons|lessonVideos/.test(c)
})

for (const file of files) {
    let c = fs.readFileSync(file, "utf8")
    const orig = c

    c = c.replace(/\n\s*case LessonVideoEntity\.name:\s*\{[\s\S]*?\n\s*break\s*\n\s*\}/g, "")

    c = c.replace(/\s*\|\s*typeof LessonVideoEntity\.name/g, "")
    c = c.replace(/typeof LessonVideoEntity\.name\s*\|\s*/g, "")

    c = c.replace(/^\s*LessonVideoEntity,?\s*\n/gm, "")
    c = c.replace(/,\s*\n\s*LessonVideoEntity/g, "")
    c = c.replace(/LessonVideoEntity,\s*/g, "")
    c = c.replace(/LessonVideoTranslationEntity,\s*/g, "")

    c = c.replace(/\n\s*[A-Za-z]*LessonVideo[A-Za-z]*(Build)?Service,?\s*\n/g, "\n")
    c = c.replace(/\n\s*private readonly [A-Za-z]*LessonVideo[A-Za-z]*Service[^;]*;\s*\n/g, "\n")

    c = c.replace(/\n\s*LessonVideoEntity\.name,?\s*\n/g, "\n")

    c = c.replace(/\n\s*\[IndexSearchType\.LessonVideoIndex\]:[\s\S]*?\},\n/g, "\n")
    c = c.replace(/\n\s*LessonVideoIndex = "lesson-video-index",?\s*\n/g, "\n")
    c = c.replace(/\n\s*LessonVideo = "lessonVideo",?\s*\n/g, "\n")

    c = c.replace(/\n\s*\[LessonVideoEntity\.name\]:[\s\S]*?\},\n/g, "\n")
    c = c.replace(/\n\s*lessonVideo:\s*\{[\s\S]*?\},\n/g, "\n")

    c = c.replace(/\nexport interface LessonVideoParentIndexCacheResult[\s\S]*?\}\n/g, "\n")
    c = c.replace(/\s*\|\s*LessonVideoParentIndexCacheResult/g, "")

    c = c.replace(/\s*\|\s*"lessonVideo"/g, "")
    c = c.replace(/"lessonVideo"\s*\|\s*/g, "")

    c = c.replace(/\n\s*CdnSynchronizerLessonVideoRuntimeSyncFailed[^\n]*\n/g, "\n")
    c = c.replace(/\n\s*CdnSynchronizerLessonVideoRuntimeSyncFailedMessage,?\s*\n/g, "\n")
    c = c.replace(/\n\s*\[WinstonLog\.CdnSynchronizerLessonVideoRuntimeSyncFailed\]:[\s\S]*?\},\n/g, "\n")

    c = c.replace(/\n\s*\/\*\*[\s\S]*?lesson video[\s\S]*?\*\/\n\s*lessonVideo\([\s\S]*?\}\n/g, "\n")

    c = c.replace(/\n\s*numLessons:\s*\{[\s\S]*?\},\n/g, "\n")
    c = c.replace(/\n\s*lessons:\s*\{[\s\S]*?\},\n/g, "\n")

    c = c.replace(/\n\s*lessonVideoDisplayId[^\n]*\n/g, "\n")
    c = c.replace(/\n\s*lessonVideos[^\n]*\n/g, "\n")

    c = c.replace(/\n\/\*\*[\s\S]*?LessonVideoIdFactoryService[\s\S]*?\}\n/g, "\n")

    c = c.replace(/\n\s*lessonVideoId\?:[^\n]*\n/g, "\n")
    c = c.replace(/,\s*lessonVideoId/g, "")
    c = c.replace(/\n\s*lessonVideoId,?\s*\n/g, "\n")

    c = c.replace(/\nexport interface CdnSynchronizerLessonVideoRuntimeSyncFailedMessage[\s\S]*?\}\n/g, "\n")

    c = c.replace(/\n\s*if \(!shouldSync\(\s*\n\s*lessonVideo\)\)[\s\S]*?continue\s*\n\s*\}/g, "")

    c = c.replace(/lessonVideoSearch[^\n]*\n/g, "")
    c = c.replace(/selected\.has\(LessonVideoEntity\.name\)[\s\S]*?Promise\.resolve\(\[\] as Array<GlobalSearchItem>\),/g, "")
    c = c.replace(/lessonVideos: this\.dedupeItems\(lessonVideos\),?\s*\n/g, "")
    c = c.replace(/const lessonVideos[^\n]*\n/g, "")
    c = c.replace(/,\s*lessonVideos/g, "")

    if (c !== orig) {
        fs.writeFileSync(file, c)
        console.log("patched", file)
    }
}
