import {
    Injectable,
} from "@nestjs/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
    CourseEntity,
    ModuleEntity,
    ContentEntity,
    ChallengeEntity,
} from "@modules/databases"
import {
    MoreThan,
    type EntityManager,
} from "typeorm"
import {
    CdnCourseBuildService,
    CdnModuleBuildService,
    CdnContentBuildService,
    CdnChallengeBuildService,
} from "./builder"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    DayjsService,
} from "@modules/mixin"
import {
    SyncCdnEntityKind
} from "@modules/bullmq"
import {
    S3BucketService
} from "@modules/s3"
import type {
    SynchronizerSyncScope,
} from "../../types"
import {
    shouldSyncChallengeEntity,
    shouldSyncContentEntity,
    shouldSyncCourseEntity,
    shouldSyncModuleEntity,
} from "../../utils"
import {
    buildChallengeCdnSyncSuccessLog,
    buildContentCdnSyncSuccessLog,
    buildCourseCdnSyncSuccessLog,
    buildModuleCdnSyncSuccessLog,
} from "./utils"

/**
 * CDN synchronizer — iterates all entities and calls CDN builder for each.
 */
@Injectable()
export class CdnSynchronizerService {

    constructor(
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly cdnCourseBuildService: CdnCourseBuildService,
        private readonly cdnModuleBuildService: CdnModuleBuildService,
        private readonly cdnContentBuildService: CdnContentBuildService,
        private readonly cdnChallengeBuildService: CdnChallengeBuildService,
        private readonly s3BucketService: S3BucketService,
    ) { }

    /** Entity kinds supported by the CDN synchronizer. */
    private readonly entityKinds: Array<SyncCdnEntityKind> = [
        CourseEntity.name,
        ChallengeEntity.name,
        ContentEntity.name,
        ModuleEntity.name,
    ]

    /**
     * Sync all entities to CDN sequentially.
     */
    async sync(
        scope: SynchronizerSyncScope,
    ): Promise<void> {
        /**
         * Start the CDN synchronization.
         */
        const start = this.dayjsService.now()
        this.winstonService.log(
            WinstonLog.CdnSynchronizerCdnSyncStarted,
            {
                startedAt: start,
            },
        )
        this.winstonService.log(
            WinstonLog.CdnSynchronizerMaterializeStep,
            {
                step: "scope-resolved",
                entityKind: "CdnSynchronizer",
                entityId: "boot",
                detail: JSON.stringify({
                    courses: Array.from(scope.courseEnabledByDisplayId.entries()),
                    modules: scope.moduleIndexFilterByDisplayId
                        ? Array.from(scope.moduleIndexFilterByDisplayId.entries()).map(
                            ([
                                displayId,
                                indexes,
                            ]) => ({
                                displayId,
                                indexes: indexes === null
                                    ? "all"
                                    : Array.from(indexes),
                            }),
                        )
                        : "all",
                }),
            },
        )
        /**
         * Synchronize the entities.
         */
        for (const entityKind of this.entityKinds) {
            this.winstonService.log(
                WinstonLog.CdnSynchronizerEntityKindStarted,
                {
                    entityKind,
                },
            )
            let resumeEntityId: string | null = null
            switch (entityKind) {
            case CourseEntity.name: {
                while (true) {
                    const course = await this.entityManager.findOne(
                        CourseEntity,
                        {
                            where: {
                                ...(
                                    resumeEntityId ? {
                                        id: MoreThan(resumeEntityId)
                                    } : {
                                    }
                                ),
                            },
                            order: {
                                id: "ASC",
                            },
                        },
                    )
                    if (!course) {
                        break
                    }
                    if (!shouldSyncCourseEntity(scope,
                        course)) {
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerEntitySkipped,
                            {
                                entityKind,
                                entityId: course.id,
                                displayId: course.displayId,
                                reason: "course-disabled-or-out-of-scope",
                            },
                        )
                        resumeEntityId = course.id
                        continue
                    }
                    this.winstonService.log(
                        WinstonLog.CdnSynchronizerEntitySyncStarted,
                        {
                            entityKind,
                            entityId: course.id,
                            displayId: course.displayId,
                        },
                    )
                    try {
                        await this.cdnCourseBuildService.materializeAndUpload(
                            course.id,
                        )
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerSyncedSuccessfully,
                            buildCourseCdnSyncSuccessLog(course),
                        )
                    } catch (error) {
                        const errorMessage = error instanceof Error
                            ? error.message
                            : String(error)
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: course.id,
                                errorName: error instanceof Error
                                    ? error.name
                                    : undefined,
                                errorMessage,
                                errorStack: error instanceof Error
                                    ? error.stack
                                    : undefined,
                            }
                        )
                    }
                    resumeEntityId = course.id
                }
                break
            }
            case ChallengeEntity.name: {
                while (true) {
                    const challenge = await this.entityManager.findOne(
                        ChallengeEntity,
                        {
                            where: {
                                ...(resumeEntityId ? {
                                    id: MoreThan(resumeEntityId)
                                } : {
                                }),
                            },
                            relations: {
                                content: {
                                    module: {
                                        course: true,
                                    },
                                },
                            },
                            order: {
                                id: "ASC",
                            },
                        },
                    )
                    if (!challenge) {
                        break
                    }
                    if (!shouldSyncChallengeEntity(scope,
                        challenge)) {
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerEntitySkipped,
                            {
                                entityKind,
                                entityId: challenge.id,
                                displayId: challenge.displayId,
                                reason: "module-out-of-scope",
                            },
                        )
                        resumeEntityId = challenge.id
                        continue
                    }
                    this.winstonService.log(
                        WinstonLog.CdnSynchronizerEntitySyncStarted,
                        {
                            entityKind,
                            entityId: challenge.id,
                            displayId: challenge.displayId,
                        },
                    )
                    try {
                        await this.cdnChallengeBuildService.materializeAndUpload(
                            challenge.id,
                        )
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerSyncedSuccessfully,
                            buildChallengeCdnSyncSuccessLog(challenge),
                        )
                    } catch (error) {
                        const errorMessage = error instanceof Error
                            ? error.message
                            : String(error)
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: challenge.id,
                                errorName: error instanceof Error
                                    ? error.name
                                    : undefined,
                                errorMessage,
                                errorStack: error instanceof Error
                                    ? error.stack
                                    : undefined,
                            }
                        )
                    }
                    resumeEntityId = challenge.id
                }
                break
            }
            case ContentEntity.name: {
                 
                while (true) {
                    const content = await this.entityManager.findOne(
                        ContentEntity,
                        {
                            where: {
                                ...(resumeEntityId ? {
                                    id: MoreThan(resumeEntityId)
                                } : {
                                }),
                            },
                            relations: {
                                module: {
                                    course: true,
                                },
                            },
                            order: {
                                id: "ASC",
                            },
                        },
                    )
                    if (!content) {
                        break
                    }
                    if (!shouldSyncContentEntity(scope,
                        content)) {
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerEntitySkipped,
                            {
                                entityKind,
                                entityId: content.id,
                                displayId: content.displayId,
                                reason: "module-out-of-scope",
                            },
                        )
                        resumeEntityId = content.id
                        continue
                    }
                    this.winstonService.log(
                        WinstonLog.CdnSynchronizerEntitySyncStarted,
                        {
                            entityKind,
                            entityId: content.id,
                            displayId: content.displayId,
                        },
                    )
                    try {
                        await this.cdnContentBuildService.materializeAndUpload(
                            content.id,
                        )
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerSyncedSuccessfully,
                            buildContentCdnSyncSuccessLog(content),
                        )
                    } catch (error) {
                        const errorMessage = error instanceof Error
                            ? error.message
                            : String(error)
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: content.id,
                                errorName: error instanceof Error
                                    ? error.name
                                    : undefined,
                                errorMessage,
                                errorStack: error instanceof Error
                                    ? error.stack
                                    : undefined,
                            }
                        )
                    }
                    resumeEntityId = content.id
                }
                break
            }
            
            case ModuleEntity.name: {
                while (true) {
                    const module = await this.entityManager.findOne(
                        ModuleEntity,
                        {
                            where: {
                                ...(resumeEntityId ? {
                                    id: MoreThan(resumeEntityId)
                                } : {
                                }),
                            },
                            relations: {
                                course: true,
                            },
                            order: {
                                id: "ASC",
                            },
                        },
                    )
                    if (!module) {
                        break
                    }
                    if (!shouldSyncModuleEntity(scope,
                        module)) {
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerEntitySkipped,
                            {
                                entityKind,
                                entityId: module.id,
                                displayId: module.displayId,
                                reason: "module-out-of-scope",
                            },
                        )
                        resumeEntityId = module.id
                        continue
                    }
                    this.winstonService.log(
                        WinstonLog.CdnSynchronizerEntitySyncStarted,
                        {
                            entityKind,
                            entityId: module.id,
                            displayId: module.displayId,
                        },
                    )
                    try {
                        await this.cdnModuleBuildService.materializeAndUpload(
                            module.id,
                        )
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerSyncedSuccessfully,
                            buildModuleCdnSyncSuccessLog(module),
                        )
                    } catch (error) {
                        const errorMessage = error instanceof Error
                            ? error.message
                            : String(error)
                        this.winstonService.log(
                            WinstonLog.CdnSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: module.id,
                                errorName: error instanceof Error
                                    ? error.name
                                    : undefined,
                                errorMessage,
                                errorStack: error instanceof Error
                                    ? error.stack
                                    : undefined,
                            }
                        )
                    }
                    resumeEntityId = module.id
                }
                break
            }
            }
        }
        /**
         * End the CDN synchronization.
         */
        this.winstonService.log(
            WinstonLog.CdnSynchronizerCdnSyncDone,
            {
                doneAt: this.dayjsService.now(),
                durationMs: this.dayjsService.now().diff(
                    start
                ),
            }
        )
    }
}
