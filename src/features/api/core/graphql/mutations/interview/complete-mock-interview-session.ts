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
/** Optimistic handoff request from a finished live session to durable grading. */
export class CompleteMockInterviewSessionRequest {
    @Field(() => ID)
        courseId: string

    @Field(() => ID)
        sessionId: string

    @Field(() => Int)
        expectedRevision: number

    @Field(() => String,
        {
            nullable: true
        })
        selectedModel?: string

    @Field(() => String,
        {
            nullable: true
        })
        selectedModelProvider?: string
}

@ObjectType()
/** Durable session and grading-job identity returned by completion. */
export class CompleteMockInterviewSessionData {
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
/** GraphQL envelope for the completion handoff. */
export class CompleteMockInterviewSessionResponse extends AbstractGraphQLResponse {
    @Field(() => CompleteMockInterviewSessionData,
        {
            nullable: true
        })
        data: CompleteMockInterviewSessionData
}

@Injectable()
/** Atomically transitions the session to grading and creates its authoritative job row. */
export class CompleteMockInterviewSessionService {
    constructor(@InjectPrimaryPostgreSQLEntityManager() private readonly entityManager: EntityManager) {}

    async execute(request: CompleteMockInterviewSessionRequest, userId: string): Promise<CompleteMockInterviewSessionData> {
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
            if (session?.status !== "in_progress" || session.revision !== request.expectedRevision) {
                throw new MockInterviewSessionConflictException({
                    reason: "complete_revision_conflict",
                    sessionId: session?.id,
                    status: session?.status,
                    revision: session?.revision,
                })
            }
            const now = new Date()
            session.status = "grading"
            session.gradingRequestedAt = now
            session.revision += 1
            await manager.save(session)
            const job = await manager.save(MockInterviewGradingJobEntity,
                manager.create(MockInterviewGradingJobEntity,
                    {
                        session,
                        status: "queued",
                        availableAt: now,
                        selectedModel: request.selectedModel ?? null,
                        selectedModelProvider: request.selectedModelProvider ?? null,
                    }))
            return {
                sessionId: session.id, gradingJobId: job.id, status: session.status, revision: session.revision
            }
        })
    }
}

@Resolver()
/** Authenticated GraphQL boundary for durable completion handoff. */
export class CompleteMockInterviewSessionResolver {
    constructor(private readonly service: CompleteMockInterviewSessionService) {}

    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(() => CompleteMockInterviewSessionResponse,
        {
            name: "completeMockInterviewSession"
        })
    execute(@Args("request") request: CompleteMockInterviewSessionRequest, @KeycloakGraphQLUser() user: UserEntity) {
        return this.service.execute(request,
            user.id)
    }
}
