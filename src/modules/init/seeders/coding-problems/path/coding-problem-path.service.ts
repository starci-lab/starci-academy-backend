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

/**
 * Resolves filesystem paths for coding-problem mount data. Problems live in
 * `<dataRoot>/coding-problems/<index>-<slug>-<difficulty>/` with an `en.md`,
 * optional `vi.md`, and a `testcases/` folder.
 */
@Injectable()
export class CodingProblemPathService {
    /** Absolute path to the coding-problems mount root. */
    root(): string {
        // single source of truth for the data location (overridable per env)
        return envConfig().mountPath.data.codingProblems
    }

    /**
     * List absolute paths of each problem directory, sorted by name so the
     * numeric prefix gives a stable order.
     *
     * @returns absolute problem directory paths (empty when the root is absent)
     */
    problemDirs(): Array<string> {
        // resolve the root once
        const root = this.root()
        // a missing mount root simply means "no problems to seed"
        if (!existsSync(root)) {
            return []
        }
        // read only sub-directories (each is one problem) and sort by name
        return readdirSync(root,
            {
                withFileTypes: true,
            })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
            .sort((prev, next) => prev.localeCompare(next))
            .map((name) => join(root,
                name))
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
