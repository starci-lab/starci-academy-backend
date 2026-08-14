import type {
    INestApplication,
} from "@nestjs/common"
import {
    Global,
    Module,
} from "@nestjs/common"
import {
    Test,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    Kafka,
    Partitioners,
} from "kafkajs"
import type {
    Admin,
    Producer,
} from "kafkajs"
import type {
    EntityManager,
} from "typeorm"
import {
    CourseReviewStatsProjectionModule,
} from "@modules/bussiness/projections/course-review-stats/course-review-stats-projection.module"
import {
    ProgressProjectionModule,
} from "@modules/bussiness/projections/progress/progress-projection.module"
import {
    UserXpProjectionModule,
} from "@modules/bussiness/projections/user-xp/user-xp-projection.module"
import {
    POSTGRESQL_PRIMARY,
} from "@modules/databases/postgresql/primary/constants/connection"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    KafkaModule,
} from "@modules/integrations/kafka/kafka.module"
import {
    applyKafkaRequestQueueThrottlePatch,
} from "@modules/integrations/kafka/request-queue-throttle-patch"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    until,
} from "./flow-wait"

const PROGRESS_GROUP = "progress-projection"
const USER_XP_GROUP = "user-xp-projection"

@Global()
@Module({
})
class ProjectionCdcTestDependenciesModule {
    static register() {
        return {
            global: true,
            module: ProjectionCdcTestDependenciesModule,
            providers: [
                {
                    provide: WinstonService,
                    useValue: {
                        log: () => undefined,
                    },
                },
            ],
            exports: [
                WinstonService,
            ],
        }
    }
}

/** Focused production projection graph plus a real Kafka producer at its external CDC boundary. */
export interface ProjectionCdcWorld {
    app: INestApplication
    entityManager: EntityManager
    publishChange: (table: string, row: Record<string, unknown>) => Promise<void>
    close: () => Promise<void>
}

/**
 * Boot only the two representative production listeners. Debezium itself is an
 * external producer: the test publishes the exact post-Unwrap-SMT row value to
 * a real Kafka broker, then observes only the Postgres read model.
 */
export const createProjectionCdcWorld = async (): Promise<ProjectionCdcWorld> => {
    // The producer is opened before Nest constructs KafkaService, so install
    // the same KafkaJS negative-timeout guard here at the earliest boundary.
    applyKafkaRequestQueueThrottlePatch()
    const kafkaConfig = envConfig().kafka
    const kafka = new Kafka({
        clientId: "projection-cdc-e2e-producer",
        brokers: kafkaConfig.brokers,
    })
    const admin = kafka.admin()
    const producer = kafka.producer({
        createPartitioner: Partitioners.DefaultPartitioner,
    })
    const topics = [
        `${kafkaConfig.cdcTopicPrefix}user_contents`,
        `${kafkaConfig.cdcTopicPrefix}user_challenge_submission_attempts`,
        `${kafkaConfig.cdcTopicPrefix}user_milestone_task_attempts`,
        `${kafkaConfig.cdcTopicPrefix}enrollments`,
        `${kafkaConfig.cdcTopicPrefix}course_reviews`,
        `${kafkaConfig.cdcTopicPrefix}xp_histories`,
        `${kafkaConfig.cdcTopicPrefix}users`,
    ]

    await admin.connect()
    await admin.createTopics({
        topics: topics.map((topic) => ({
            topic,
            numPartitions: 1,
        })),
    })
    await producer.connect()

    const moduleRef = await Test.createTestingModule({
        imports: [
            ProjectionCdcTestDependenciesModule.register(),
            PrimaryPostgreSQLModule.register({
                isGlobal: true,
                withHydration: false,
                withResolvers: false,
            }),
            KafkaModule.register({
                isGlobal: true,
            }),
            ProgressProjectionModule.register({
                isGlobal: false,
            }),
            UserXpProjectionModule.register({
                isGlobal: false,
            }),
            CourseReviewStatsProjectionModule.register({
                isGlobal: false,
            }),
        ],
    }).compile()
    const app = moduleRef.createNestApplication()
    await app.init()

    // `consumer.run()` returns before the group has necessarily completed its
    // join. Poll broker state so a fromBeginning:false consumer cannot miss the
    // first CDC record due to a test-start race.
    await waitForConsumerGroups(admin,
        [
            PROGRESS_GROUP,
            USER_XP_GROUP,
        ])

    return {
        app,
        entityManager: app.get<EntityManager>(
            getEntityManagerToken(POSTGRESQL_PRIMARY),
        ),
        publishChange: async (table, row) => {
            await producer.send({
                topic: `${kafkaConfig.cdcTopicPrefix}${table}`,
                messages: [
                    {
                        // Kafka Connect JSON converter with schemas enabled wraps
                        // the standard Debezium change event in `payload`; the
                        // listener must select `after`, never metadata itself.
                        value: JSON.stringify({
                            schema: null,
                            payload: {
                                before: null,
                                after: row,
                                source: {
                                    connector: "postgresql",
                                    name: "starci-e2e",
                                    db: "starci",
                                    schema: "public",
                                    table,
                                },
                                op: "c",
                                ts_ms: Date.now(),
                                transaction: null,
                            },
                        }),
                    },
                ],
            })
        },
        close: async () => {
            await disconnectProducer(producer)
            await admin.disconnect()
            // PrimaryPostgreSQLModule owns a named datasource; Nest TypeORM also
            // installs a default-datasource shutdown hook that may report its
            // intentionally absent token after the named connection is closed.
            await app.close().catch(() => undefined)
        },
    }
}

/** Wait until both production consumer groups have joined the real broker. */
const waitForConsumerGroups = async (
    admin: Admin,
    groupIds: Array<string>,
): Promise<void> => {
    await until(async () => {
        const described = await admin.describeGroups(groupIds)
        return described.groups.every((group) =>
            group.state === "Stable" && group.members.length > 0)
    },
    {
        timeout: 30_000,
        describe: "projection Kafka consumers to join their groups",
    })
}

/** KafkaJS producer disconnect is isolated so app teardown always continues. */
const disconnectProducer = async (producer: Producer): Promise<void> => {
    await producer.disconnect().catch(() => undefined)
}
