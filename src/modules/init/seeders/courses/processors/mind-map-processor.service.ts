import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    MindMapParserService,
} from "../parsers"
import {
    logInitSeederEntitySkipped,
} from "../../shared"
import {
    WinstonService,
} from "@modules/winston"
import type {
    ProcessMindMapParams,
} from "../types"

/**
 * Upserts mind-map root on a course when the mount file exists.
 */
@Injectable()
export class MindMapProcessorService {
    constructor(
        private readonly mindMapParserService: MindMapParserService,
        private readonly winstonService: WinstonService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    /**
     * Parse and save course mind-map when present.
     *
     * @param params - Course id and mount relative path.
     */
    async process(
        params: ProcessMindMapParams,
    ): Promise<void> {
        const {
            courseId,
            courseRelativePath,
        } = params
        try {
            const mindMapRoot = await this.mindMapParserService.parse({
                courseRelativePath,
            })
            if (mindMapRoot) {
                await this.entityManager.save(
                    CourseEntity,
                    {
                        id: courseId,
                        mindMapRoot,
                    },
                )
            }
        } catch (error) {
            logInitSeederEntitySkipped(
                this.winstonService,
                CourseEntity,
                `${courseRelativePath}/mind-map.yaml`,
                error,
            )
        }
    }
}
