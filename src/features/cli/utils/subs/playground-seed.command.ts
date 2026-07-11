import {
    CommandRunner, SubCommand,
} from "nest-commander"
import {
    type EntityManager,
} from "typeorm"
import {
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
    PlaygroundEntity,
    PlaygroundStepEntity,
} from "@modules/databases"
import {
    WinstonLog, WinstonService,
} from "@modules/winston"
import type {
    PlaygroundSeedDefinition,
    PlaygroundSeedStepDefinition,
} from "./types"
import {
    PLAYGROUND_SEED_DEFINITIONS,
} from "./constants"

/**
 * Seeds the DevOps Mastery course's "docker" + "kubernetes" playgrounds and
 * their steps. A SIMPLE standalone upsert (not the full markdown-extraction
 * seeder pipeline) — idempotent on `playgrounds.slug` / re-run safe.
 */
@SubCommand({
    name: "playground-seed",
    description: "Seed the DevOps Mastery course's docker/kubernetes playgrounds",
})
export class PlaygroundSeedCommand extends CommandRunner {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly winstonService: WinstonService,
    ) {
        super()
    }

    async run(): Promise<void> {
        const course = await this.entityManager.findOne(
            CourseEntity,
            {
                where: [
                    {
                        displayId: "2-devops-mastery",
                    },
                    {
                        slug: "2-devops-mastery",
                    },
                ],
            },
        )
        if (!course) {
            this.winstonService.log(
                WinstonLog.CommandError,
                {
                    error: "Course '2-devops-mastery' not found — seed the DevOps Mastery course first.",
                },
            )
            process.exit(1)
        }
        for (const [
            sortIndex,
            definition,
        ] of PLAYGROUND_SEED_DEFINITIONS.entries()) {
            await this.upsertPlayground({
                courseId: course.id,
                sortIndex,
                definition,
            })
        }
        this.winstonService.log(
            WinstonLog.CommandSuccess,
            {
                message: `Seeded ${PLAYGROUND_SEED_DEFINITIONS.length} playground(s) for course '2-devops-mastery'.`,
            },
        )
        process.exit(0)
    }

    /** Upserts one playground (by slug) and its steps (by sortIndex). */
    private async upsertPlayground(
        {
            courseId,
            sortIndex,
            definition,
        }: {
            courseId: string
            sortIndex: number
            definition: PlaygroundSeedDefinition
        },
    ): Promise<void> {
        let playground = await this.entityManager.findOne(
            PlaygroundEntity,
            {
                where: {
                    slug: definition.slug,
                },
            },
        )
        if (!playground) {
            playground = this.entityManager.create(
                PlaygroundEntity,
                {
                    slug: definition.slug,
                    title: definition.title,
                    description: definition.description,
                    icon: definition.icon,
                    course: {
                        id: courseId,
                    },
                    sortIndex,
                },
            )
        } else {
            playground.title = definition.title
            playground.description = definition.description
            playground.icon = definition.icon
            playground.course = {
                id: courseId,
            } as CourseEntity
            playground.sortIndex = sortIndex
        }
        await this.entityManager.save(
            PlaygroundEntity,
            playground,
        )
        for (const [
            stepSortIndex,
            step,
        ] of definition.steps.entries()) {
            await this.upsertStep({
                playgroundId: playground.id,
                sortIndex: stepSortIndex,
                step,
            })
        }
    }

    /** Upserts one step (by `playground` + `sortIndex`). */
    private async upsertStep(
        {
            playgroundId,
            sortIndex,
            step,
        }: {
            playgroundId: string
            sortIndex: number
            step: PlaygroundSeedStepDefinition
        },
    ): Promise<void> {
        let entity = await this.entityManager.findOne(
            PlaygroundStepEntity,
            {
                where: {
                    playground: {
                        id: playgroundId,
                    },
                    sortIndex,
                },
            },
        )
        if (!entity) {
            entity = this.entityManager.create(
                PlaygroundStepEntity,
                {
                    playground: {
                        id: playgroundId,
                    },
                    sortIndex,
                },
            )
        }
        entity.title = step.title
        entity.body = step.body
        entity.commandHint = step.commandHint
        entity.verifyResourceKind = step.verifyResourceKind
        entity.verifyResourceNamePattern = step.verifyResourceNamePattern
        entity.verifyExpectedStatus = step.verifyExpectedStatus
        await this.entityManager.save(
            PlaygroundStepEntity,
            entity,
        )
    }
}
