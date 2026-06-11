import {
    forwardRef,
    Inject,
    Injectable,
} from "@nestjs/common"
import {
    ContentEntity,
    CourseContentTier,
    CourseEntity,
    CourseMetadataEntity,
    InjectPrimaryPostgreSQLEntityManager,
    ModuleEntity,
    PricingPhase,
} from "@modules/databases"
import {
    getAppConfig,
} from "@modules/filesystem"
import {
    In,
} from "typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    UpsertService,
} from "../../shared"
import type {
    ProcessCoursesParams,
} from "../types"
import {
    ModuleProcessorService,
} from "./module-processor.service"
import {
    FlashcardDeckProcessorService,
} from "./flashcard-deck-processor.service"
import {
    MilestoneProcessorService,
} from "./milestone-processor.service"
import {
    UuidPartitionPersistProcessorService,
} from "./uuid-partition-persist-processor.service"

/**
 * Upserts course rows and orchestrates nested module / flashcard / milestone processors.
 */
@Injectable()
export class CourseProcessorService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly upsertService: UpsertService,
        private readonly uuidPartitionPersistProcessorService: UuidPartitionPersistProcessorService,
        @Inject(forwardRef(() => ModuleProcessorService))
        private readonly moduleProcessorService: ModuleProcessorService,
        private readonly flashcardDeckProcessorService: FlashcardDeckProcessorService,
        @Inject(forwardRef(() => MilestoneProcessorService))
        private readonly milestoneProcessorService: MilestoneProcessorService,
    ) { }

    /**
     * For each course: upsert course row, then nested processors.
     *
     * @param params - Parsed courses and seed scope flags.
     */
    async process(
        params: ProcessCoursesParams,
    ): Promise<void> {
        const {
            courseResults,
            moduleIndexFilterByDisplayId,
            flashcardLinkContents,
        } = params
        for (const courseResult of courseResults) {
            const course = courseResult.data
            const courseId = course.id as string
            const courseDisplayId = course.displayId as string
            const partition = await this.upsertService.partitionUuidSync({
                entityClass: CourseEntity,
                entities: [course],
                where: {
                    id: courseId,
                },
            })
            await this.uuidPartitionPersistProcessorService.process({
                entityClass: CourseEntity,
                partition,
            })
            const deletedCourseIds = partition.deleteEntities.map(
                (entity) => entity.id as string,
            )
            if (deletedCourseIds.includes(courseId)) {
                continue
            }
            // seed the operational metadata (current pricing phase) once — never clobber an
            // existing row, since the phase advances over time as the course fills up.
            await this.seedCourseMetadataIfMissing(courseId)
            await this.moduleProcessorService.process({
                courseResult,
                moduleIndexFilterByDisplayId,
                flashcardLinkContents,
            })
            // tier-based paywall: advanced + later-half intermediate modules lock their contents.
            // Runs after contents are upserted (their manual `isPremium` is fresh) and only ever
            // OR-s `isPremium` to true, so a manual premium flag is preserved.
            await this.applyTierPaywall(courseId)
            await this.flashcardDeckProcessorService.process({
                courseResult,
            })
            await this.milestoneProcessorService.process({
                courseResult,
                courseId,
                courseDisplayId,
            })
        }
    }

    /**
     * Create the course's {@link CourseMetadataEntity} with the configured default
     * pricing phase if (and only if) it does not exist yet. An existing row — whose
     * `currentPhase` may have advanced as the course filled — is left untouched.
     *
     * @param courseId - The course to seed metadata for.
     */
    private async seedCourseMetadataIfMissing(
        courseId: string,
    ): Promise<void> {
        // keep an already-seeded / already-advanced phase as-is
        const existing = await this.entityManager.findOne(
            CourseMetadataEntity,
            {
                where: {
                    course: {
                        id: courseId,
                    },
                },
            },
        )
        if (existing) {
            return
        }
        // default from app.yaml (`systemConfig.course.defaultPricingPhase`); Early Bird fallback
        const defaultPhase = getAppConfig().systemConfig.course?.defaultPricingPhase
            ?? PricingPhase.EarlyBird
        await this.entityManager.save(
            this.entityManager.create(
                CourseMetadataEntity,
                {
                    course: {
                        id: courseId,
                    },
                    currentPhase: defaultPhase,
                },
            ),
        )
    }

    /**
     * Applies the tier-based paywall for one course: every content under an
     * advanced module — or under the later half of the intermediate modules — is
     * forced premium. Only ever sets `isPremium = true`, so a manual premium flag
     * set in the mount is preserved (logical OR).
     *
     * @param courseId - The course whose contents to gate.
     */
    private async applyTierPaywall(
        courseId: string,
    ): Promise<void> {
        const modules = await this.entityManager.find(ModuleEntity, {
            where: {
                course: {
                    id: courseId,
                },
            },
            select: {
                id: true,
                orderIndex: true,
                contentTier: true,
            },
            order: {
                orderIndex: "ASC",
            },
        })
        const lockedModuleIds = this.resolveLockedModuleIds(modules)
        if (lockedModuleIds.length === 0) {
            return
        }
        await this.entityManager.update(
            ContentEntity,
            {
                module: {
                    id: In(lockedModuleIds),
                },
            },
            {
                isPremium: true,
            },
        )
    }

    /**
     * Resolves which modules are premium under the tier policy: all `advanced`
     * modules, plus the later half (by `orderIndex`, `ceil(n/2)` onward) of the
     * `intermediate` modules. Foundation modules are never locked.
     *
     * @param modules - The course's modules with their tier + order.
     * @returns The ids of the modules whose contents must be premium.
     */
    private resolveLockedModuleIds(
        modules: Array<Pick<ModuleEntity, "id" | "orderIndex" | "contentTier">>,
    ): Array<string> {
        const advanced = modules.filter(
            (module) => module.contentTier === CourseContentTier.Advanced,
        )
        const intermediate = modules
            .filter((module) => module.contentTier === CourseContentTier.Intermediate)
            .sort((left, right) => left.orderIndex - right.orderIndex)
        // later half is premium: lock from ceil(n/2) onward (n=6 → lock last 3; n=5 → last 2)
        const lockedIntermediate = intermediate.slice(
            Math.ceil(intermediate.length / 2),
        )
        return [
            ...advanced,
            ...lockedIntermediate,
        ].map((module) => module.id)
    }
}
