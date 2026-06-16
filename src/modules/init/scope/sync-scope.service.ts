import {
    Injectable,
} from "@nestjs/common"
import {
    MountFilesystemService,
    type SeedSyncDomainSink,
    type SeedSynchronizersConfig,
} from "@modules/filesystem"
import type {
    SynchronizerSyncScope,
} from "../types"
import type {
    SynchronizerSink,
} from "./types"
import {
    buildCourseIndexFilterByDisplayId,
} from "./utils"

/**
 * Resolves the sync-phase scope from `seed.yaml` (`synchronizers` block).
 *
 * Injectable replacement for the old env-reading `buildCdnSynchronizerSyncScope`
 * / `buildElasticsearchSynchronizerSyncScope` free functions. The synchronizer
 * orchestrator injects this service to build per-sink scopes.
 */
@Injectable()
export class SyncScopeService {

    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
    ) { }

    /** The `synchronizers` block of `seed.yaml`. */
    private synchronizers(): SeedSynchronizersConfig {
        return this.mountFilesystemService.seedConfig().synchronizers
    }

    /** Master switch for the whole sync phase. */
    isSynchronizersEnabled(): boolean {
        return this.synchronizers().enabled
    }

    /**
     * Entity class names whose Elasticsearch index should be DROPPED + re-created
     * before repopulating. Empty = incremental upsert-only sync (no reset).
     */
    reindexEntities(): Array<string> {
        return this.synchronizers().reindex
    }

    /**
     * Resolve a domain's per-sink toggle for one sink. Domains have no `repo` sink
     * (repo is course-code only), so repo always resolves false.
     */
    private domainEnabledForSink(
        domain: SeedSyncDomainSink,
        sink: SynchronizerSink,
    ): boolean {
        if (sink === "cdn") {
            return domain.cdn
        }
        if (sink === "elasticsearch") {
            return domain.elasticsearch
        }
        return false
    }

    /**
     * Build the sync scope for one sink, reading each course track's
     * `modules.<sink>` and `milestones.<sink>` scope value.
     *
     * @param sink - `"cdn"` or `"elasticsearch"`
     * @returns Module + milestone filters plus foundation / headhunting gates
     */
    /** Build the per-course root-entity sync gate from `synchronizers.courses.*.course`. */
    private buildCourseEnabledByDisplayId(): Map<string, boolean> {
        const courseEnabledByDisplayId = new Map<string, boolean>()
        for (const [
            displayId,
            track,
        ] of Object.entries(this.synchronizers().courses)) {
            courseEnabledByDisplayId.set(
                displayId,
                track.course === true,
            )
        }
        return courseEnabledByDisplayId
    }

    private buildScopeForSink(
        sink: SynchronizerSink,
    ): SynchronizerSyncScope {
        const synchronizers = this.synchronizers()
        const courses = synchronizers.courses
        return {
            courseEnabledByDisplayId: this.buildCourseEnabledByDisplayId(),
            moduleIndexFilterByDisplayId: buildCourseIndexFilterByDisplayId(
                courses,
                (track) => track.modules[sink],
            ),
            milestoneIndexFilterByDisplayId: buildCourseIndexFilterByDisplayId(
                courses,
                (track) => track.milestones[sink],
            ),
            foundations: this.domainEnabledForSink(synchronizers.foundations,
                sink),
            headhunting: this.domainEnabledForSink(synchronizers.headhunting,
                sink),
            flashcards: this.domainEnabledForSink(synchronizers.flashcards,
                sink),
            codingProblems: this.domainEnabledForSink(synchronizers.codingProblems,
                sink),
        }
    }

    /** Scope for CDN materialization (S3 JSON). */
    buildCdnScope(): SynchronizerSyncScope {
        return this.buildScopeForSink("cdn")
    }

    /** Scope for Elasticsearch indexing. */
    buildElasticsearchScope(): SynchronizerSyncScope {
        return this.buildScopeForSink("elasticsearch")
    }

    /** Scope for repo code sync (Sandpack file trees → CDN). */
    buildRepoScope(): SynchronizerSyncScope {
        return this.buildScopeForSink("repo")
    }
}
