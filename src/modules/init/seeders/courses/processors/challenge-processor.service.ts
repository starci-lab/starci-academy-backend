import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ChallengeParserService,
} from "../parsers/challenge.service"
import {
    ChallengePathService,
} from "../path/challenge.service"
import {
    logInitSeederEntitySkipped,
} from "../../shared/log-init-seeder-entity-skipped"
import {
    ResolvedFileResult,
} from "../../shared/path/types"
import {
    UpsertService,
} from "../../shared/upsert/upsert.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import type {
    ProcessChallengesParams,
} from "../types/seeder-orchestration"
import {
    UuidPartitionPersistProcessorService,
} from "./uuid-partition-persist-processor.service"

@Injectable()
/**
 * Parses and upserts challenges for one content mount folder.
 */
export class ChallengeProcessorService {
    constructor(
        private readonly challengeParserService: ChallengeParserService,
        private readonly challengePathService: ChallengePathService,
        private readonly winstonService: WinstonService,
        private readonly upsertService: UpsertService,
        private readonly uuidPartitionPersistProcessorService: UuidPartitionPersistProcessorService,
    ) { }

    /**
     * Parse challenges for one content and upsert PostgreSQL rows.
     *
     * @param params - Course, module, and content parse results.
     */
    async process(
        params: ProcessChallengesParams,
    ): Promise<void> {
        const {
            courseResult,
            moduleResult,
            contentResult,
        } = params
        try {
            const contentId = contentResult.data.id as string
            const challengePaths = await this.challengePathService.paths({
                contentRelativePath: contentResult.relativePath,
            })
            const challengeResults: Array<ResolvedFileResult<DeepPartial<ChallengeEntity>>> = []
            for (const path of challengePaths) {
                try {
                    const challenge = await this.challengeParserService.parse({
                        paths: challengePaths,
                        challengeIndex: path.orderIndex,
                        contentIndex: contentResult.index,
                        moduleIndex: moduleResult.index,
                        courseIndex: courseResult.index,
                    })
                    challengeResults.push({
                        data: challenge,
                        index: path.orderIndex,
                        relativePath: path.relativePath,
                    })
                } catch (error) {
                    logInitSeederEntitySkipped(
                        this.winstonService,
                        ChallengeEntity,
                        path.relativePath,
                        error,
                    )
                }
            }
            const entities = challengeResults.map((challengeResult) => {
                const challenge = challengeResult.data
                challenge.content = {
                    id: contentId,
                    displayId: contentResult.data.displayId as string,
                    module: {
                        displayId: moduleResult.data.displayId as string,
                        course: {
                            displayId: courseResult.data.displayId as string,
                        },
                    },
                }
                return challenge
            })
            const partition = await this.upsertService.partitionUuidSync({
                entityClass: ChallengeEntity,
                entities,
                where: {
                    content: {
                        id: contentId,
                    },
                },
            })
            await this.uuidPartitionPersistProcessorService.process({
                entityClass: ChallengeEntity,
                partition,
            })
        } catch (error) {
            logInitSeederEntitySkipped(
                this.winstonService,
                ChallengeEntity,
                contentResult.relativePath,
                error,
            )
        }
    }
}
