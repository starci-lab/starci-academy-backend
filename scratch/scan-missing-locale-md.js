const fs = require("fs")
const path = require("path")

const root = path.join(process.cwd(), ".mount", "data")
const missing = []

const checkLocaleDirs = (baseRel) => {
    const base = path.join(root, ...baseRel.split("/"))
    if (!fs.existsSync(base)) {
        return
    }
    const hasEn = fs.existsSync(path.join(base, "en.md"))
    const hasVi = fs.existsSync(path.join(base, "vi.md"))
    if (!hasEn || !hasVi) {
        missing.push({
            rel: baseRel,
            en: hasEn,
            vi: hasVi,
        })
    }
}

const scanCourses = () => {
    const coursesDir = path.join(root, "courses")
    if (!fs.existsSync(coursesDir)) {
        console.log("NO courses dir", coursesDir)
        return
    }
    for (const course of fs.readdirSync(coursesDir)) {
        const coursePath = path.join(coursesDir, course)
        if (!fs.statSync(coursePath).isDirectory()) {
            continue
        }
        checkLocaleDirs(`courses/${course}`)
        const modulesDir = path.join(coursePath, "modules")
        if (fs.existsSync(modulesDir)) {
            for (const mod of fs.readdirSync(modulesDir)) {
                const modPath = path.join(modulesDir, mod)
                if (!fs.statSync(modPath).isDirectory()) {
                    continue
                }
                checkLocaleDirs(`courses/${course}/modules/${mod}`)
                const contentsDir = path.join(modPath, "contents")
                if (fs.existsSync(contentsDir)) {
                    for (const c of fs.readdirSync(contentsDir)) {
                        const cPath = path.join(contentsDir, c)
                        if (!fs.statSync(cPath).isDirectory()) {
                            continue
                        }
                        checkLocaleDirs(
                            `courses/${course}/modules/${mod}/contents/${c}`,
                        )
                        const chDir = path.join(cPath, "challenges")
                        if (fs.existsSync(chDir)) {
                            for (const ch of fs.readdirSync(chDir)) {
                                const chPath = path.join(chDir, ch)
                                if (!fs.statSync(chPath).isDirectory()) {
                                    continue
                                }
                                checkLocaleDirs(
                                    `courses/${course}/modules/${mod}/contents/${c}/challenges/${ch}`,
                                )
                            }
                        }
                        const lvDir = path.join(cPath, "lesson-videos")
                        if (fs.existsSync(lvDir)) {
                            for (const lv of fs.readdirSync(lvDir)) {
                                const lvPath = path.join(lvDir, lv)
                                if (!fs.statSync(lvPath).isDirectory()) {
                                    continue
                                }
                                checkLocaleDirs(
                                    `courses/${course}/modules/${mod}/contents/${c}/lesson-videos/${lv}`,
                                )
                            }
                        }
                    }
                }
            }
        }
        const msDir = path.join(coursePath, "milestones")
        if (fs.existsSync(msDir)) {
            for (const ms of fs.readdirSync(msDir)) {
                const msPath = path.join(msDir, ms)
                if (!fs.statSync(msPath).isDirectory()) {
                    continue
                }
                checkLocaleDirs(`courses/${course}/milestones/${ms}`)
                const tasksDir = path.join(msPath, "tasks")
                if (fs.existsSync(tasksDir)) {
                    for (const t of fs.readdirSync(tasksDir)) {
                        const tPath = path.join(tasksDir, t)
                        if (!fs.statSync(tPath).isDirectory()) {
                            continue
                        }
                        checkLocaleDirs(
                            `courses/${course}/milestones/${ms}/tasks/${t}`,
                        )
                    }
                }
            }
        }
    }
}

const scanOther = (subdir) => {
    const dir = path.join(root, subdir)
    if (!fs.existsSync(dir)) {
        return
    }
    const walk = (base, relParts) => {
        for (const name of fs.readdirSync(base)) {
            const full = path.join(base, name)
            if (!fs.statSync(full).isDirectory()) {
                continue
            }
            const rel = [...relParts, name].join("/")
            const hasEn = fs.existsSync(path.join(full, "en.md"))
            const hasVi = fs.existsSync(path.join(full, "vi.md"))
            if (hasEn || hasVi) {
                checkLocaleDirs(rel)
            } else {
                walk(full, [...relParts, name])
            }
        }
    }
    walk(dir, [subdir])
}

scanCourses()
scanOther("cv")
scanOther("foundations")
scanOther("headhuntings")

console.log(JSON.stringify(missing, null, 2))
console.log("TOTAL", missing.length)
