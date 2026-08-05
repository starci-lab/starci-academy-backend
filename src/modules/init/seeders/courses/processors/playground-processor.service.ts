import {
    Injectable,
} from "@nestjs/common"
import {
    PlaygroundEntity,
} from "@modules/databases/postgresql/primary/entities/playground.entity"
import {
    PlaygroundParserService,
} from "../parsers/playground.service"
import {
    logInitSeederEntitySkipped,
} from "../../shared/log-init-seeder-entity-skipped"
import {
    UpsertService,
} from "../../shared/upsert/upsert.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import type {
    ProcessPlaygroundsParams,
} from "../types/seeder-orchestration"
import {
    UuidPartitionPersistProcessorService,
} from "./uuid-partition-persist-processor.service"

@Injectable()
/**
 * Parses and upserts course-level playgrounds (cascading into their ordered steps).
 */
export class PlaygroundProcessorService {
    constructor(
        private readonly playgroundParserService: PlaygroundParserService,
        private readonly winstonService: WinstonService,
        private readonly upsertService: UpsertService,
        private readonly uuidPartitionPersistProcessorService: UuidPartitionPersistProcessorService,
    ) { }

    /**
     * Parse and upsert playgrounds for one course.
     *
     * @param params - Course parse result.
     */
    async process(
        params: ProcessPlaygroundsParams,
    ): Promise<void> {
        const {
            courseResult,
        } = params
        try {
            const courseId = courseResult.data.id as string
            const playgroundResults = await this.playgroundParserService.parseMany({
                courseRelativePath: courseResult.relativePath,
                courseIndex: courseResult.index,
                courseId,
            })
            const partition = await this.upsertService.partitionUuidSync({
                entityClass: PlaygroundEntity,
                entities: playgroundResults.map((playgroundResult) => {
                    const playground = playgroundResult.data
                    playground.course = {
                        id: courseId,
                        displayId: courseResult.data.displayId as string,
                    }
                    return playground
                }),
                where: {
                    course: {
                        id: courseId,
                    },
                },
            })
            await this.uuidPartitionPersistProcessorService.process({
                entityClass: PlaygroundEntity,
                partition,
            })
        } catch (error) {
            logInitSeederEntitySkipped(
                this.winstonService,
                PlaygroundEntity,
                courseResult.relativePath,
                error,
            )
        }
    }
}
