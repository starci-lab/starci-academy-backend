import {
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLLocale,
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"
import {
    IncompleteChallengeSubmissionJobsResponse,
    IncompleteChallengeSubmissionJobsResponseData,
} from "./graphql-types"
import {
    IncompleteChallengeSubmissionJobsService,
} from "./incomplete-challenge-submission-jobs.service"

@Resolver()
export class IncompleteChallengeSubmissionJobsResolver {
    constructor(
        private readonly incompleteChallengeSubmissionJobsService: IncompleteChallengeSubmissionJobsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Incomplete challenge submission jobs fetched successfully",
        [Locale.Vi]: "Lấy danh sách job bài nộp chưa hoàn tất theo bài nộp thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => IncompleteChallengeSubmissionJobsResponse,
        {
            name: "incompleteChallengeSubmissionJobs",
            description:
                "Returns a flat list of { jobId, status } for jobs not yet complete (queued or processing) for Git + Google Docs pipelines, ordered by `queue_at` desc. `request.userId` defaults to the current user and must match the authenticated user.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<IncompleteChallengeSubmissionJobsResponseData> {
        return this.incompleteChallengeSubmissionJobsService.execute(
            {
                request: undefined,
                locale,
                user,
            },
        )
    }
}
