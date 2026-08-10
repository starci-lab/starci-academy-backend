import {
    Injectable,
} from "@nestjs/common"
import {
    listGitMountDir,
    readGitMountDoc,
    gitMountExists,
} from "./git-mount"
import type {
    GitMountDoc,
} from "./git-mount"

@Injectable()
/**
 * Nest facade over the `.gitmounts` SSOT readers.
 *
 * Import-time `describe.skip` gates still call the plain {@link gitMountExists}
 * / {@link readGitMountDoc} functions -- those run before any testing module
 * exists. In-test reads go through this provider once {@link TestHelpersModule}
 * is imported.
 */
export class GitMountService {
    /**
     * Read a real content doc from the `.gitmounts` SSOT mount.
     *
     * @param relDir - path under `.gitmounts/data`
     * @param locale - `"en"` (default) or `"vi"`
     * @returns the parsed {@link GitMountDoc}
     */
    public readGitMountDoc(
        relDir: string,
        locale: "en" | "vi" = "en",
    ): GitMountDoc {
        return readGitMountDoc(relDir,
            locale)
    }

    /**
     * List the non-dot entries under a `.gitmounts/data` directory, sorted.
     *
     * @param relDir - path under `.gitmounts/data`
     * @returns entry names
     */
    public listGitMountDir(
        relDir: string,
    ): Array<string> {
        return listGitMountDir(relDir)
    }

    /**
     * Whether a `.gitmounts/data` path exists.
     *
     * @param relDir - path under `.gitmounts/data`
     * @returns true when the path is present
     */
    public gitMountExists(
        relDir: string,
    ): boolean {
        return gitMountExists(relDir)
    }
}
