import {
    CommandRunner, SubCommand,
} from "nest-commander"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    PlaygroundStepTranslationEntity,
} from "@modules/databases/postgresql/primary/entities/playground-step-translation.entity"
import {
    PlaygroundStepEntity,
} from "@modules/databases/postgresql/primary/entities/playground-step.entity"
import {
    PlaygroundTranslationEntity,
} from "@modules/databases/postgresql/primary/entities/playground-translation.entity"
import {
    PlaygroundEntity,
} from "@modules/databases/postgresql/primary/entities/playground.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    DeepPartial,
    EntityManager,
} from "typeorm"
import {
    clearRuntimeContextRoot,
    setRuntimeContextRoot,
} from "@modules/filesystem/utils/mount-seed"
import {
    CourseIdFactoryService,
} from "@modules/init/seeders/courses/id-factories/course.service"
import {
    PlaygroundProcessorService,
} from "@modules/init/seeders/courses/processors/playground-processor.service"
import type {
    ResolvedFileResult,
} from "@modules/init/seeders/shared/path/types"
import path from "node:path"
import type {
    PlaygroundSeedTestRowCounts,
} from "./types/playground-seed-test"

/** Course folder ordinal for `courses/2-devops-mastery/` on the mount. */
const DEVOPS_MASTERY_COURSE_INDEX = 2

/** Course folder display id (slug) for `courses/2-devops-mastery/`. */
const DEVOPS_MASTERY_DISPLAY_ID = "devops-mastery"

/** Course folder relative path -- index-prefixed, relative to the `courses` context dir. */
const DEVOPS_MASTERY_RELATIVE_PATH = "2-devops-mastery"

@SubCommand({
    name: "playground-seed-test",
    description: "Test-run the Playground seeder against local .mount/data content (git-free)",
})
/**
 * Test-runs the Playground seeder against local `.mount/data` content, bypassing
 * every git-sourced seed entrypoint (`DataGitBootstrapService` / `InitModule` /
 * `SeedersService`) entirely. Reads the mounted `courses/2-devops-mastery/playgrounds/`
 * tree directly and upserts into Postgres, printing a before/after row-count summary.
 */
export class PlaygroundSeedTestCommand extends CommandRunner {
    constructor(
        private readonly winstonService: WinstonService,
        private readonly playgroundProcessorService: PlaygroundProcessorService,
        private readonly courseIdFactoryService: CourseIdFactoryService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    /**
     * Run the command.
     * @returns void
     */
    async run(): Promise<void> {
        // point every filesystem-context read at the local staging root ONLY --
        // never resolves against the configured git-synced `context.path`
        setRuntimeContextRoot(
            path.resolve(
                process.cwd(),
                ".mount",
                "data",
            ),
        )
        try {
            const courseId = await this.resolveCourseId()

            const before = await this.countRows(courseId)
            this.winstonService.log(
                WinstonLog.CommandSuccess,
                {
                    message: `Row counts BEFORE seeding devops-mastery playgrounds: ${
                        this.formatRowCounts(before)
                    }`,
                },
            )

            const courseResult: ResolvedFileResult<DeepPartial<CourseEntity>> = {
                data: {
                    id: courseId,
                    displayId: DEVOPS_MASTERY_DISPLAY_ID,
                },
                index: DEVOPS_MASTERY_COURSE_INDEX,
                relativePath: DEVOPS_MASTERY_RELATIVE_PATH,
            }
            await this.playgroundProcessorService.process({
                courseResult,
            })

            const after = await this.countRows(courseId)
            this.winstonService.log(
                WinstonLog.CommandSuccess,
                {
                    message: `Row counts AFTER seeding devops-mastery playgrounds: ${
                        this.formatRowCounts(after)
                    } (delta playgrounds=${after.playgrounds - before.playgrounds}, `
                        + `playgroundSteps=${after.playgroundSteps - before.playgroundSteps}, `
                        + "playgroundTranslations="
                        + `${after.playgroundTranslations - before.playgroundTranslations}, `
                        + "playgroundStepTranslations="
                        + `${after.playgroundStepTranslations - before.playgroundStepTranslations})`,
                },
            )
        } catch (error) {
            this.winstonService.log(
                WinstonLog.CommandError,
                {
                    error: error instanceof Error ? error.message : String(error),
                },
            )
            process.exit(1)
        } finally {
            // release the staging-root override no matter what -- a later read (if
            // any) falls back to the configured context path; the override itself
            // only ever pointed at local `.mount/data`, so no git state is touched
            clearRuntimeContextRoot()
        }
        process.exit(0)
    }

    /**
     * Recomputes the deterministic devops-mastery course id and cross-checks it
     * (read-only) against the persisted `courses` row, so a stale hardcoded id
     * never silently seeds playgrounds under the wrong course.
     * @returns The confirmed devops-mastery course id.
     */
    private async resolveCourseId(): Promise<string> {
        const computedId = this.courseIdFactoryService.generate({
            courseIndex: DEVOPS_MASTERY_COURSE_INDEX,
        })
        const existing = await this.entityManager.findOne(
            CourseEntity,
            {
                where: {
                    displayId: DEVOPS_MASTERY_DISPLAY_ID,
                },
            },
        )
        if (!existing) {
            this.winstonService.log(
                WinstonLog.CommandError,
                {
                    error: "No persisted course row with display_id \"devops-mastery\" — "
                        + `seed the course first (computed id: ${computedId}).`,
                },
            )
            process.exit(1)
        }
        if (existing.id !== computedId) {
            this.winstonService.log(
                WinstonLog.CommandError,
                {
                    error: "Computed devops-mastery course id does not match the persisted "
                        + `row (computed: ${computedId}, persisted: ${existing.id}).`,
                },
            )
            process.exit(1)
        }
        return computedId
    }

    /** Formats a row-count snapshot into a single log-friendly string. */
    private formatRowCounts(counts: PlaygroundSeedTestRowCounts): string {
        return `playgrounds=${counts.playgrounds}, `
            + `playgroundSteps=${counts.playgroundSteps}, `
            + `playgroundTranslations=${counts.playgroundTranslations}, `
            + `playgroundStepTranslations=${counts.playgroundStepTranslations}`
    }

    /**
     * Read-only row-count snapshot scoped to the devops-mastery course.
     * @param courseId - The confirmed devops-mastery course id.
     * @returns Row counts for playgrounds, steps, and their translation tables.
     */
    private async countRows(
        courseId: string,
    ): Promise<PlaygroundSeedTestRowCounts> {
        const playgrounds = await this.entityManager.count(
            PlaygroundEntity,
            {
                where: {
                    course: {
                        id: courseId,
                    },
                },
            },
        )
        const playgroundSteps = await this.entityManager.count(
            PlaygroundStepEntity,
            {
                where: {
                    playground: {
                        course: {
                            id: courseId,
                        },
                    },
                },
            },
        )
        const playgroundTranslations = await this.entityManager.count(
            PlaygroundTranslationEntity,
            {
                where: {
                    playground: {
                        course: {
                            id: courseId,
                        },
                    },
                },
            },
        )
        const playgroundStepTranslations = await this.entityManager.count(
            PlaygroundStepTranslationEntity,
            {
                where: {
                    playgroundStep: {
                        playground: {
                            course: {
                                id: courseId,
                            },
                        },
                    },
                },
            },
        )
        return {
            playgrounds,
            playgroundSteps,
            playgroundTranslations,
            playgroundStepTranslations,
        }
    }
}
