import {
    Injectable,
} from "@nestjs/common"
import {
    Octokit,
} from "octokit"
import {
    mkdir,
    mkdtemp,
    readFile,
    writeFile,
    readdir,
    rm,
    cp,
} from "fs/promises"
import {
    existsSync,
} from "fs"
import {
    join,
} from "path"
import {
    tmpdir,
} from "os"
import * as tar from "tar"
import {
    ContextType,
    envConfig,
} from "@modules/env"
import {
    MountFilesystemService,
} from "@modules/filesystem"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    DataGitBootstrapException,
} from "@modules/exceptions"
import {
    DATA_GIT_SHA_MARKER_FILE,
    DATA_GIT_TEMP_PREFIX,
} from "./constants"
import type {
    DownloadAndExtractParams,
    DownloadAndExtractResult,
    EnsureDataGitResult,
    ResolveChangedPathsParams,
    ResolveChangedPathsResult,
} from "./types"

/**
 * Materializes the private `data` GitHub repo into the local data root.
 *
 * Replaces the manual `.mount/data` workflow. On boot it resolves the remote
 * commit SHA, compares it to a local marker, and when they differ downloads the
 * repo tarball (via the GitHub API — no `git` binary required) into a **staging**
 * temp dir and computes the file-level diff. The orchestrator seeds/syncs from
 * the staging copy; only after that succeeds does {@link materialize} copy the
 * staging tree into `.contexts` and re-stamp the marker — so a failed seed never
 * corrupts the local source.
 *
 * @example
 * const result = await dataGitBootstrapService.ensure()
 * // ...seed from result.stagingRoot...
 * await dataGitBootstrapService.materialize(result)
 */
@Injectable()
export class DataGitBootstrapService {
    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Resolves the remote `data` repo into a staging copy and computes the diff.
     *
     * Does NOT touch `.contexts` or the marker — call {@link materialize} after a
     * successful seed to commit the staging tree, or {@link cleanup} to discard it.
     *
     * @returns The remote SHA, the changed-path diff, and the staging location
     */
    async ensure(): Promise<EnsureDataGitResult> {
        // read repo coordinates from env so ops can repoint per-environment
        const {
            owner,
            repo,
            ref: configuredRef,
            subdir,
        } = envConfig().dataGit
        // resolve the on-disk root that the seed pipeline ultimately reads from
        const checkoutRoot = this.resolveCheckoutRoot()
        // build an authenticated client — dedicated read-only data-git token
        // (falls back to the shared github access token when not mounted)
        const octokit = new Octokit({
            auth: this.mountFilesystemService.dataGitToken().trim(),
        })

        // announce the bootstrap so logs show which target is being resolved
        this.winstonService.log(WinstonLog.DataGitBootstrapStarted,
            {
                owner,
                repo,
                ref: configuredRef,
            })

        try {
            // an empty ref means "whatever the repo's default branch is"
            const ref = configuredRef || await this.resolveDefaultBranch(octokit,
                owner,
                repo)
            // ask GitHub for the current tip commit of that branch (check cloud)
            const remoteSha = await this.resolveRemoteSha(octokit,
                owner,
                repo,
                ref)
            // the marker records the SHA the local root was last populated from (check local)
            const markerPath = join(checkoutRoot,
                DATA_GIT_SHA_MARKER_FILE)
            const previousSha = await this.readMarker(markerPath)

            // skip the download when the root already holds this exact commit
            if (previousSha === remoteSha && this.hasContent(checkoutRoot)) {
                this.winstonService.log(WinstonLog.DataGitBootstrapUpToDate,
                    {
                        owner,
                        repo,
                        ref,
                        sha: remoteSha,
                    })
                return {
                    changed: false,
                    sha: remoteSha,
                    previousSha,
                    // nothing changed → no diff to act on, no staging to seed
                    changedPaths: [],
                    diffAvailable: false,
                    stagingRoot: null,
                    tempDir: null,
                    checkoutRoot,
                }
            }

            // gen diff first (API only — independent of the download)
            const {
                changedPaths,
                diffAvailable,
            } = await this.resolveChangedPaths({
                octokit,
                owner,
                repo,
                previousSha,
                newSha: remoteSha,
            })

            // download + extract into a staging dir; .contexts is left untouched
            const {
                tempDir,
                stagingRoot,
            } = await this.downloadAndExtract({
                octokit,
                owner,
                repo,
                ref,
                subdir,
            })

            return {
                changed: true,
                sha: remoteSha,
                previousSha,
                changedPaths,
                diffAvailable,
                stagingRoot,
                tempDir,
                checkoutRoot,
            }
        } catch (error) {
            // normalize the caught value once so the log/exception see a real Error
            const normalized = error instanceof Error
                ? error
                : new Error(String(error))
            // log loudly before failing — the boot must not silently seed stale data
            this.winstonService.log(WinstonLog.DataGitBootstrapFailed,
                {
                    owner,
                    repo,
                    ref: configuredRef,
                    errorCode: normalized.name,
                    errorMessage: normalized.message,
                    errorStack: normalized.stack,
                })
            // rethrow as a typed exception so the failure groups in Sentry/log filters
            throw new DataGitBootstrapException({
                owner,
                repo,
                ref: configuredRef,
                originalError: normalized,
            })
        }
    }

    /**
     * Commits the staging copy into `.contexts` and re-stamps the marker — the
     * final "pull source into local" step, run only after a successful seed/sync.
     *
     * @param result - The {@link ensure} result carrying the staging location
     */
    async materialize(
        result: EnsureDataGitResult,
    ): Promise<void> {
        // nothing was downloaded (up to date / pull failed) → nothing to commit
        if (!result.stagingRoot) {
            return
        }
        const {
            owner,
            repo,
            ref,
        } = envConfig().dataGit
        // ensure the destination root exists before copying into it
        await mkdir(result.checkoutRoot,
            {
                recursive: true,
            })
        // replace each top-level entry individually so unrelated files survive
        const entries = await readdir(result.stagingRoot)
        for (const entry of entries) {
            // drop the stale copy then move the fresh one in — a per-entry swap
            const destination = join(result.checkoutRoot,
                entry)
            await rm(destination,
                {
                    recursive: true, force: true,
                })
            await cp(join(result.stagingRoot,
                entry),
            destination,
            {
                recursive: true,
            })
        }
        // re-stamp the marker so the next boot recognizes this commit
        await writeFile(join(result.checkoutRoot,
            DATA_GIT_SHA_MARKER_FILE),
        result.sha,
        "utf8")
        // surface the old → new transition (the "source pulled" signal)
        this.winstonService.log(WinstonLog.DataGitBootstrapUpdated,
            {
                owner,
                repo,
                ref,
                previousSha: result.previousSha,
                newSha: result.sha,
                entryCount: entries.length,
                checkoutRoot: result.checkoutRoot,
            })
        // the staging tree has served its purpose
        await this.cleanup(result)
    }

    /**
     * Removes the staging temp dir; safe to call multiple times.
     *
     * @param result - The {@link ensure} result carrying the temp location
     */
    async cleanup(
        result: EnsureDataGitResult,
    ): Promise<void> {
        if (!result.tempDir) {
            return
        }
        await rm(result.tempDir,
            {
                recursive: true, force: true,
            })
    }

    /**
     * Resolves the on-disk root the seed pipeline ultimately reads from — the
     * path of the first enabled filesystem context.
     *
     * @returns Absolute path of the filesystem-context data root
     */
    private resolveCheckoutRoot(): string {
        // the loader/resolver read content from the enabled filesystem context
        const filesystemContext = envConfig().contexts.find(
            (context) => context.enabled && context.type === ContextType.Filesystem,
        )
        // without one, there is nowhere consistent to extract into → misconfiguration
        if (!filesystemContext) {
            throw new DataGitBootstrapException({
                owner: envConfig().dataGit.owner,
                repo: envConfig().dataGit.repo,
                ref: envConfig().dataGit.ref,
                originalError: new Error(
                    "No enabled filesystem context found to extract the data repo into",
                ),
            })
        }
        return filesystemContext.path
    }

    /**
     * Resolves the repo's default branch when no explicit ref is configured.
     *
     * @param octokit - Authenticated GitHub client
     * @param owner - Repository owner
     * @param repo - Repository name
     * @returns The default branch name
     */
    private async resolveDefaultBranch(
        octokit: Octokit,
        owner: string,
        repo: string,
    ): Promise<string> {
        // a single repo lookup yields the default branch to pin against
        const response = await octokit.rest.repos.get({
            owner,
            repo,
        })
        return response.data.default_branch
    }

    /**
     * Reads the current tip commit SHA of a branch.
     *
     * @param octokit - Authenticated GitHub client
     * @param owner - Repository owner
     * @param repo - Repository name
     * @param ref - Branch name to inspect
     * @returns The commit SHA at the branch tip
     */
    private async resolveRemoteSha(
        octokit: Octokit,
        owner: string,
        repo: string,
        ref: string,
    ): Promise<string> {
        // getBranch returns the branch's HEAD commit, which we use as the version key
        const response = await octokit.rest.repos.getBranch({
            owner,
            repo,
            branch: ref,
        })
        return response.data.commit.sha
    }

    /**
     * Resolves the repo-relative paths changed between two commits.
     *
     * @param params - Octokit client, repo coordinates, and the two SHAs
     * @returns The changed path list and whether the diff is trustworthy
     */
    private async resolveChangedPaths({
        octokit,
        owner,
        repo,
        previousSha,
        newSha,
    }: ResolveChangedPathsParams): Promise<ResolveChangedPathsResult> {
        // first boot: no baseline commit to diff against → caller must full-reseed
        if (!previousSha) {
            return {
                changedPaths: [],
                diffAvailable: false,
            }
        }
        try {
            // compare the two commits; GitHub returns the per-file change list
            const response = await octokit.rest.repos.compareCommitsWithBasehead({
                owner,
                repo,
                basehead: `${previousSha}...${newSha}`,
            })
            // map each changed file entry to its repo-relative path
            const changedPaths = (response.data.files ?? []).map(
                (file) => file.filename,
            )
            return {
                changedPaths,
                diffAvailable: true,
            }
        } catch {
            // history rewrite / missing commit → the diff cannot be trusted → full reseed
            return {
                changedPaths: [],
                diffAvailable: false,
            }
        }
    }

    /**
     * Reads the SHA marker file, returning an empty string when absent.
     *
     * @param markerPath - Absolute path to the marker file
     * @returns The stored SHA, or empty string on first bootstrap
     */
    private async readMarker(markerPath: string): Promise<string> {
        // a missing marker means the root was never populated from the repo
        if (!existsSync(markerPath)) {
            return ""
        }
        // trim to drop any trailing newline written by other tooling
        const content = await readFile(markerPath,
            "utf8")
        return content.trim()
    }

    /**
     * Checks whether the data root already holds repo content (ignoring the marker).
     *
     * @param checkoutRoot - Absolute path of the data root
     * @returns True when at least one non-marker entry exists
     */
    private hasContent(checkoutRoot: string): boolean {
        // a non-existent root obviously has no content yet
        if (!existsSync(checkoutRoot)) {
            return false
        }
        // an empty root (or one holding only the marker) must be repopulated
        return existsSync(join(checkoutRoot,
            "courses"))
    }

    /**
     * Downloads the repo tarball and extracts it into a fresh staging dir.
     *
     * @param params - Octokit client, repo coordinates, and sub-directory
     * @returns The temp dir, the subdir-aware content root, and the entry count
     */
    private async downloadAndExtract({
        octokit,
        owner,
        repo,
        ref,
        subdir,
    }: DownloadAndExtractParams): Promise<DownloadAndExtractResult> {
        // a temp dir holds the raw tarball + the extracted tree (the staging copy)
        const tempDir = await mkdtemp(join(tmpdir(),
            DATA_GIT_TEMP_PREFIX))
        // pull the gzipped tarball through the GitHub API (follows the redirect for us)
        const response = await octokit.rest.repos.downloadTarballArchive({
            owner,
            repo,
            ref,
        })
        // the archive body arrives as an ArrayBuffer — persist it to disk for tar to read
        const tarballPath = join(tempDir,
            "repo.tar.gz")
        await writeFile(tarballPath,
            Buffer.from(response.data as ArrayBuffer))

        // GitHub wraps everything in a single `owner-repo-<sha>/` folder; strip:1 removes it
        const extractDir = join(tempDir,
            "extracted")
        await mkdir(extractDir,
            {
                recursive: true,
            })
        await tar.x({
            file: tarballPath,
            cwd: extractDir,
            strip: 1,
        })

        // the content we care about is either the repo root or a configured sub-directory
        const stagingRoot = subdir
            ? join(extractDir,
                subdir)
            : extractDir
        const entryCount = (await readdir(stagingRoot)).length
        return {
            tempDir,
            stagingRoot,
            entryCount,
        }
    }
}
