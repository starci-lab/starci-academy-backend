import {
    forwardRef,
    Inject,
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    ContentEntity,
} from "@modules/databases"
import {
    ContentParserService,
} from "../parsers"
import {
    ContentPathService,
} from "../path"
import {
    ResolvedFileResult,
    logInitSeederEntitySkipped,
    UpsertService,
} from "../../shared"
import {
    WinstonService,
} from "@modules/winston"
import type {
    ProcessContentsParams,
} from "../types"
import {
    ChallengeProcessorService,
} from "./challenge-processor.service"
import {
    UuidPartitionPersistProcessorService,
} from "./uuid-partition-persist-processor.service"

/**
 * Parses and upserts contents for one module, then nested challenges.
 */
@Injectable()
export class ContentProcessorService {
    constructor(
        private readonly contentParserService: ContentParserService,
        private readonly contentPathService: ContentPathService,
        private readonly winstonService: WinstonService,
        private readonly upsertService: UpsertService,
        private readonly uuidPartitionPersistProcessorService: UuidPartitionPersistProcessorService,
        @Inject(forwardRef(() => ChallengeProcessorService))
        private readonly challengeProcessorService: ChallengeProcessorService,
    ) { }

    /**
     * Parse contents for one module, upsert them, then nested challenges.
     *
     * Uses {@link ResolvedFileResult.relativePath} from parse paths — do not rebuild from DB rows.
     *
     * @param params - Course and module parse results.
     */
    async process(
        params: ProcessContentsParams,
    ): Promise<void> {
        const {
            courseResult,
            moduleResult,
        } = params
        const contentPaths = await this.contentPathService.paths({
            moduleRelativePath: moduleResult.relativePath,
        })
        const moduleId = moduleResult.data.id as string
        const contentResults: Array<ResolvedFileResult<DeepPartial<ContentEntity>>> = []
        for (const path of contentPaths) {
            try {
                const content = await this.contentParserService.parse({
                    paths: contentPaths,
                    contentIndex: path.orderIndex,
                    moduleIndex: moduleResult.index,
                    courseIndex: courseResult.index,
                })
                contentResults.push({
                    data: content,
                    index: path.orderIndex,
                    relativePath: path.relativePath,
                })
            } catch (error) {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    ContentEntity,
                    path.relativePath,
                    error,
                )
            }
        }
        const entities = contentResults.map(
            (contentResult) => {
                const content = contentResult.data
                content.module = {
                    id: moduleId,
                }
                return content
            },
        )
        const partition = await this.upsertService.partitionUuidSync(
            {
                entityClass: ContentEntity,
                entities,
                where: {
                    module: {
                        id: moduleId,
                    },
                },
            },
        )
        await this.uuidPartitionPersistProcessorService.process({
            entityClass: ContentEntity,
            partition,
        })
        const deletedContents = partition.deleteEntities.map(
            (entity) => entity.id as string,
        )
        const filteredContentResults = contentResults.filter(
            (contentResult) => !deletedContents.includes(contentResult.data.id as string),
        )
        for (const contentResult of filteredContentResults) {
            await this.challengeProcessorService.process({
                courseResult,
                moduleResult,
                contentResult,
            })
        }
    }
}
