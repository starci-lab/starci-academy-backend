import {
    CourseTransformerService
} from "@features/api/graphql/utils"
import {
    Sha256Service
} from "@modules/crypto"
import {
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
    LivestreamSessionEntity,
    Locale,
    PrerequisiteEntity,
    PricingPhaseEntity,
    QnaEntity,
    ValuePropositionEntity,
    ModuleEntity,
    ContentEntity,
    PreviewContentEntity,
    LessonVideoEntity,
    ChallengeEntity,
} from "@modules/databases"
import {
    envConfig
} from "@modules/env"
import {
    CourseNotFoundException
} from "@modules/exceptions"
import {
    AsyncService,
    InjectSuperJson
} from "@modules/mixin"
import {
    S3NameResolverService,
    S3Provider,
    S3UploadService,
    UploadPayload
} from "@modules/s3"
import {
    WinstonLog,
    WinstonService
} from "@modules/winston"
import {
    Inject,
    Injectable,
    Scope
} from "@nestjs/common"
import {
    REQUEST
} from "@nestjs/core"
import _ from "lodash"
import SuperJSON from "superjson"
import {
    EntityManager
} from "typeorm"
import type {
    CourseRuntimeContextRequest
} from "./types"

@Injectable({
    scope: Scope.REQUEST,
    durable: true,
})
export class CourseRuntimeContextService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @Inject(REQUEST)
        private readonly request: CourseRuntimeContextRequest,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly asyncService: AsyncService,
        private readonly sha256Service: Sha256Service,
        private readonly s3UploadService: S3UploadService,
        private readonly s3NameResolverService: S3NameResolverService,
        private readonly winstonService: WinstonService,
        private readonly courseTransformer: CourseTransformerService,
    ) { }

    /**
     * Run the sync cycle.
     */
    async run() {
        setInterval(
            async () => {
                await this.asyncService.safeRun(
                    async () => {
                        await this.process()
                    },
                )
            },
            envConfig().services.cdnSynchronizer.syncIntervalMs.courses.runtime,
        )
    }

    /**
     * Sync the course to the CDN.
     */
    async process() {
        let objectKey: string | undefined
        try {
            // take the course
            const course = await this.entityManager.findOne(
                CourseEntity,
                {
                    where: {
                        id: this.request.id,
                    },
                    relations: {
                        translations: true,
                        metadata: true,
                    },
                },
            )
            if (!course) {
                throw new CourseNotFoundException(
                    {
                        id: this.request.id,
                    },
                )
            }
            const plainCourse = course.toPlain<CourseEntity>()

            // 1. Prerequisites
            const prerequisites = await this.entityManager.find(
                PrerequisiteEntity,
                {
                    where: {
                        course: {
                            id: plainCourse.id,
                        },
                    },
                    relations: {
                        translations: true,
                    },
                },
            )

            // 2. Value Propositions
            const valuePropositions = await this.entityManager.find(
                ValuePropositionEntity,
                {
                    where: {
                        course: {
                            id: plainCourse.id,
                        },
                    },
                    relations: {
                        translations: true,
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            )

            // 3. QnAs
            const qnas = await this.entityManager.find(
                QnaEntity,
                {
                    where: {
                        course: {
                            id: plainCourse.id,
                        },
                    },
                    relations: {
                        translations: true,
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            )

            // 4. Pricing Phases
            const pricingPhases = await this.entityManager.find(
                PricingPhaseEntity,
                {
                    where: {
                        course: {
                            id: plainCourse.id,
                        },
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            )

            // 5. Livestream Sessions
            const livestreamSessions = await this.entityManager.find(
                LivestreamSessionEntity,
                {
                    where: {
                        course: {
                            id: plainCourse.id,
                        },
                    },
                    relations: {
                        translations: true,
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            )

            // 6. Modules and their deep nested entities for CDN hydration
            const modules = await this.entityManager.find(
                ModuleEntity,
                {
                    where: {
                        course: {
                            id: plainCourse.id,
                        },
                    },
                    relations: {
                        translations: true,
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            )

            const hydratedModules = await Promise.all(
                modules.map(
                    async (
                        m,
                    ) => {
                        const pm = m.toPlain<ModuleEntity>()

                        // Nested: Content (including lessons and challenges)
                        const contents = await this.entityManager.find(
                            ContentEntity,
                            {
                                where: {
                                    module: {
                                        id: pm.id,
                                    },
                                },
                                relations: {
                                    translations: true,
                                    lessons: {
                                        translations: true,
                                    },
                                    challenges: {
                                        translations: true,
                                    },
                                },
                                order: {
                                    orderIndex: "ASC",
                                },
                            },
                        )
                        pm.contents = contents.map(
                            (
                                c,
                            ) => {
                                const pc = c.toPlain<ContentEntity>()
                                pc.lessons = c.lessons?.map(l => l.toPlain<LessonVideoEntity>())
                                pc.challenges = c.challenges?.map(ch => ch.toPlain<ChallengeEntity>())
                                return pc
                            },
                        )

                        // Nested: Preview Content
                        const previewContents = await this.entityManager.find(
                            PreviewContentEntity,
                            {
                                where: {
                                    module: {
                                        id: pm.id,
                                    },
                                },
                                relations: {
                                    translations: true,
                                },
                                order: {
                                    orderIndex: "ASC",
                                },
                            },
                        )
                        pm.previewContents = previewContents.map(
                            (
                                pc,
                            ) => {
                                return pc.toPlain<PreviewContentEntity>()
                            },
                        )



                        return pm
                    },
                ),
            )

            plainCourse.prerequisites = prerequisites?.map(
                (
                    p,
                ) => {
                    return p.toPlain<PrerequisiteEntity>()
                },
            )
            plainCourse.valuePropositions = valuePropositions?.map(
                (
                    v,
                ) => {
                    return v.toPlain<ValuePropositionEntity>()
                },
            )
            plainCourse.qnas = qnas?.map(
                (
                    q,
                ) => {
                    return q.toPlain<QnaEntity>()
                },
            )
            plainCourse.pricingPhases = pricingPhases?.map(
                (
                    p,
                ) => {
                    return p.toPlain<PricingPhaseEntity>()
                },
            )
            plainCourse.livestreamSessions = livestreamSessions?.map(
                (
                    l,
                ) => {
                    return l.toPlain<LivestreamSessionEntity>()
                },
            )
            plainCourse.modules = hydratedModules

            // Multi-locale Sync
            const locales = [
                Locale.Vi,
                Locale.En,
            ]
            await Promise.all(
                locales.map(
                    async (
                        locale,
                    ) => {
                        const hydratedCourse = _.cloneDeep(
                            plainCourse,
                        )

                        // transform the entire tree
                        this.courseTransformer.transform(
                            hydratedCourse,
                            locale,
                        )

                        // upload to CDN
                        const data = this.superJson.stringify(
                            hydratedCourse,
                        )
                        const hash = this.sha256Service.hash(
                            data,
                        )
                        const payload: UploadPayload = {
                            data,
                            hash,
                        }

                        objectKey = this.s3NameResolverService.course(
                            hydratedCourse.displayId,
                            locale,
                        )
                        await this.s3UploadService.json(
                            {
                                name: objectKey,
                                payload,
                                acl: "private",
                                providers: [
                                    S3Provider.DigitalOcean,
                                    S3Provider.Minio,
                                ],
                            },
                        )
                    },
                ),
            )
        } catch (error) {
            this.winstonService.log(
                WinstonLog.CdnSynchronizerCourseRuntimeSyncFailed,
                {
                    id: this.request.id,
                    providers: [
                        S3Provider.DigitalOcean,
                        S3Provider.Minio,
                    ],
                    error: error.message,
                    context: CourseRuntimeContextService.name,
                },
            )
        }
    }
}