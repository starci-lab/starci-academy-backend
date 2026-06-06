import {
    Injectable,
} from "@nestjs/common"
import {
    MountFilesystemService,
    type SeedSynchronizersConfig,
} from "@modules/filesystem"
import type {
    SynchronizerSyncScope,
} from "../types"
import {
    buildCourseIndexFilterByDisplayId,
} from "./utils"

/** A synchronizer sink — CDN (S3 JSON), Elasticsearch, or Repo code — scoped independently. */
type SynchronizerSink = "cdn" | "elasticsearch" | "repo"

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
     * Whether to drop + re-create the Elasticsearch indices before repopulating
     * (vs. an incremental upsert-only sync).
     */
    isReIndexEnabled(): boolean {
        return this.synchronizers().reIndex
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
            foundations: synchronizers.foundations,
            headhunting: synchronizers.headhunting,
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
