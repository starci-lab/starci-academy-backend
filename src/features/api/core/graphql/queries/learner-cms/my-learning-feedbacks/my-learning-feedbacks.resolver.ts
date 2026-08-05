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
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    LearningFeedbacksCmsService,
} from "@modules/bussiness"
import {
    clampPagination,
} from "@modules/common"
import {
    MyLearningFeedbacksData,
    MyLearningFeedbacksResponse,
} from "./graphql-types"

@Resolver()
/**
 * Learner-CMS query: the authenticated user's learning feedback, merged across
 * the two sources (challenge submission feedback, milestone-task feedback) and
 * paginated with `{ items, total }`. A plain list read keyed by the viewer (the
 * LIST exception -- no CQRS projection). The merged rows have no single primary
 * key, so the resolver synthesises a stable list key from the source bucket +
 * the absolute row offset.
 *
 * A third source (CV review feedback) was dropped when the legacy
 * `cv_submissions`/`cv_submission_attempts` tables were retired -- see
 * {@link LearningFeedbacksCmsService} for why it isn't a drop-in replacement.
 */
export class MyLearningFeedbacksResolver {
    constructor(
        private readonly learningFeedbacksCmsService: LearningFeedbacksCmsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Learning feedback fetched successfully",
        [Locale.Vi]: "Lấy phản hồi học tập thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyLearningFeedbacksResponse,
        {
            name: "myLearningFeedbacks",
            description: "The authenticated user's learning feedback merged across sources (newest first), paginated.",
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
    ): Promise<MyLearningFeedbacksData> {
        // clamp the page window so a hostile client can't request an unbounded scan
        const {
            limit: safeLimit,
            offset: safeOffset,
        } = clampPagination(limit,
            offset)
        // read one merged page of the viewer's feedback across both sources
        const page = await this.learningFeedbacksCmsService.list({
            userId: user.id,
            limit: safeLimit,
            offset: safeOffset,
        })
        return {
            // map each merged row to its GraphQL shape; the synthetic id keeps the
            // FE list keys stable for a given page slot, and the Date becomes ISO
            items: page.items.map((item, index) => ({
                id: `${item.source}:${safeOffset + index}`,
                source: item.source,
                title: item.title,
                courseTitle: item.courseTitle,
                summary: item.summary,
                createdAt: item.createdAt.toISOString(),
            })),
            total: page.total,
        }
    }
}
