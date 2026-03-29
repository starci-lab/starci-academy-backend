import {
    Injectable 
} from "@nestjs/common"
import {
    envConfig 
} from "@modules/env"
import {
    existsSync, readdirSync, readFileSync, statSync 
} from "fs"
import {
    join 
} from "path"
import type {
    DeepPartial 
} from "typeorm"
import type {
    CourseEntity, ModuleEntity 
} from "../../entities"
import type {
    CoursesMountIndex, 
    IsValidManifestCourseDirParams, 
    LoadCoursesResult, 
    LoadModulesFromDirParams, 
    ModuleSeedFileEntry, 
    ReadCoursePayloadParams 
} from "./types"
import {
    leadingIntDirOrder, moduleJsonOrder 
} from "./utils"

/**
 * Loads PostgreSQL course seed data from the mounted filesystem.
 *
 * ## Directory layout
 *
 * Root path: `envConfig().mountPath.seeders.coursesDir` (env `SEEDERS_COURSES_MOUNT_PATH`,
 * default `<cwd>/.mount/seeders/courses`).
 *
 * ```
 * .mount/seeders/courses/
 *   data.json                    # optional manifest: { "courses": ["<folder>", ...] }
 *   <course-folder>/             # e.g. fullstack-mastery
 *     data.json                  # course metadata (id, title, prerequisites, qnas, …)
 *     course.json                # legacy; same role as data.json if data.json is absent
 *     modules/
 *       <n>/                      # preferred: order by leading integer in folder name
 *         data.json               # one module tree (TypeORM DeepPartial<ModuleEntity> JSON)
 *       …                         # or legacy: *.json files directly under modules/
 * ```
 *
 * ## Behaviour
 *
 * - **Manifest:** If root `data.json` parses to `{ "courses": string[] }`, only those subfolders are
 *   loaded, **in list order**. Entries that are not strings, or folders without a readable course file,
 *   are skipped.
 * - **Discovery:** If there is no `courses` array, every immediate subfolder that contains
 *   `data.json` or `course.json` is loaded; folder names are sorted alphabetically.
 * - **Modules:** If any `modules/<subdir>/data.json` exists, only that layout is used, ordered by the
 *   leading integer in the subdirectory name. Otherwise, all `modules/*.json` files are loaded and
 *   ordered by the leading integer in the filename.
 *
 * JSON field names follow TypeORM entity property names (camelCase), e.g. `orderIndex`, `cdnUrl`.
 * Nested objects must satisfy entity NOT NULL columns (e.g. `advancedContent.title` on
 * `premium_advanced_contents`).
 *
 * @example
 * const courses = courseLoaderService.load()
 */
@Injectable()
export class CourseLoaderService {
    /**
     * Loads every course from disk (manifest or discovery) and merges ordered modules per course.
     *
     * @returns Payloads for `EntityManager.insert(CourseEntity, …)`, or an empty array.
     */
    load(): LoadCoursesResult {
        const root = envConfig().mountPath.seeders.coursesDir
        // bail out when mount dir is missing
        if (!existsSync(root) || !statSync(root).isDirectory()) {
            return []
        }
        const dirNames = this.listCourseDirNames(root)
        const result: LoadCoursesResult = []
        for (const name of dirNames) {
            const courseDir = join(root,
                name)
            const payload = this.readCoursePayload({
                courseDir,
            })
            if (!payload) {
                continue
            }
            const modulesDir = join(courseDir,
                "modules")
            // attach ordered module trees
            payload.modules = this.loadModulesFromDir({
                modulesDir,
            })
            result.push(payload)
        }
        return result
    }

    /**
     * Reads `data.json` from a course folder.
     *
     * @param param - Course directory path.
     * @returns Parsed partial entity or null when neither file exists.
     */
    private readCoursePayload({
        courseDir,
    }: ReadCoursePayloadParams): DeepPartial<CourseEntity> | null {
        const dataPath = join(courseDir,
            "data.json")
        if (existsSync(dataPath)) {
            return JSON.parse(readFileSync(dataPath,
                "utf8")) as DeepPartial<CourseEntity>
        }
        return null
    }

    /**
     * Loads module payloads from `modules/<n>/data.json` or flat `modules/*.json`.
     *
     * @param param - Path to the course `modules` directory.
     * @returns Ordered module partials.
     */
    private loadModulesFromDir({
        modulesDir,
    }: LoadModulesFromDirParams): Array<DeepPartial<ModuleEntity>> {
        if (!existsSync(modulesDir) || !statSync(modulesDir).isDirectory()) {
            return []
        }
        const entries = readdirSync(modulesDir)
        const fromSubdirs: Array<ModuleSeedFileEntry> = []
        for (const entry of entries) {
            const modPath = join(modulesDir,
                entry)
            if (!statSync(modPath).isDirectory()) {
                continue
            }
            const dataFile = join(modPath,
                "data.json")
            if (!existsSync(dataFile)) {
                continue
            }
            fromSubdirs.push({
                order: leadingIntDirOrder(entry),
                path: dataFile,
            })
        }
        if (fromSubdirs.length > 0) {
            fromSubdirs.sort((a,
                b) => a.order - b.order)
            return fromSubdirs.map((m) =>
                JSON.parse(readFileSync(m.path,
                    "utf8")) as DeepPartial<ModuleEntity>)
        }
        const flatJson = entries
            .filter((f) => f.endsWith(".json"))
            .sort((a,
                b) => moduleJsonOrder(a) - moduleJsonOrder(b))
        return flatJson.map((f) =>
            JSON.parse(readFileSync(join(modulesDir,
                f),
            "utf8")) as DeepPartial<ModuleEntity>)
    }

    /**
     * Lists subfolders under root that contain a readable course payload.
     *
     * @param root - Mount courses root directory.
     * @returns Sorted directory names.
     */
    private discoverCourseDirNames(root: string): Array<string> {
        const names: Array<string> = []
        for (const name of readdirSync(root)) {
            const courseDir = join(root,
                name)
            if (!statSync(courseDir).isDirectory()) {
                continue
            }
            if (this.readCoursePayload({
                courseDir,
            })) {
                names.push(name)
            }
        }
        return names.sort()
    }

    /**
     * Resolves course folder order from root `data.json` manifest or discovery.
     *
     * @param root - Mount courses root directory.
     * @returns Folder names in load order.
     */
    private listCourseDirNames(root: string): Array<string> {
        const indexPath = join(root,
            "data.json")
        if (existsSync(indexPath) && statSync(indexPath).isFile()) {
            const raw = JSON.parse(
                readFileSync(indexPath,
                    "utf8")
            ) as CoursesMountIndex
            if (Array.isArray(raw.courses)) {
                return raw.courses.filter((name): name is string => {
                    if (typeof name !== "string") {
                        return false
                    }
                    return this.isValidManifestCourseDir({
                        root,
                        name,
                    }
                    )
                }
                )
            }
        }
        return this.discoverCourseDirNames(root)
    }

    /**
     * Checks manifest entry points at a directory with `data.json` or `course.json`.
     *
     * @param param - Mount root and folder name from manifest.
     * @returns Whether the course dir is loadable.
     */
    private isValidManifestCourseDir({
        root, name,
    }: IsValidManifestCourseDirParams): boolean {
        const courseDir = join(root,
            name)
        if (!existsSync(courseDir) || !statSync(courseDir).isDirectory()) {
            return false
        }
        return this.readCoursePayload({
            courseDir,
        }) !== null
    }
}
