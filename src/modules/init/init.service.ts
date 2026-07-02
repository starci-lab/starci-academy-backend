import {
    Injectable,
    Logger,
    OnModuleInit,
} from "@nestjs/common"
import {
    readdir,
} from "fs/promises"
import {
    join,
} from "path"
import {
    envConfig,
} from "@modules/env"
import {
    clearRuntimeContextRoot,
    clearRuntimeSeedConfig,
    getInitConfig,
    setRuntimeContextRoot,
    setRuntimeSeedConfig,
} from "@modules/filesystem"
import type {
    InitConfig,
    SeedConfig,
} from "@modules/filesystem"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    AssetsService,
} from "@modules/assets"
import {
    ContentRagIndexService,
    CvRagIndexService,
} from "@modules/rag"
import {
    SeedScopeService,
    SyncScopeService,
} from "./scope"
import {
    SeedersService,
} from "./seeders"
import {
    SynchronizersService,
} from "./synchronizers"
import {
    DataGitBootstrapService,
} from "./data-git"
import type {
    EnsureDataGitResult,
} from "./data-git"
import {
    SeedDiffOverlayService,
    parseDataGitDiff,
} from "./diff"
import {
    InitConfigParserService,
} from "./config"

/**
 * Boot-time initialization orchestrator — the canonical, git-sourced init.
 *
 * The flow is always diff-based: resolve the remote `data` repo SHA, download it
 * into a NEW commit snapshot under the data-sources root, compute the file-level
 * diff against the previous snapshot, seed/sync from the new snapshot, then commit
 * it to the manifest (pruning to the retention cap) as the final step. The
 * generated pipeline config is applied via {@link setRuntimeSeedConfig} and the
 * snapshot root via {@link setRuntimeContextRoot}, so the shared pipeline scopes
 * itself — no shared-code edits. The local-file variant lives in the parked
 * `_init` module ({@link LegacyInitService}).
 *
 * A first pull, a pull failure, or an untrustable diff is promoted to a full
 * reseed so the database is never under-seeded.
 */
@Injectable()
export class InitService implements OnModuleInit {

    /** Scoped logger for the non-fatal post-seed asset mirror. */
    private readonly logger = new Logger(InitService.name)

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

        // master kill-switch: `enable: false` in seed.yaml skips the ENTIRE init —
        // no git pull, no seed, no sync (fastest local boot). Default is enabled.
        if (initConfig.enable === false) {
            this.logScoped(false,
                0,
                0,
                0)
            return
        }

        const isExplicit = Boolean(initConfig.seed) || Boolean(initConfig.sync)
        const mode = initConfig.mode ?? "diff"

        // no explicit blocks AND `mode: none` → init disabled: skip both phases
        if (!isExplicit && mode === "none") {
            this.logScoped(false,
                0,
                0,
                0)
            return
        }

        // explicit blocks and `mode: all` force a re-seed → always pull fresh from git
        // so we never seed from a possibly-stale/empty local .contexts (which only
        // carries the marker for diffing). diff mode may still short-circuit below.
        const forceReseed = isExplicit || mode === "all"

        // resolve the remote into a staging copy; a failure must NOT crash boot —
        // fall back to seeding whatever local .contexts content already exists
        let result: EnsureDataGitResult | null = null
        try {
            result = await this.dataGitBootstrapService.ensure(forceReseed)
        } catch {
            // ensure() already logged DataGitBootstrapFailed loudly — degrade gracefully
            result = null
        }

        // already on the remote SHA → the DB is current; only short-circuit in diff mode
        if (result && !result.changed && !forceReseed) {
            return
        }

        // seed from the new snapshot when we have one, else the newest local snapshot
        const snapshotRoot = result?.snapshotRoot ?? null
        const configToApply = isExplicit
            ? await this.buildExplicitConfig(initConfig,
                snapshotRoot)
            : mode === "all"
                ? await this.buildAllConfig(snapshotRoot)
                : await this.resolveConfig(result,
                    snapshotRoot)

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
            // phase 2: project the seeded DB out to CDN + Elasticsearch when enabled.
            // Non-fatal: a projection/ES sync failure (e.g. an ES bulk timeout under
            // memory pressure during reindexAll/indexer/reconcile) must NEVER prevent
            // the HTTP server from coming up. The CDC listeners + lazy projection
            // recompute heal these read-models afterwards (mirrors the asset-sync
            // swallow policy below).
            if (this.syncScopeService.isSynchronizersEnabled()) {
                try {
                    await this.synchronizersService.init()
                } catch (error) {
                    this.logger.error(
                        `Synchronizers init failed (non-fatal, boot continues): ${error instanceof Error ? error.message : String(error)}`,
                    )
                }
            }
            // phase 2b: mirror the snapshot's STATIC ASSETS (badges, course covers, …)
            // to MinIO from the SAME fresh snapshot root. AssetsService's own boot
            // hook runs OUTSIDE this window (`getRuntimeContextRoot()` is unset → it
            // only sees the local `.mount/assets` fallback, which lacks the data-repo
            // assets), so drive it here while the context root points at the freshly
            // pulled snapshot's `assets/`. Non-fatal: a static-asset failure must never
            // roll back a successful seed (mirrors AssetsService's own swallow policy).
            if (snapshotRoot) {
                try {
                    const { assets } = await this.assetsService.sync()
                    this.logger.log(`Mirrored ${assets.length} snapshot asset(s) to MinIO`)
                } catch (error) {
                    this.logger.error(
                        `Snapshot asset mirror failed: ${error instanceof Error ? error.message : String(error)}`,
                    )
                }
            }
            // phase 2c: build the per-lesson RAG index in Qdrant from the lesson
            // bodies + sandbox code now in MinIO. Runs AFTER the synchronizers phase
            // (so `contents/<id>/<locale>.json` + `repo/.../*.json` exist) and AFTER
            // seed (so contents are enumerable), inside the runtime-context window.
            // Gated behind a flag (embedding every lesson hits the embedding lane +
            // costs boot time on every reseed) and non-fatal (a RAG build failure must
            // never roll back a successful seed — content-AI chat degrades to whole-body
            // stuffing when the index is absent).
            if (snapshotRoot && envConfig().services.contentRag.enabled) {
                try {
                    const { indexed } = await this.contentRagIndexService.build()
                    this.logger.log(`Indexed ${indexed} lesson RAG chunk(s) into Qdrant`)
                } catch (error) {
                    this.logger.error(
                        `Content RAG index build failed: ${error instanceof Error ? error.message : String(error)}`,
                    )
                }
            }
            // phase 2d: build the CV-authoring reference RAG index (rubrics +
            // skill/metric/etc. catalogs + sample CVs, from `.mount/data/cv/`)
            // into its own persistent `cv_rag` Qdrant collection. Same window +
            // same non-fatal policy as phase 2c — reuses the content-RAG flag
            // (both are "build a persistent RAG index at init" toggles; a
            // dedicated cvRag flag isn't worth a second env key yet). CV
            // generation degrades to prompt-only (no reference grounding) when
            // this index is absent, same as content-AI chat degrading to
            // whole-body stuffing.
            if (snapshotRoot && envConfig().services.contentRag.enabled) {
                try {
                    const { indexed } = await this.cvRagIndexService.build()
                    this.logger.log(`Indexed ${indexed} CV RAG chunk(s) into Qdrant`)
                } catch (error) {
                    this.logger.error(
                        `CV RAG index build failed: ${error instanceof Error ? error.message : String(error)}`,
                    )
                }
            }
            // success → record the snapshot in the manifest + prune the oldest
            if (result) {
                await this.dataGitBootstrapService.commitSnapshot(result)
                committed = true
            }
        } finally {
            // drop the in-memory overrides so later runtime reads see the real config
            clearRuntimeSeedConfig()
            if (snapshotRoot) {
                clearRuntimeContextRoot()
            }
            // a failed seed → discard the new snapshot so the previous stays baseline
            if (result && !committed) {
                await this.dataGitBootstrapService.rollbackSnapshot(result)
            }
            // always drop the downloaded tarball temp dir
            if (result) {
                await this.dataGitBootstrapService.cleanup(result)
            }
        }
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
        // first pull / pull failure / untrustable diff → full reseed (never under-seed)
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
        // turn the raw changed paths into a structured, scopable diff — the
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
        // an unscopable diff (unknown paths) → seed every course fully instead
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
                    const match = name.match(/^\d+-(.+)$/u)
                    return match ? match[1] : name
                })
        } catch {
            // courses root missing (e.g. nothing pulled yet) → no courses to seed
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
