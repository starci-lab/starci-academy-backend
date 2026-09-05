import {
    Injectable,
} from "@nestjs/common"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import type {
    SeedSeedersConfig,
} from "@modules/filesystem/types/seed"
import type {
    CourseSeedScope,
} from "./types"
import {
    buildCourseIndexFilterByDisplayId,
} from "./utils/build-course-index-filter"

@Injectable()
/**
 * Resolves the seed-phase scope from `seed.yaml` (`seeders` block).
 *
 * Injectable replacement for the old env-reading `init-seeder-scope` free
 * functions: every domain seeder injects this service to learn whether it is
 * enabled and (for courses) which module/milestone order indexes to seed.
 */
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

    /** Whether the course pipeline (modules -> ... -> milestones) is enabled. */
    isCoursesSeederEnabled(): boolean {
        return this.seeders().courses.enabled
    }

    /** Whether flashcard deck/card seeding is enabled. */
    isCoursesFlashcardSeederEnabled(): boolean {
        return this.seeders().courses.flashcard.enabled
    }

    /** Whether mock-interview technical bank seeding is enabled. */
    isCoursesInterviewSeederEnabled(): boolean {
        return this.seeders().courses.interview.enabled
    }

    /** Whether standalone concept and section seeding is enabled. */
    isConceptsSeederEnabled(): boolean {
        return this.seeders().concepts
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

    /** Whether advertisement banner mount seeding is enabled. */
    isAdvertisementsSeederEnabled(): boolean {
        return this.seeders().advertisements
    }

    /** Whether changelog mount seeding is enabled. */
    isChangelogSeederEnabled(): boolean {
        return this.seeders().changelog
    }

    /** Whether blog post mount seeding is enabled. */
    isBlogSeederEnabled(): boolean {
        return this.seeders().blog
    }

    /** Whether the achievements catalog seeding is enabled. */
    isAchievementsSeederEnabled(): boolean {
        return this.seeders().achievements
    }

    /** Whether behavioral (global) EQ mock-interview question seeding is enabled. */
    isMockInterviewEqSeederEnabled(): boolean {
        return this.seeders().mockInterviewEq
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
