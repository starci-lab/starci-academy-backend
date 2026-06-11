import {
    Injectable,
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
    getInitScopeConfig,
    setRuntimeContextRoot,
    setRuntimeSeedConfig,
} from "@modules/filesystem"
import type {
    InitCustomScope,
    SeedConfig,
} from "@modules/filesystem"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
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

/**
 * Boot-time initialization orchestrator — the canonical, git-sourced init.
 *
 * The flow is always diff-based: check the remote `data` repo against the local
 * marker, generate the file-level diff, seed/sync from a **staging** copy of the
 * freshly pulled repo, then pull the source into `.contexts` as the final step.
 * The generated pipeline config is applied via {@link setRuntimeSeedConfig} and
 * the staging root via {@link setRuntimeContextRoot}, so the shared pipeline
 * scopes itself — no shared-code edits. The local-file variant lives in the
 * parked `_init` module ({@link LegacyInitService}).
 *
 * A first pull, a pull failure, or an untrustable diff is promoted to a full
 * reseed so the database is never under-seeded.
 */
@Injectable()
export class InitService implements OnModuleInit {

    constructor(
        private readonly dataGitBootstrapService: DataGitBootstrapService,
        private readonly seedDiffOverlayService: SeedDiffOverlayService,
        private readonly winstonService: WinstonService,
        private readonly seedScopeService: SeedScopeService,
        private readonly syncScopeService: SyncScopeService,
        private readonly seedersService: SeedersService,
        private readonly synchronizersService: SynchronizersService,
    ) { }

    /**
     * Resolves the remote repo, seeds/syncs from staging, then materializes
     * `.contexts` only after a successful seed.
     */
    async onModuleInit(): Promise<void> {
        // a non-empty customScope forces seeding an explicit course/foundation set
        // instead of the diff-derived scope (still pulls the source at the end);
        // otherwise the coarse `scope` mode picks all / diff / none (default diff)
        const initScope = getInitScopeConfig()
        const customScope = initScope.customScope
        // custom mode is active when any course is listed OR foundations is toggled on
        const customCourseCount = customScope?.courses
            ? Object.keys(customScope.courses).length
            : 0
        const isCustom = customCourseCount > 0 || customScope?.foundations === true
        const scopeMode = initScope.scope ?? "diff"

        // `scope: none` (and no custom scope) → init disabled: skip both phases
        if (!isCustom && scopeMode === "none") {
            this.logScoped(false,
                0,
                0,
                0)
            return
        }

        // custom mode and `scope: all` force a re-seed → always pull fresh from git
        // so we never seed from a possibly-stale/empty local .contexts (which only
        // carries the marker for diffing). diff mode may still short-circuit below.
        const forceReseed = isCustom || scopeMode === "all"

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

        // seed from the staging copy when we have one, else the local .contexts
        const stagingRoot = result?.stagingRoot ?? null
        const configToApply = isCustom
            ? this.buildCustomConfig(customScope ?? {
            })
            : scopeMode === "all"
                ? await this.buildAllConfig(stagingRoot)
                : await this.resolveConfig(result,
                    stagingRoot)

        if (stagingRoot) {
            setRuntimeContextRoot(stagingRoot)
        }
        // apply the resolved config so the existing pipeline scopes itself
        setRuntimeSeedConfig(configToApply)
        try {
            // phase 1: seed the (scoped) staging root into PostgreSQL when enabled
            if (this.seedScopeService.isSeedersEnabled()) {
                await this.seedersService.init()
            }
            // phase 2: project the seeded DB out to CDN + Elasticsearch when enabled
            if (this.syncScopeService.isSynchronizersEnabled()) {
                await this.synchronizersService.init()
            }
            // success → final step: pull the source into .contexts + re-stamp marker
            if (result) {
                await this.dataGitBootstrapService.materialize(result)
            }
        } finally {
            // drop the in-memory overrides so later runtime reads see the real config
            clearRuntimeSeedConfig()
            if (stagingRoot) {
                clearRuntimeContextRoot()
            }
            // a failed seed skipped materialize → still discard the staging temp
            if (result) {
                await this.dataGitBootstrapService.cleanup(result)
            }
        }
    }

    /**
     * Builds the explicit custom-scope config and logs the resolved scope.
     *
     * @param customScope - The `customScope` block: per-course scope under
     *   `courses` plus the standalone `foundations` toggle
     * @returns The config restricted to the listed courses/tracks (+ foundations)
     */
    private buildCustomConfig(
        customScope: InitCustomScope,
    ): SeedConfig {
        // course count is the only meaningful "scope size" to surface in the log line
        const courseCount = customScope.courses
            ? Object.keys(customScope.courses).length
            : 0
        this.logScoped(false,
            courseCount,
            0,
            0)
        return this.seedDiffOverlayService.buildCustomConfig(customScope)
    }

    /**
     * Builds a full-reseed config for every course under the active root and
     * logs the resolved scope. Used by `scope: all` and the diff full-fallback.
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
        // turn the raw changed paths into a structured, scopable diff
        const diff = parseDataGitDiff(result.changedPaths,
            envConfig().dataGit.subdir)
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
