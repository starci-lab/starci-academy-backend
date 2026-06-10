import {
    Injectable,
} from "@nestjs/common"
import {
    MountFilesystemService,
    type SeedSeedersConfig,
} from "@modules/filesystem"
import type {
    CourseSeedScope,
} from "./types"
import {
    buildCourseIndexFilterByDisplayId,
} from "./utils"

/**
 * Resolves the seed-phase scope from `seed.yaml` (`seeders` block).
 *
 * Injectable replacement for the old env-reading `init-seeder-scope` free
 * functions: every domain seeder injects this service to learn whether it is
 * enabled and (for courses) which module/milestone order indexes to seed.
 */
@Injectable()
export class SeedScopeService {

    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
    ) { }

    /** The `seeders` block of `seed.yaml`. */
    private seeders(): SeedSeedersConfig {
        return this.mountFilesystemService.seedConfig().seeders
    }

    /** Master switch for the whole seed phase. */
    isSeedersEnabled(): boolean {
        return this.seeders().enabled
    }

    /** Whether the course pipeline (modules → … → milestones) is enabled. */
    isCoursesSeederEnabled(): boolean {
        return this.seeders().courses.enabled
    }

    /**
     * Whether the course pipeline should seed lesson contents (and nested
     * challenges/lessons). When false, only module shells are upserted.
     */
    isCourseContentsSeederEnabled(): boolean {
        return this.seeders().courses.contents !== false
    }

    /** Whether quiz deck/card seeding is enabled. */
    isCoursesQuizSeederEnabled(): boolean {
        return this.seeders().courses.quiz.enabled
    }

    /** Whether quiz decks link to lesson contents (`quiz_deck_contents`). */
    isCoursesQuizLinkContentsEnabled(): boolean {
        return this.seeders().courses.quiz.linkContents
    }

    /** Whether CV mount seeding is enabled. */
    isCvSeederEnabled(): boolean {
        return this.seeders().cv
    }

    /** Whether foundations mount seeding is enabled. */
    isFoundationsSeederEnabled(): boolean {
        return this.seeders().foundations
    }

    /** Whether headhunting mount seeding is enabled. */
    isHeadhuntingSeederEnabled(): boolean {
        return this.seeders().headhunting
    }

    /** Whether AI model catalog mount sync is enabled. */
    isAiModelsCatalogSeederEnabled(): boolean {
        return this.seeders().aiModels
    }

    /** Whether subscription catalog mount sync is enabled. */
    isSubscriptionsCatalogSeederEnabled(): boolean {
        return this.seeders().subscriptions
    }

    /** Whether coding-problem mount seeding is enabled. */
    isCodingProblemsSeederEnabled(): boolean {
        return this.seeders().codingProblems
    }

    /**
     * Build module + milestone order-index filters from `courses.tracks`.
     * Each course is keyed by `displayId`; an absent displayId is excluded.
     */
    resolveCourseSeedScope(): CourseSeedScope {
        const tracks = this.seeders().courses.tracks
        return {
            moduleIndexFilterByDisplayId: buildCourseIndexFilterByDisplayId(
                tracks,
                (track) => track.modules,
            ),
            milestoneIndexFilterByDisplayId: buildCourseIndexFilterByDisplayId(
                tracks,
                (track) => track.milestones,
            ),
        }
    }
}
