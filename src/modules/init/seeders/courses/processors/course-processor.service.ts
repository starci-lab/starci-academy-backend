import {
    forwardRef,
    Inject,
    Injectable,
} from "@nestjs/common"
import {
    ContentEntity,
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
            // propagate each module's hard `isPremium` flag down to its contents (logical OR:
            // only ever sets true, so a content's own premium flag is preserved). Runs after
            // contents are upserted so their freshly-seeded flag is the baseline.
            await this.propagateModulePremium(courseId)
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
     * Propagates each premium module's hard `isPremium` flag down to all of its
     * contents. Only ever sets `isPremium = true`, so a content's own premium flag
     * (seeded from its mount) is preserved (logical OR). The module flag is the
     * hard, per-module lock — independent of tier (a display badge) and of
     * `sortIndex` (display ordering only).
     *
     * @param courseId - The course whose contents to gate.
     */
    private async propagateModulePremium(
        courseId: string,
    ): Promise<void> {
        const premiumModules = await this.entityManager.find(ModuleEntity, {
            where: {
                course: {
                    id: courseId,
                },
                isPremium: true,
            },
            select: {
                id: true,
            },
        })
        const premiumModuleIds = premiumModules.map((module) => module.id)
        if (premiumModuleIds.length === 0) {
            return
        }
        await this.entityManager.update(
            ContentEntity,
            {
                module: {
                    id: In(premiumModuleIds),
                },
            },
            {
                isPremium: true,
            },
        )
    }
}
