import {
    Args,
    Int,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    CourseEntity,
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    ChallengeSubmissionsCmsService,
} from "@modules/bussiness"
import {
    toGlobalId,
} from "@modules/routing"
import {
    clampPagination,
} from "@modules/common"
import {
    MyChallengeSubmissionsData,
    MyChallengeSubmissionsResponse,
} from "./graphql-types"

@Resolver()
/**
 * Learner-CMS query: the authenticated user's challenge-submission attempts
 * (newest first), paginated with `{ items, total }`. A plain list read keyed by
 * the viewer (the LIST exception — no CQRS projection); the service reads the
 * live tables and the resolver only wraps the course UUID into the opaque global
 * id the FE feeds to `resolveRoute`.
 */
export class MyChallengeSubmissionsResolver {
    constructor(
        private readonly challengeSubmissionsCmsService: ChallengeSubmissionsCmsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Challenge submissions fetched successfully",
        [Locale.Vi]: "Lấy bài nộp challenge thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyChallengeSubmissionsResponse,
        {
            name: "myChallengeSubmissions",
            description: "The authenticated user's challenge-submission attempts (newest first), paginated.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("limit",
            {
                type: () => Int,
                nullable: true,
                defaultValue: 20,
            })
            limit: number,
        @Args("offset",
            {
                type: () => Int,
                nullable: true,
                defaultValue: 0,
            })
            offset: number,
    ): Promise<MyChallengeSubmissionsData> {
        // read one page of the viewer's attempts; clamp the window so a hostile
        // client can't request an unbounded scan
        const page = await this.challengeSubmissionsCmsService.list({
            userId: user.id,
            ...clampPagination(limit,
                offset),
        })
        return {
            // map each attempt to its GraphQL shape; the course UUID becomes an
            // opaque global id and the Date becomes an ISO string
            items: page.items.map((item) => ({
                id: item.id,
                challengeTitle: item.challengeTitle,
                courseTitle: item.courseTitle,
                courseGlobalId: toGlobalId(CourseEntity.name,
                    item.courseId),
                status: item.status,
                score: item.score,
                selectedLang: item.selectedLang,
                submissionUrl: item.submissionUrl,
                submittedAt: item.submittedAt.toISOString(),
            })),
            total: page.total,
        }
    }
}
