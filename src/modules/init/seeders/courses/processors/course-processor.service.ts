import {
    forwardRef,
    Inject,
    Injectable,
} from "@nestjs/common"
import {
    CourseEntity,
} from "@modules/databases"
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
    QuizDeckProcessorService,
} from "./quiz-deck-processor.service"
import {
    MilestoneProcessorService,
} from "./milestone-processor.service"
import {
    MindMapProcessorService,
} from "./mind-map-processor.service"
import {
    UuidPartitionPersistProcessorService,
} from "./uuid-partition-persist-processor.service"

/**
 * Upserts course rows and orchestrates nested module / quiz / milestone / mind-map processors.
 */
@Injectable()
export class CourseProcessorService {
    constructor(
        private readonly upsertService: UpsertService,
        private readonly uuidPartitionPersistProcessorService: UuidPartitionPersistProcessorService,
        @Inject(forwardRef(() => ModuleProcessorService))
        private readonly moduleProcessorService: ModuleProcessorService,
        private readonly quizDeckProcessorService: QuizDeckProcessorService,
        @Inject(forwardRef(() => MilestoneProcessorService))
        private readonly milestoneProcessorService: MilestoneProcessorService,
        private readonly mindMapProcessorService: MindMapProcessorService,
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
            quizLinkContents,
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
            await this.moduleProcessorService.process({
                courseResult,
                moduleIndexFilterByDisplayId,
                quizLinkContents,
            })
            await this.quizDeckProcessorService.process({
                courseResult,
            })
            await this.milestoneProcessorService.process({
                courseResult,
                courseId,
                courseDisplayId,
            })
            await this.mindMapProcessorService.process({
                courseId,
                courseRelativePath: courseResult.relativePath,
            })
        }
    }
}
