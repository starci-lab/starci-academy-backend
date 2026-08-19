import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    readdir,
} from "node:fs/promises"
import {
    join,
} from "node:path"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    clearRuntimeContextRoot,
    clearRuntimeSeedConfig,
    getInitConfig,
    setRuntimeContextRoot,
    setRuntimeSeedConfig,
} from "@modules/filesystem/utils/mount-seed"
import type {
    InitConfig,
    InitScopeMode,
    SeedConfig,
} from "@modules/filesystem/types/seed"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    AssetsService,
} from "@modules/lib/assets/assets.service"
import {
    ContentRagIndexService,
} from "@modules/integrations/rag/content-rag-index.service"
import {
    CvRagIndexService,
} from "@modules/integrations/rag/cv-rag-index.service"
import {
    SeedScopeService,
} from "./scope/seed-scope.service"
import {
    SyncScopeService,
} from "./scope/sync-scope.service"
import {
    SeedersService,
} from "./seeders/seeders.service"
import {
    SynchronizersService,
} from "./synchronizers/synchronizers.service"
import {
    DataGitBootstrapService,
} from "./data-git/data-git.service"
import type {
    EnsureDataGitResult,
} from "./data-git/types/data-git"
import {
    SeedDiffOverlayService,
} from "./diff/seed-config-overlay.service"
import {
    parseDataGitDiff,
} from "./diff/utils/parse-changed-paths"
import {
    InitConfigParserService,
} from "./config/init-config-parser.service"

@Injectable()
/**
 * Boot-time initialization orchestrator -- the canonical, git-sourced init.
 *
 * The flow is always diff-based: resolve the remote `data` repo SHA, download it
 * into a NEW commit snapshot under the data-sources root, compute the file-level
 * diff against the previous snapshot, seed/sync from the new snapshot, then commit
 * it to the manifest (pruning to the retention cap) as the final step. The
 * generated pipeline config is applied via {@link setRuntimeSeedConfig} and the
 * snapshot root via {@link setRuntimeContextRoot}, so the shared pipeline scopes
 * itself -- no shared-code edits. The local-file variant lives in the parked
 * `_init` module ({@link LegacyInitService}).
 *
 * A first pull, a pull failure, or an untrustable diff is promoted to a full
 * reseed so the database is never under-seeded.
 */
export class InitService implements OnModuleInit {

    constructor(
        private readonly dataGitBootstrapService: DataGitBootstrapService,
        private readonly seedDiffOverlayService: SeedDiffOverlayService,
        private readonly initConfigParserService: InitConfigParserService,
        private readonly winstonService: WinstonService,
        private readonly seedScopeService: SeedScopeService,
        private readonly syncScopeService: SyncScopeService,
        private readonly seedersService: SeedersService,
        private readonly synchronizersService: SynchronizersService,
        private readonly assetsService: AssetsService,
        private readonly contentRagIndexService: ContentRagIndexService,
        private readonly cvRagIndexService: CvRagIndexService,
    ) { }

    /**
     * Resolves the remote repo, seeds/syncs from the new snapshot, then commits
     * it to the manifest only after a successful seed.
     */
    async onModuleInit(): Promise<void> {
        // explicit `seed:`/`sync:` blocks drive the pipeline directly; otherwise the
        // coarse `mode` picks all / diff / none (default diff)
        const initConfig = getInitConfig()
        const isExplicit = Boolean(initConfig.seed) || Boolean(initConfig.sync)
        const mode = initConfig.mode ?? "diff"

        if (this.isInitDisabled(initConfig,
            isExplicit,
            mode)) {
            this.logScoped(false,
                0,
                0,
                0)
            return
        }

        // explicit blocks and `mode: all` force a re-seed -> always pull fresh from git
        // so we never seed from a possibly-stale/empty local .contexts (which only
        // carries the marker for diffing). diff mode may still short-circuit below.
        const forceReseed = isExplicit || mode === "all"

        // resolve the remote into a staging copy; a failure must NOT crash boot --
        // fall back to seeding whatever local .contexts content already exists
        let result: EnsureDataGitResult | null = null
        try {
            result = await this.dataGitBootstrapService.ensure(forceReseed)
        } catch {
            // ensure() already logged DataGitBootstrapFailed loudly -- degrade gracefully
            result = null
        }

        // already on the remote SHA -> the DB is current; only short-circuit in diff mode
        if (result && !result.changed && !forceReseed) {
            return
        }

        // seed from the new snapshot when we have one, else the newest local snapshot
        const snapshotRoot = result?.snapshotRoot ?? null
        const configToApply = await this.resolveConfigToApply(
            initConfig,
            isExplicit,
            mode,
            result,
            snapshotRoot,
        )

        if (snapshotRoot) {
            setRuntimeContextRoot(snapshotRoot)
        }
        // apply the resolved config so the existing pipeline scopes itself
        setRuntimeSeedConfig(configToApply)
        // track commit so a failed seed can roll the new snapshot back
        let committed = false
        try {
            // phase 1: seed the (scoped) snapshot into PostgreSQL when enabled
            if (this.seedScopeService.isSeedersEnabled()) {
                await this.seedersService.init()
            }
            await this.runSynchronizersPhase()
            await this.runAssetsMirrorPhase(snapshotRoot)
            await this.runContentRagPhase(snapshotRoot)
            await this.runCvRagPhase(snapshotRoot)
            // success -> record the snapshot in the manifest + prune the oldest
            if (result) {
                await this.dataGitBootstrapService.commitSnapshot(result)
                committed = true
            }
        } finally {
            await this.finalizeInitAttempt(result,
                committed,
                snapshotRoot)
        }
    }

    /**
     * Decides whether init should skip entirely: the master kill-switch
     * (`enable: false`), or no explicit `seed:`/`sync:` block with `mode: none`.
     * @param initConfig - The parsed `seed.yaml`.
     * @param isExplicit - Whether an explicit `seed:`/`sync:` block is present.
     * @param mode - The resolved coarse mode (`all` / `diff` / `none`).
     */
    private isInitDisabled(
        initConfig: InitConfig,
        isExplicit: boolean,
        mode: InitScopeMode,
    ): boolean {
        // master kill-switch: `enable: false` in seed.yaml skips the ENTIRE init --
        // no git pull, no seed, no sync (fastest local boot). Default is enabled.
        if (initConfig.enable === false) {
            return true
        }
        // no explicit blocks AND `mode: none` -> init disabled: skip both phases
        return !isExplicit && mode === "none"
    }

    /**
     * Resolves which seed config to apply: the explicit `seed:`/`sync:` config,
     * a full reseed for `mode: all`, or the diff-narrowed config otherwise.
     */
    private async resolveConfigToApply(
        initConfig: InitConfig,
        isExplicit: boolean,
        mode: InitScopeMode,
        result: EnsureDataGitResult | null,
        snapshotRoot: string | null,
    ): Promise<SeedConfig> {
        if (isExplicit) {
            return this.buildExplicitConfig(initConfig,
                snapshotRoot)
        }
        if (mode === "all") {
            return this.buildAllConfig(snapshotRoot)
        }
        return this.resolveConfig(result,
            snapshotRoot)
    }

    /**
     * Phase 2: project the seeded DB out to CDN + Elasticsearch when enabled.
     * Non-fatal: a projection/ES sync failure (e.g. an ES bulk timeout under
     * memory pressure during reindexAll/indexer/reconcile) must NEVER prevent
     * the HTTP server from coming up. The CDC listeners + lazy projection
     * recompute heal these read-models afterwards (mirrors the asset-sync
     * swallow policy below).
     */
    private async runSynchronizersPhase(): Promise<void> {
        if (!this.syncScopeService.isSynchronizersEnabled()) {
            return
        }
        try {
            await this.synchronizersService.init()
        } catch (error) {
            this.winstonService.log(WinstonLog.InitPhaseFailed,
                {
                    op: "init.synchronizers.failed",
                    error: error instanceof Error ? error.message : String(error),
                })
        }
    }

    /**
     * Phase 2b: mirror the snapshot's STATIC ASSETS (badges, course covers, ...)
     * to MinIO from the SAME fresh snapshot root. AssetsService's own boot
     * hook runs OUTSIDE this window (`getRuntimeContextRoot()` is unset -> it
     * only sees the local `.mount/assets` fallback, which lacks the data-repo
     * assets), so drive it here while the context root points at the freshly
     * pulled snapshot's `assets/`. Non-fatal: a static-asset failure must never
     * roll back a successful seed (mirrors AssetsService's own swallow policy).
     * @param snapshotRoot - The fresh snapshot root, or `null` when there is none.
     */
    private async runAssetsMirrorPhase(
        snapshotRoot: string | null,
    ): Promise<void> {
        if (!snapshotRoot) {
            return
        }
        try {
            const { assets } = await this.assetsService.sync()
            this.winstonService.log(WinstonLog.InitPhaseCompleted,
                {
                    op: "init.assets.mirrored",
                    count: assets.length,
                })
        } catch (error) {
            this.winstonService.log(WinstonLog.InitPhaseFailed,
                {
                    op: "init.assets.failed",
                    error: error instanceof Error ? error.message : String(error),
                })
        }
    }

    /**
     * Phase 2c: build the per-lesson RAG index in Qdrant from the lesson
     * bodies + sandbox code now in MinIO. Runs AFTER the synchronizers phase
     * (so `contents/<id>/<locale>.json` + `repo/.../*.json` exist) and AFTER
     * seed (so contents are enumerable), inside the runtime-context window.
     * Gated behind a flag (embedding every lesson hits the embedding lane +
     * costs boot time on every reseed) and non-fatal (a RAG build failure must
     * never roll back a successful seed -- content-AI chat degrades to whole-body
     * stuffing when the index is absent).
     * @param snapshotRoot - The fresh snapshot root, or `null` when there is none.
     */
    private async runContentRagPhase(
        snapshotRoot: string | null,
    ): Promise<void> {
        if (!snapshotRoot || !envConfig().services.contentRag.enabled) {
            return
        }
        try {
            const { indexed } = await this.contentRagIndexService.build()
            this.winstonService.log(WinstonLog.InitPhaseCompleted,
                {
                    op: "init.content-rag.completed",
                    count: indexed,
                })
        } catch (error) {
            this.winstonService.log(WinstonLog.InitPhaseFailed,
                {
                    op: "init.content-rag.failed",
                    error: error instanceof Error ? error.message : String(error),
                })
        }
    }

    /**
     * Phase 2d: build the CV-authoring reference RAG index (rubrics +
     * skill/metric/etc. catalogs + sample CVs, from `.mount/data/cv/`)
     * into its own persistent `cv_rag` Qdrant collection. Same window +
     * same non-fatal policy as phase 2c -- reuses the content-RAG flag
     * (both are "build a persistent RAG index at init" toggles; a
     * dedicated cvRag flag isn't worth a second env key yet). CV
     * generation degrades to prompt-only (no reference grounding) when
     * this index is absent, same as content-AI chat degrading to
     * whole-body stuffing.
     * @param snapshotRoot - The fresh snapshot root, or `null` when there is none.
     */
    private async runCvRagPhase(
        snapshotRoot: string | null,
    ): Promise<void> {
        if (!snapshotRoot || !envConfig().services.contentRag.enabled) {
            return
        }
        try {
            const { indexed } = await this.cvRagIndexService.build()
            this.winstonService.log(WinstonLog.InitPhaseCompleted,
                {
                    op: "init.cv-rag.completed",
                    count: indexed,
                })
        } catch (error) {
            this.winstonService.log(WinstonLog.InitPhaseFailed,
                {
                    op: "init.cv-rag.failed",
                    error: error instanceof Error ? error.message : String(error),
                })
        }
    }

    /**
     * Unwinds a boot attempt: always drops the runtime overrides, rolls the new
     * snapshot back when the seed didn't commit, and always drops the downloaded
     * tarball temp dir.
     * @param result - The bootstrap result, or `null` when the pull failed.
     * @param committed - Whether the snapshot was committed to the manifest.
     * @param snapshotRoot - The fresh snapshot root, or `null` when there is none.
     */
    private async finalizeInitAttempt(
        result: EnsureDataGitResult | null,
        committed: boolean,
        snapshotRoot: string | null,
    ): Promise<void> {
        // drop the in-memory overrides so later runtime reads see the real config
        clearRuntimeSeedConfig()
        if (snapshotRoot) {
            clearRuntimeContextRoot()
        }
        if (!result) {
            return
        }
        // a failed seed -> discard the new snapshot so the previous stays baseline
        if (!committed) {
            await this.dataGitBootstrapService.rollbackSnapshot(result)
        }
        // always drop the downloaded tarball temp dir
        await this.dataGitBootstrapService.cleanup(result)
    }

    /**
     * Builds the explicit `seed:`/`sync:` config via the init-config parser, fanning
     * a reindex's auto-full-resync across every course under the active root.
     *
     * @param config - The parsed `seed.yaml` (`mode`/`seed`/`sync` blocks)
     * @param stagingRoot - The staging root to enumerate, or `null` for local
     * @returns The expanded seed + sync config
     */
    private async buildExplicitConfig(
        config: InitConfig,
        stagingRoot: string | null,
    ): Promise<SeedConfig> {
        const coursesDir = stagingRoot
            ? join(stagingRoot,
                "courses")
            : envConfig().mountPath.data.courses
        const courseDisplayIds = await this.listCourseDisplayIds(coursesDir)
        const seedConfig = this.initConfigParserService.parse(config,
            courseDisplayIds)
        this.logScoped(false,
            Object.keys(seedConfig.seeders.courses.tracks).length,
            0,
            0)
        return seedConfig
    }

    /**
     * Builds a full-reseed config for every course under the active root and
     * logs the resolved scope. Used by `mode: all` and the diff full-fallback.
     *
     * @param stagingRoot - The staging root to enumerate, or `null` for local
     * @returns The full-scope config
     */
    private async buildAllConfig(
        stagingRoot: string | null,
    ): Promise<SeedConfig> {
        const coursesDir = stagingRoot
            ? join(stagingRoot,
                "courses")
            : envConfig().mountPath.data.courses
        const courseDisplayIds = await this.listCourseDisplayIds(coursesDir)
        this.logScoped(true,
            courseDisplayIds.length,
            0,
            0)
        return this.seedDiffOverlayService.buildFullConfig(courseDisplayIds)
    }

    /**
     * Resolves the pipeline config: a diff-narrowed overlay when a trustworthy
     * diff is available, otherwise a full reseed of every course under the
     * active root (staging copy, or local `.contexts` when the pull failed).
     *
     * @param result - The bootstrap result, or `null` when the pull failed
     * @param stagingRoot - The staging root to seed from, or `null` for local
     * @returns The config to apply
     */
    private async resolveConfig(
        result: EnsureDataGitResult | null,
        stagingRoot: string | null,
    ): Promise<SeedConfig> {
        // first pull / pull failure / untrustable diff -> full reseed (never under-seed)
        const fullReseed = !result
            || result.previousSha === ""
            || !result.diffAvailable
        if (fullReseed) {
            return this.buildAllConfig(stagingRoot)
        }
        // the courses live under the staging root, or under local .contexts
        const coursesDir = stagingRoot
            ? join(stagingRoot,
                "courses")
            : envConfig().mountPath.data.courses
        return this.resolveDiffConfig(result,
            coursesDir)
    }

    /**
     * Builds the diff-narrowed config; falls back to a full reseed (every course
     * under `coursesDir`) when the diff cannot be scoped (unknown paths).
     *
     * @param result - The bootstrap result carrying the changed-path list
     * @param coursesDir - The courses root to enumerate for the fallback reseed
     * @returns The config to apply
     */
    private async resolveDiffConfig(
        result: EnsureDataGitResult,
        coursesDir: string,
    ): Promise<SeedConfig> {
        // turn the raw changed paths into a structured, scopable diff -- the
        // snapshot diff already yields paths relative to the content root, so the
        // subdir prefix is stripped (pass empty), unlike the GitHub-compare format
        const diff = parseDataGitDiff(result.changedPaths,
            "")
        const {
            overlay,
            courseCount,
            moduleCount,
            domainCount,
        } = this.seedDiffOverlayService.buildDiffConfig(diff)
        // an unscopable diff (unknown paths) -> seed every course fully instead
        if (!overlay) {
            const courseDisplayIds = await this.listCourseDisplayIds(coursesDir)
            this.logScoped(true,
                courseDisplayIds.length,
                0,
                0)
            return this.seedDiffOverlayService.buildFullConfig(courseDisplayIds)
        }
        this.logScoped(false,
            courseCount,
            moduleCount,
            domainCount)
        return overlay
    }

    /**
     * Lists the course displayIds present under a courses root.
     *
     * @param coursesDir - Absolute path of the courses root to enumerate
     * @returns Course displayIds (orderIndex prefix stripped); empty when absent
     */
    private async listCourseDisplayIds(coursesDir: string): Promise<Array<string>> {
        try {
            const entries = await readdir(coursesDir)
            return entries
                // keep only `{orderIndex}-{slug}` course dirs (drops markers/placeholders)
                .filter((name) => /^\d+(-|$)/u.test(name))
                // strip the leading `{orderIndex}-` to recover the displayId
                .map((name) => {
                    const match = /^\d+-(.+)$/u.exec(name)
                    return match ? match[1] : name
                })
        } catch {
            // courses root missing (e.g. nothing pulled yet) -> no courses to seed
            return []
        }
    }

    /**
     * Emits the diff-scope summary log line.
     *
     * @param fullReseed - Whether the config resolved to a full reseed
     * @param courseCount - Courses kept in scope
     * @param moduleCount - Module order-indexes kept across all courses
     * @param domainCount - Standalone domains kept enabled
     */
    private logScoped(
        fullReseed: boolean,
        courseCount: number,
        moduleCount: number,
        domainCount: number,
    ): void {
        // surface the resolved scope so ops can see what this boot seeded
        this.winstonService.log(WinstonLog.DataGitDiffScoped,
            {
                fullReseed,
                courseCount,
                moduleCount,
                domainCount,
            })
    }
}
