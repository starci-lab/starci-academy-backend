import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    readdir,
} from "fs/promises"
import {
    envConfig,
} from "@modules/env"
import {
    clearRuntimeSeedConfig,
    getSeedV2Config,
    setRuntimeSeedConfig,
} from "@modules/filesystem"
import type {
    SeedConfig,
} from "@modules/filesystem"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    SeedScopeService,
    SyncScopeService,
} from "@modules/init/scope"
import {
    SeedersService,
} from "@modules/init/seeders"
import {
    SynchronizersService,
} from "@modules/init/synchronizers"
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
    DataGitSeedScope,
} from "./enums"

/**
 * Boot-time initialization orchestrator — git-sourced variant of {@link InitService}.
 *
 * Pulls the private `data` repo into `.contexts`, then seeds/syncs per the
 * `scope` mode in `seed-v2.yaml` (`all` / `diff` / `none`). The full pipeline
 * config is generated at boot and applied via {@link setRuntimeSeedConfig}, so
 * the shared pipeline scopes itself — no shared-code edits. The legacy
 * `seed.yaml` is left for the legacy InitModule.
 *
 * A fresh `.contexts` (first pull) or an untrustable diff is promoted to `all`.
 */
@Injectable()
export class InitV2Service implements OnModuleInit {

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
     * Pulls `.contexts` from git, resolves the effective seed scope, applies the
     * generated config, then runs the enabled init phases.
     */
    async onModuleInit(): Promise<void> {
        // pull the latest content into .contexts; a failure must NOT crash boot —
        // fall back to seeding whatever local .contexts content already exists
        let result: EnsureDataGitResult | null = null
        try {
            result = await this.dataGitBootstrapService.ensure()
        } catch {
            // ensure() already logged DataGitBootstrapFailed loudly — degrade gracefully
            result = null
        }

        // read the seed MODE from seed-v2.yaml, then resolve the effective scope
        const configured = this.normalizeScope(getSeedV2Config().scope)
        const scope = this.resolveEffectiveScope(result,
            configured)
        // "none" → content is pulled but nothing is seeded/synced
        if (scope === DataGitSeedScope.None) {
            this.logScoped(scope,
                true,
                0,
                0,
                0)
            return
        }

        // "diff" → narrow to changed courses; "all" → every course in .contexts
        let configToApply: SeedConfig
        if (scope === DataGitSeedScope.Diff && result) {
            configToApply = await this.resolveDiffConfig(result)
        } else {
            const courseDisplayIds = await this.listCourseDisplayIds()
            configToApply = this.seedDiffOverlayService.buildFullConfig(courseDisplayIds)
            this.logScoped(scope,
                true,
                courseDisplayIds.length,
                0,
                0)
        }

        // apply the resolved config so the existing pipeline scopes itself
        setRuntimeSeedConfig(configToApply)
        try {
            // phase 1: seed the (scoped) data root into PostgreSQL when enabled
            if (this.seedScopeService.isSeedersEnabled()) {
                await this.seedersService.init()
            }
            // phase 2: project the seeded DB out to CDN + Elasticsearch when enabled
            if (this.syncScopeService.isSynchronizersEnabled()) {
                await this.synchronizersService.init()
            }
        } finally {
            // always drop the in-memory override so later runtime reads see the real config
            clearRuntimeSeedConfig()
        }
    }

    /**
     * Builds the diff-narrowed config; falls back to a full reseed (every course
     * in `.contexts`) when the diff cannot be scoped (unknown paths).
     *
     * @param result - The bootstrap result carrying the changed-path list
     * @returns The config to apply
     */
    private async resolveDiffConfig(
        result: EnsureDataGitResult,
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
            const courseDisplayIds = await this.listCourseDisplayIds()
            this.logScoped(DataGitSeedScope.Diff,
                true,
                courseDisplayIds.length,
                0,
                0)
            return this.seedDiffOverlayService.buildFullConfig(courseDisplayIds)
        }
        this.logScoped(DataGitSeedScope.Diff,
            false,
            courseCount,
            moduleCount,
            domainCount)
        return overlay
    }

    /**
     * Lists the course displayIds present under the `.contexts` courses root.
     *
     * @returns Course displayIds (orderIndex prefix stripped); empty when absent
     */
    private async listCourseDisplayIds(): Promise<Array<string>> {
        try {
            // the courses root lives under the filesystem-context data root (.contexts)
            const entries = await readdir(envConfig().mountPath.data.courses)
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
     * Resolves the effective seed scope from the mode and the bootstrap result.
     *
     * Promotes to {@link DataGitSeedScope.All} on first pull or when a diff is
     * not trustworthy, so the database is never under-seeded.
     *
     * @param result - The bootstrap result, or `null` when the pull failed
     * @param configured - The mode read from `seed-v2.yaml`
     * @returns The scope to actually seed with
     */
    private resolveEffectiveScope(
        result: EnsureDataGitResult | null,
        configured: DataGitSeedScope,
    ): DataGitSeedScope {
        // pull failed → seed the existing local .contexts fully, unless explicitly "none"
        if (!result) {
            return configured === DataGitSeedScope.None
                ? DataGitSeedScope.None
                : DataGitSeedScope.All
        }
        // fresh .contexts (first pull, no prior marker) → must seed everything
        if (result.previousSha === "") {
            return DataGitSeedScope.All
        }
        // explicit "none" / "all" are honored as-is
        if (configured === DataGitSeedScope.None) {
            return DataGitSeedScope.None
        }
        if (configured === DataGitSeedScope.All) {
            return DataGitSeedScope.All
        }
        // configured "diff": a real change we could not diff → promote to full reseed
        if (result.changed && !result.diffAvailable) {
            return DataGitSeedScope.All
        }
        // real diff, or up-to-date (empty diff → seeds nothing) → keep "diff"
        return DataGitSeedScope.Diff
    }

    /**
     * Normalizes the raw `scope` value from `seed-v2.yaml`; unknown values fall
     * back to {@link DataGitSeedScope.All} (the safe, never-under-seed choice).
     *
     * @param raw - The raw `scope` string
     * @returns The matching scope enum
     */
    private normalizeScope(raw: string): DataGitSeedScope {
        switch (raw.trim().toLowerCase()) {
        case DataGitSeedScope.None:
            return DataGitSeedScope.None
        case DataGitSeedScope.Diff:
            return DataGitSeedScope.Diff
        default:
            return DataGitSeedScope.All
        }
    }

    /**
     * Emits the diff-scope summary log line.
     *
     * @param scope - The effective scope mode resolved for this boot
     * @param fullReseed - Whether the scope resolved to a full reseed
     * @param courseCount - Courses kept in scope
     * @param moduleCount - Module order-indexes kept across all courses
     * @param domainCount - Standalone domains kept enabled
     */
    private logScoped(
        scope: DataGitSeedScope,
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
                scope,
            })
    }
}
