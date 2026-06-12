import {
    existsSync,
    readdirSync,
} from "fs"
import {
    join,
} from "path"
import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/env"
import {
    getRuntimeContextRoot,
} from "@modules/filesystem"

/**
 * Resolves filesystem paths for coding-problem mount data. Problems live in
 * `<dataRoot>/coding-problems/sets/<domain>/problems/<slug>/` with an `en.md`,
 * optional `vi.md`, and a `testcases/` folder. The set (domain) folder is purely
 * organizational — the authoritative `domain` is in each problem's frontmatter.
 */
@Injectable()
export class CodingProblemPathService {
    /**
     * Absolute path to the coding-problems mount root. During a git-sourced seed
     * the pipeline points at the freshly-pulled staging copy via the runtime
     * context root (so seeding never reads possibly-stale local content); outside
     * seed it resolves to `.contexts`. No content-level fallback — if the active
     * root has no problems, none are seeded (a missing-content bug surfaces
     * instead of being masked by stale data).
     */
    root(): string {
        const runtimeRoot = getRuntimeContextRoot()
        return runtimeRoot
            ? join(runtimeRoot,
                "coding-problems")
            : envConfig().mountPath.data.codingProblems
    }

    /**
     * List absolute paths of every problem directory under each set's `problems`
     * folder of the active root, sorted by path for a stable order (display order
     * comes from frontmatter `orderIndex`, not the folder name).
     *
     * @returns absolute problem directory paths (empty when the root has none)
     */
    problemDirs(): Array<string> {
        // problems are grouped under a `sets/` root
        const setsRoot = join(this.root(),
            "sets")
        // a missing sets root simply means "no problems to seed"
        if (!existsSync(setsRoot)) {
            return []
        }
        const dirs: Array<string> = []
        // each immediate child of sets/ is one domain set
        for (const set of readdirSync(setsRoot,
            {
                withFileTypes: true,
            }).filter((entry) => entry.isDirectory())) {
            // problems for a set live under <set>/problems/
            const problemsRoot = join(setsRoot,
                set.name,
                "problems")
            if (!existsSync(problemsRoot)) {
                continue
            }
            // each sub-directory of problems/ is one problem
            for (const problem of readdirSync(problemsRoot,
                {
                    withFileTypes: true,
                }).filter((entry) => entry.isDirectory())) {
                dirs.push(join(problemsRoot,
                    problem.name))
            }
        }
        // stable ordering by path
        return dirs.sort((prev, next) => prev.localeCompare(next))
    }

    /** Absolute path to a problem's `testcases/` folder. */
    testcasesDir(problemDir: string): string {
        // testcases live in a fixed sub-folder of the problem directory
        return join(problemDir,
            "testcases")
    }

    /**
     * Absolute path to a problem's localized "approach hint" markdown.
     * Hints live in `<problemDir>/hints/<locale>.md` and are indexed into
     * Elasticsearch only — they are never persisted to Postgres.
     *
     * @param problemDir - absolute problem directory path
     * @param locale - locale code (e.g. `en`, `vi`)
     */
    hintPath(problemDir: string, locale: string): string {
        return join(problemDir,
            "hints",
            `${locale}.md`)
    }
}
