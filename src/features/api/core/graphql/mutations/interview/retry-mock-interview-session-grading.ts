import {
    Injectable, UseGuards, UseInterceptors
} from "@nestjs/common"
import {
    Args, Field, ID, InputType, Int, Mutation, ObjectType, Resolver
} from "@nestjs/graphql"
import {
    EntityManager
} from "typeorm"
import {
    KeycloakAuthGraphQLGuard
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    UserEntity
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    MockInterviewSessionEntity
} from "@modules/databases/postgresql/primary/entities/mock-interview-session.entity"
import {
    MockInterviewGradingJobEntity
} from "@modules/databases/postgresql/primary/entities/mock-interview-grading-job.entity"
import {
    InjectPrimaryPostgreSQLEntityManager
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    AbstractGraphQLResponse
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    GraphQLTransformInterceptor
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    MockInterviewSessionConflictException,
} from "@modules/platform/exceptions/errors/ai/mock-interview-session-conflict"

@InputType()
/** Optimistic learner request to retry a terminally failed grading job. */
export class RetryMockInterviewSessionGradingRequest {
    @Field(() => ID)
        courseId: string
    @Field(() => ID)
        sessionId: string
    @Field(() => Int)
        expectedRevision: number
}

@ObjectType()
/** Durable state returned after a grading retry is accepted. */
export class RetryMockInterviewSessionGradingData {
    @Field(() => ID)
        sessionId: string
    @Field(() => ID)
        gradingJobId: string
    @Field(() => String)
        status: string
    @Field(() => Int)
        revision: number
}

@ObjectType()
/** GraphQL envelope for mock-interview grading retry. */
export class RetryMockInterviewSessionGradingResponse extends AbstractGraphQLResponse {
    @Field(() => RetryMockInterviewSessionGradingData,
        {
            nullable: true
        })
        data: RetryMockInterviewSessionGradingData
}

@Injectable()
/** Requeues an owned grading_failed session while enforcing its bounded retry budget. */
export class RetryMockInterviewSessionGradingService {
    constructor(@InjectPrimaryPostgreSQLEntityManager() private readonly entityManager: EntityManager) {}

    async execute(request: RetryMockInterviewSessionGradingRequest, userId: string): Promise<RetryMockInterviewSessionGradingData> {
        return this.entityManager.transaction(async (manager) => {
            const session = await manager.createQueryBuilder(MockInterviewSessionEntity,
                "session")
                .innerJoin("session.enrollment",
                    "enrollment")
                .setLock("pessimistic_write")
                .where("session.id = :sessionId",
                    {
                        sessionId: request.sessionId
                    })
                .andWhere("enrollment.user_id = :userId",
                    {
                        userId
                    })
                .andWhere("enrollment.course_id = :courseId",
                    {
                        courseId: request.courseId
                    })
                .getOne()
            const job = session
                ? await manager.findOne(MockInterviewGradingJobEntity,
                    {
                        where: {
                            sessionId: session.id
                        }, lock: {
                            mode: "pessimistic_write"
                        }
                    })
                : null
            if (!session || !job || session.status !== "grading_failed" || session.revision !== request.expectedRevision || job.attemptCount >= job.maxAttempts) {
                throw new MockInterviewSessionConflictException({
                    reason: "grading_retry_rejected",
                    sessionId: request.sessionId,
                    status: session?.status,
                    revision: session?.revision,
                })
            }
            session.status = "grading"
            session.revision += 1
            job.status = "queued"
            job.availableAt = new Date()
            job.leaseToken = null
            job.leaseExpiresAt = null
            job.lastError = null
            await manager.save([session,
                job])
            return {
                sessionId: session.id, gradingJobId: job.id, status: session.status, revision: session.revision
            }
        })
    }
}

@Resolver()
/** Authenticated GraphQL boundary for bounded grading retries. */
export class RetryMockInterviewSessionGradingResolver {
    constructor(private readonly service: RetryMockInterviewSessionGradingService) {}
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(() => RetryMockInterviewSessionGradingResponse,
        {
            name: "retryMockInterviewSessionGrading"
        })
    execute(@Args("request") request: RetryMockInterviewSessionGradingRequest, @KeycloakGraphQLUser() user: UserEntity) {
        return this.service.execute(request,
            user.id)
    }
}
