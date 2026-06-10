import {
    Injectable,
} from "@nestjs/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
    CourseEntity,
    ModuleEntity,
    ContentEntity,
    ChallengeEntity,
    Locale,
    MilestoneEntity,
    MilestoneTaskEntity,
    FoundationEntity,
    FoundationCategoryEntity,
    ConsultantEntity,
    HeadhuntingCompanyEntity,
    FlashcardDeckEntity,
    CodingProblemEntity,
} from "@modules/databases"
import {
    MoreThan,
    type EntityManager,
} from "typeorm"
import {
    ElasticsearchCourseBuildService,
    ElasticsearchModuleBuildService,
    ElasticsearchContentBuildService,
    ElasticsearchChallengeBuildService,
    ElasticsearchMilestoneBuildService,
    ElasticsearchMilestoneTaskBuildService,
    ElasticsearchFoundationBuildService,
    ElasticsearchFoundationCategoryBuildService,
    ElasticsearchHeadhunterCompanyBuildService,
    ElasticsearchConsultantBuildService,
    ElasticsearchFlashcardDeckBuildService,
    ElasticsearchCodingProblemBuildService,
} from "./builder"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    DayjsService,
} from "@modules/mixin"
import {
    SyncElasticsearchEntityKind
} from "@modules/bullmq"
import {
    ElasticsearchService 
} from "@modules/elasticsearch"
import type {
    SynchronizerSyncScope,
} from "../../types"
import {
    buildChallengeSyncSuccessLog,
    buildContentSyncSuccessLog,
    buildCourseSyncSuccessLog,
    buildModuleSyncSuccessLog,
    shouldSyncChallengeEntity,
    shouldSyncContentEntity,
    shouldSyncCourseEntity,
    shouldSyncMilestoneEntity,
    shouldSyncMilestoneTaskEntity,
    shouldSyncModuleEntity,
    shouldSynchronizerSyncEntityKind,
} from "../../utils"

/**
 * Elasticsearch synchronizer — iterates all entities and calls ES builder for each.
 */
@Injectable()
export class ElasticsearchSynchronizerService {

    constructor(
        private readonly dayjsService: DayjsService,
        private readonly winstonService: WinstonService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly esCourseBuildService: ElasticsearchCourseBuildService,
        private readonly esModuleBuildService: ElasticsearchModuleBuildService,
        private readonly esContentBuildService: ElasticsearchContentBuildService,
        private readonly esChallengeBuildService: ElasticsearchChallengeBuildService,
        private readonly esMilestoneBuildService: ElasticsearchMilestoneBuildService,
        private readonly esMilestoneTaskBuildService: ElasticsearchMilestoneTaskBuildService,
        private readonly esFoundationBuildService: ElasticsearchFoundationBuildService,
        private readonly esFoundationCategoryBuildService: ElasticsearchFoundationCategoryBuildService,
        private readonly esHeadhunterCompanyBuildService: ElasticsearchHeadhunterCompanyBuildService,
        private readonly esHeadhunterBuildService: ElasticsearchConsultantBuildService,
        private readonly esFlashcardDeckBuildService: ElasticsearchFlashcardDeckBuildService,
        private readonly esCodingProblemBuildService: ElasticsearchCodingProblemBuildService,
        private readonly elasticsearchService: ElasticsearchService,
    ) { }

    /** Entity kinds supported by the Elasticsearch synchronizer. */
    private readonly entityKinds: Array<SyncElasticsearchEntityKind> = [
        CourseEntity.name,
        ChallengeEntity.name,
        ContentEntity.name,
        ModuleEntity.name,
        MilestoneEntity.name,
        MilestoneTaskEntity.name,
        FoundationCategoryEntity.name,
        FoundationEntity.name,
        HeadhuntingCompanyEntity.name,
        ConsultantEntity.name,
        FlashcardDeckEntity.name,
        CodingProblemEntity.name,
    ]

    private readonly foundationEntityKinds = [
        FoundationCategoryEntity.name,
        FoundationEntity.name,
    ]

    private readonly headhuntingEntityKinds = [
        HeadhuntingCompanyEntity.name,
        ConsultantEntity.name,
    ]

    private readonly flashcardEntityKinds = [
        FlashcardDeckEntity.name,
    ]

    private readonly codingProblemEntityKinds = [
        CodingProblemEntity.name,
    ]

    /**
     * Sync all entities to Elasticsearch sequentially.
     */
    async sync(
        scope: SynchronizerSyncScope,
    ): Promise<void> {
        /**
         * Start the Elasticsearch synchronization.
         */
        const start = this.dayjsService.now()
        /**
         * Clear then re-index per entity kind (only kinds allowed by scope).
         */
        for (const entityKind of this.entityKinds) {
            if (!shouldSynchronizerSyncEntityKind(
                scope,
                entityKind,
                this.foundationEntityKinds,
                this.headhuntingEntityKinds,
                this.flashcardEntityKinds,
                this.codingProblemEntityKinds,
            )) {
                continue
            }
            for (const locale of Object.values(Locale)) {
                // SCOPED sync: do NOT delete the whole index (that would wipe out-of-scope records,
                // e.g. other courses/modules not selected in the env filter). Instead just ensure the
                // index exists with the explicit mapping patch (additive on an existing index). The
                // re-index loop below then OVERWRITES only the in-scope documents by id, leaving every
                // out-of-scope document untouched.
                await this.elasticsearchService.ensureIndexForEntity(
                    {
                        entity: entityKind,
                        locale,
                    },
                )
            }
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
                        resumeEntityId = course.id
                        continue
                    }
                    try {
                        await this.esCourseBuildService.buildIndexById(
                            course.id,
                        )
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerSyncedSuccessfully,
                            buildCourseSyncSuccessLog(course),
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: course.id,
                                error: error.message,
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
                        resumeEntityId = challenge.id
                        continue
                    }
                    try {
                        await this.esChallengeBuildService.buildIndexById(
                            challenge.id,
                        )
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerSyncedSuccessfully,
                            buildChallengeSyncSuccessLog(challenge),
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: challenge.id,
                                error: error.message,
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
                        resumeEntityId = content.id
                        continue
                    }
                    try {
                        await this.esContentBuildService.buildIndexById(
                            content.id,
                        )
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerSyncedSuccessfully,
                            buildContentSyncSuccessLog(content),
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: content.id,
                                error: error.message,
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
                        resumeEntityId = module.id
                        continue
                    }
                    try {
                        await this.esModuleBuildService.buildIndexById(
                            module.id,
                        )
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerSyncedSuccessfully,
                            buildModuleSyncSuccessLog(module),
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: module.id,
                                error: error.message,
                            }
                        )
                    }
                    resumeEntityId = module.id
                }
                break
            }
            case MilestoneEntity.name: {
                while (true) {
                    const milestone = await this.entityManager.findOne(
                        MilestoneEntity,
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
                    if (!milestone) {
                        break
                    }
                    if (!shouldSyncMilestoneEntity(scope,
                        milestone)) {
                        resumeEntityId = milestone.id
                        continue
                    }
                    try {
                        await this.esMilestoneBuildService.buildIndexById(
                            milestone.id,
                        )
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: milestone.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: milestone.id,
                                error: error.message,
                            }
                        )
                    }
                    resumeEntityId = milestone.id
                }
                break
            }
            case MilestoneTaskEntity.name: {
                while (true) {
                    const milestoneTask = await this.entityManager.findOne(
                        MilestoneTaskEntity,
                        {
                            where: {
                                ...(resumeEntityId ? {
                                    id: MoreThan(resumeEntityId)
                                } : {
                                }),
                            },
                            relations: {
                                milestone: {
                                    course: true,
                                },
                            },
                            order: {
                                id: "ASC",
                            },
                        },
                    )
                    if (!milestoneTask) {
                        break
                    }
                    if (!shouldSyncMilestoneTaskEntity(scope,
                        milestoneTask)) {
                        resumeEntityId = milestoneTask.id
                        continue
                    }
                    try {
                        await this.esMilestoneTaskBuildService.buildIndexById(
                            milestoneTask.id,
                        )
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: milestoneTask.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: milestoneTask.id,
                                error: error.message,
                            }
                        )
                    }
                    resumeEntityId = milestoneTask.id
                }
                break
            }
            case FoundationCategoryEntity.name: {
                while (true) {
                    const category = await this.entityManager.findOne(
                        FoundationCategoryEntity,
                        {
                            where: {
                                ...(resumeEntityId ? {
                                    id: MoreThan(resumeEntityId)
                                } : {
                                }),
                            },
                            order: {
                                id: "ASC",
                            },
                        },
                    )
                    if (!category) {
                        break
                    }
                    try {
                        await this.esFoundationCategoryBuildService.buildIndexById(
                            category.id,
                        )
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: category.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: category.id,
                                error: error.message,
                            }
                        )
                    }
                    resumeEntityId = category.id
                }
                break
            }
            case FoundationEntity.name: {
                while (true) {
                    const foundation = await this.entityManager.findOne(
                        FoundationEntity,
                        {
                            where: {
                                ...(resumeEntityId ? {
                                    id: MoreThan(resumeEntityId)
                                } : {
                                }),
                            },
                            order: {
                                id: "ASC",
                            },
                        },
                    )
                    if (!foundation) {
                        break
                    }
                    try {
                        await this.esFoundationBuildService.buildIndexById(
                            foundation.id,
                        )
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: foundation.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: foundation.id,
                                error: error.message,
                            }
                        )
                    }
                    resumeEntityId = foundation.id
                }
                break
            }
            case HeadhuntingCompanyEntity.name: {
                while (true) {
                    const company = await this.entityManager.findOne(
                        HeadhuntingCompanyEntity,
                        {
                            where: {
                                ...(resumeEntityId ? {
                                    id: MoreThan(resumeEntityId),
                                } : {
                                }),
                            },
                            order: {
                                id: "ASC",
                            },
                        },
                    )
                    if (!company) {
                        break
                    }
                    try {
                        await this.esHeadhunterCompanyBuildService.buildIndexById(
                            company.id,
                        )
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: company.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: company.id,
                                error: error.message,
                            },
                        )
                    }
                    resumeEntityId = company.id
                }
                break
            }
            case ConsultantEntity.name: {
                while (true) {
                    const consultant = await this.entityManager.findOne(
                        ConsultantEntity,
                        {
                            where: {
                                ...(resumeEntityId ? {
                                    id: MoreThan(resumeEntityId),
                                } : {
                                }),
                            },
                            order: {
                                id: "ASC",
                            },
                        },
                    )
                    if (!consultant) {
                        break
                    }
                    try {
                        await this.esHeadhunterBuildService.buildIndexById(
                            consultant.id,
                        )
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: consultant.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: consultant.id,
                                error: error.message,
                            },
                        )
                    }
                    resumeEntityId = consultant.id
                }
                break
            }
            case FlashcardDeckEntity.name: {
                while (true) {
                    const deck = await this.entityManager.findOne(
                        FlashcardDeckEntity,
                        {
                            where: {
                                ...(resumeEntityId ? {
                                    id: MoreThan(resumeEntityId),
                                } : {
                                }),
                            },
                            order: {
                                id: "ASC",
                            },
                        },
                    )
                    if (!deck) {
                        break
                    }
                    try {
                        await this.esFlashcardDeckBuildService.buildIndexById(
                            deck.id,
                        )
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: deck.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: deck.id,
                                error: error.message,
                            },
                        )
                    }
                    resumeEntityId = deck.id
                }
                break
            }
            case CodingProblemEntity.name: {
                while (true) {
                    const problem = await this.entityManager.findOne(
                        CodingProblemEntity,
                        {
                            where: {
                                ...(resumeEntityId ? {
                                    id: MoreThan(resumeEntityId),
                                } : {
                                }),
                            },
                            order: {
                                id: "ASC",
                            },
                        },
                    )
                    if (!problem) {
                        break
                    }
                    try {
                        await this.esCodingProblemBuildService.buildIndexById(
                            problem.id,
                        )
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerSyncedSuccessfully,
                            {
                                entityKind,
                                entityId: problem.id,
                            }
                        )
                    } catch (error) {
                        this.winstonService.log(
                            WinstonLog.EsSynchronizerEntitySyncFailed,
                            {
                                entityKind,
                                entityId: problem.id,
                                error: error.message,
                            },
                        )
                    }
                    resumeEntityId = problem.id
                }
                break
            }
            }
        }

        /**
         * End the Elasticsearch synchronization.
         */
        this.winstonService.log(
            WinstonLog.EsSynchronizerSyncDone,
            {
                doneAt: this.dayjsService.now(),
                durationMs: this.dayjsService.now().diff(
                    start
                ),
            }
        )
    }
}
