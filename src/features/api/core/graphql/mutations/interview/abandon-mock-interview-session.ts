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
/** Optimistic request to explicitly abandon a learner-owned unfinished session. */
export class AbandonMockInterviewSessionRequest {
    @Field(() => ID)
        courseId: string
    @Field(() => ID)
        sessionId: string
    @Field(() => Int)
        expectedRevision: number
}

@ObjectType()
/** Durable state returned after explicit abandonment. */
export class AbandonMockInterviewSessionData {
    @Field(() => ID)
        sessionId: string
    @Field(() => String)
        status: string
    @Field(() => Int)
        revision: number
}

@ObjectType()
/** GraphQL envelope for explicit mock-interview abandonment. */
export class AbandonMockInterviewSessionResponse extends AbstractGraphQLResponse {
    @Field(() => AbandonMockInterviewSessionData,
        {
            nullable: true
        })
        data: AbandonMockInterviewSessionData
}

@Injectable()
/** Applies the explicit abandon transition without silently replacing active work. */
export class AbandonMockInterviewSessionService {
    constructor(@InjectPrimaryPostgreSQLEntityManager() private readonly entityManager: EntityManager) {}

    async execute(request: AbandonMockInterviewSessionRequest, userId: string): Promise<AbandonMockInterviewSessionData> {
        const result = await this.entityManager.createQueryBuilder()
            .update(MockInterviewSessionEntity)
            .set({
                status: "abandoned", abandonedAt: new Date(), revision: () => "\"revision\" + 1"
            })
            .where("id = :sessionId",
                {
                    sessionId: request.sessionId
                })
            .andWhere("revision = :revision",
                {
                    revision: request.expectedRevision
                })
            .andWhere("status IN (:...statuses)",
                {
                    statuses: ["in_progress",
                        "grading_failed"]
                })
            .andWhere("enrollment_id IN (SELECT id FROM enrollments WHERE user_id = :userId AND course_id = :courseId)",
                {
                    userId,
                    courseId: request.courseId,
                })
            .execute()
        if (result.affected !== 1) {
            throw new MockInterviewSessionConflictException({
                reason: "abandon_revision_conflict",
                sessionId: request.sessionId,
                revision: request.expectedRevision,
            })
        }
        return {
            sessionId: request.sessionId, status: "abandoned", revision: request.expectedRevision + 1
        }
    }
}

@Resolver()
/** Authenticated GraphQL boundary for explicit abandonment. */
export class AbandonMockInterviewSessionResolver {
    constructor(private readonly service: AbandonMockInterviewSessionService) {}
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(() => AbandonMockInterviewSessionResponse,
        {
            name: "abandonMockInterviewSession"
        })
    execute(@Args("request") request: AbandonMockInterviewSessionRequest, @KeycloakGraphQLUser() user: UserEntity) {
        return this.service.execute(request,
            user.id)
    }
}
