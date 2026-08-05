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
    DATA_GIT_MANIFEST_FILE,
    DATA_GIT_MAX_SNAPSHOTS,
    DATA_GIT_TEMP_PREFIX,
} from "./constants"
import {
    diffSnapshots,
} from "./utils"
import type {
    DownloadAndExtractParams,
    DownloadAndExtractResult,
    EnsureDataGitResult,
    SnapshotManifest,
} from "./types"

@Injectable()
/**
 * Materializes the private `data` GitHub repo into a versioned snapshot store.
 *
 * The data-sources root keeps up to {@link DATA_GIT_MAX_SNAPSHOTS} commit
 * snapshots, each a full tree named by its commit SHA, ordered by a
 * `manifest.json`. On boot it resolves the remote SHA; if it differs from the
 * newest local snapshot it downloads the repo tarball into a NEW `<sha>/` dir and
 * computes the diff by comparing the new snapshot against the previous one on
 * disk (no GitHub compare API, so it survives force-pushes/history rewrites).
 *
 * The orchestrator seeds/syncs from the new snapshot, then calls
 * {@link commitSnapshot} to record it in the manifest + prune the oldest — or
 * {@link rollbackSnapshot} on failure, leaving the previous snapshot as the
 * baseline so a failed seed never corrupts the source.
 *
 * @example
 * const result = await dataGitBootstrapService.ensure()
 * // ...seed from result.snapshotRoot...
 * await dataGitBootstrapService.commitSnapshot(result)
 */
export class DataGitBootstrapService {
    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Resolves the remote `data` repo into a fresh snapshot and computes the diff.
     *
     * Does NOT touch the manifest — call {@link commitSnapshot} after a successful
     * seed to record + prune, or {@link rollbackSnapshot} to discard the snapshot.
     *
     * @param forceDownload - When true (forced reseed: `mode: all` / explicit seed:/sync:),
     * always download a fresh snapshot even if the newest local SHA matches.
     * @returns The remote SHA, the changed-path diff, and the new snapshot location
     */
    async ensure(forceDownload = false): Promise<EnsureDataGitResult> {
        // read repo coordinates from env so ops can repoint per-environment
        const {
            owner,
            repo,
            ref: configuredRef,
            subdir,
        } = envConfig().dataGit
        // resolve the root that holds every commit snapshot + the manifest
        const datasourcesRoot = this.resolveDatasourcesRoot()
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
            // the manifest's tail is the newest snapshot the app last seeded from
            const manifest = await this.readManifest(datasourcesRoot)
            const previousSha = manifest.snapshots.at(-1)?.sha ?? ""
            const previousSnapshotRoot = previousSha
                ? join(datasourcesRoot,
                    previousSha)
                : null

            // skip the download when the newest snapshot already holds this commit —
            // diff mode only; a forced reseed must always pull fresh from git
            if (
                !forceDownload
                && previousSha === remoteSha
                && previousSnapshotRoot
                && this.hasContent(previousSnapshotRoot)
            ) {
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
                    changedPaths: [],
                    diffAvailable: false,
                    // up to date → seed from the existing newest snapshot if forced
                    snapshotRoot: previousSnapshotRoot,
                    datasourcesRoot,
                    tempDir: null,
                }
            }

            // download + extract into a staging dir, then place it as the new snapshot
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
            const snapshotRoot = join(datasourcesRoot,
                remoteSha)
            await this.placeSnapshot(stagingRoot,
                snapshotRoot)

            // compute the diff against the previous snapshot on disk; a first pull
            // (or a re-pull of the same SHA) has no trustworthy baseline → full reseed
            let changedPaths: Array<string> = []
            let diffAvailable = false
            if (
                previousSnapshotRoot
                && previousSha !== remoteSha
                && this.hasContent(previousSnapshotRoot)
            ) {
                changedPaths = await diffSnapshots(previousSnapshotRoot,
                    snapshotRoot)
                diffAvailable = true
            }

            return {
                changed: true,
                sha: remoteSha,
                previousSha,
                changedPaths,
                diffAvailable,
                snapshotRoot,
                datasourcesRoot,
                tempDir,
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
     * Records the new snapshot in the manifest and prunes the oldest beyond the
     * retention cap — the final "commit source" step, run only after a successful
     * seed/sync. No-op when the run was up to date (nothing new was downloaded).
     *
     * @param result - The {@link ensure} result carrying the new snapshot
     */
    async commitSnapshot(
        result: EnsureDataGitResult,
    ): Promise<void> {
        // up to date / pull failed → no new snapshot to record
        if (!result.changed || !result.snapshotRoot) {
            return
        }
        const {
            owner,
            repo,
            ref,
        } = envConfig().dataGit
        const manifest = await this.readManifest(result.datasourcesRoot)
        // append unless the newest entry is already this SHA (forced re-pull)
        if (manifest.snapshots.at(-1)?.sha !== result.sha) {
            manifest.snapshots.push({
                sha: result.sha,
                pulledAt: new Date().toISOString(),
            })
        }
        // prune the oldest snapshots beyond the cap (dir + manifest entry)
        const retained = await this.pruneSnapshots(result.datasourcesRoot,
            manifest)
        await this.writeManifest(result.datasourcesRoot,
            manifest)
        // surface the old → new transition (the "source committed" signal)
        this.winstonService.log(WinstonLog.DataGitBootstrapUpdated,
            {
                owner,
                repo,
                ref,
                previousSha: result.previousSha,
                newSha: result.sha,
                entryCount: retained,
                checkoutRoot: result.snapshotRoot,
            })
    }

    /**
     * Discards the snapshot a failed seed produced so the previous snapshot stays
     * the manifest baseline; safe to call multiple times.
     *
     * @param result - The {@link ensure} result carrying the new snapshot
     */
    async rollbackSnapshot(
        result: EnsureDataGitResult,
    ): Promise<void> {
        // never delete a snapshot that is already the recorded baseline (up-to-date run)
        if (!result.changed || !result.snapshotRoot) {
            return
        }
        await rm(result.snapshotRoot,
            {
                recursive: true, force: true,
            })
    }

    /**
     * Removes the staging temp dir holding the downloaded tarball; safe to call
     * multiple times.
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
     * Resolves the data-sources root — the path of the first enabled filesystem
     * context, under which every commit snapshot + the manifest live.
     *
     * @returns Absolute path of the filesystem-context data-sources root
     */
    private resolveDatasourcesRoot(): string {
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
     * Reads the snapshot manifest, returning an empty manifest when absent/corrupt.
     *
     * @param datasourcesRoot - Absolute path of the data-sources root
     * @returns The parsed manifest, or an empty one on first boot
     */
    private async readManifest(datasourcesRoot: string): Promise<SnapshotManifest> {
        const manifestPath = join(datasourcesRoot,
            DATA_GIT_MANIFEST_FILE)
        // a missing manifest means no snapshot has ever been committed
        if (!existsSync(manifestPath)) {
            return {
                snapshots: [],
            }
        }
        try {
            const parsed = JSON.parse(await readFile(manifestPath,
                "utf8")) as SnapshotManifest
            // tolerate hand-edits / partial writes — only trust a well-formed array
            return Array.isArray(parsed?.snapshots)
                ? parsed
                : {
                    snapshots: [],
                }
        } catch {
            // a corrupt manifest must not crash boot — treat it as a fresh store
            return {
                snapshots: [],
            }
        }
    }

    /**
     * Writes the manifest back to disk (creating the data-sources root if needed).
     *
     * @param datasourcesRoot - Absolute path of the data-sources root
     * @param manifest - The manifest to persist
     */
    private async writeManifest(
        datasourcesRoot: string,
        manifest: SnapshotManifest,
    ): Promise<void> {
        await mkdir(datasourcesRoot,
            {
                recursive: true,
            })
        await writeFile(join(datasourcesRoot,
            DATA_GIT_MANIFEST_FILE),
        JSON.stringify(manifest,
            null,
            2),
        "utf8")
    }

    /**
     * Prunes the oldest snapshots beyond {@link DATA_GIT_MAX_SNAPSHOTS}, mutating
     * the manifest in place and deleting the dropped dirs (never a retained SHA).
     *
     * @param datasourcesRoot - Absolute path of the data-sources root
     * @param manifest - The manifest to trim (mutated)
     * @returns The number of snapshots retained
     */
    private async pruneSnapshots(
        datasourcesRoot: string,
        manifest: SnapshotManifest,
    ): Promise<number> {
        if (manifest.snapshots.length <= DATA_GIT_MAX_SNAPSHOTS) {
            return manifest.snapshots.length
        }
        // drop from the head (oldest); keep the newest DATA_GIT_MAX_SNAPSHOTS
        const dropCount = manifest.snapshots.length - DATA_GIT_MAX_SNAPSHOTS
        const dropped = manifest.snapshots.splice(0,
            dropCount)
        const retainedShas = new Set(manifest.snapshots.map((entry) => entry.sha))
        for (const entry of dropped) {
            // guard against deleting a dir that a retained entry still points at
            if (retainedShas.has(entry.sha)) {
                continue
            }
            await rm(join(datasourcesRoot,
                entry.sha),
            {
                recursive: true, force: true,
            })
        }
        return manifest.snapshots.length
    }

    /**
     * Places a freshly-extracted staging tree as the snapshot dir for a SHA,
     * replacing any stale dir from an earlier failed run.
     *
     * @param stagingRoot - Absolute path of the extracted content root
     * @param snapshotRoot - Absolute path of the target `<datasourcesRoot>/<sha>` dir
     */
    private async placeSnapshot(
        stagingRoot: string,
        snapshotRoot: string,
    ): Promise<void> {
        // a partial dir from a prior crash must not bleed into the new snapshot
        await rm(snapshotRoot,
            {
                recursive: true, force: true,
            })
        await mkdir(join(snapshotRoot,
            ".."),
        {
            recursive: true,
        })
        await cp(stagingRoot,
            snapshotRoot,
            {
                recursive: true,
            })
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
     * Checks whether a snapshot dir already holds repo content.
     *
     * @param snapshotRoot - Absolute path of a snapshot dir
     * @returns True when the snapshot holds a `courses` tree
     */
    private hasContent(snapshotRoot: string): boolean {
        // a non-existent dir obviously has no content yet
        if (!existsSync(snapshotRoot)) {
            return false
        }
        // an empty dir must be repopulated — every valid data tree has courses/
        return existsSync(join(snapshotRoot,
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
