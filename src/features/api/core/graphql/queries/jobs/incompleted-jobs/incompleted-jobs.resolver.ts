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
    IncompletedJobsResponse,
    IncompletedJobsResponseData,
} from "./graphql-types"
import {
    IncompletedJobsService,
} from "./incompleted-jobs.service"

@Resolver()
/**
 * Resolves the `incompletedJobs` query: a flat `{ jobId, status }` list for the
 * caller's still-queued-or-processing Git and Google Docs submission jobs, so a
 * client can poll a stuck grading run without knowing its id up front.
 */
export class IncompletedJobsResolver {
    constructor(
        private readonly incompletedJobsService: IncompletedJobsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Incompleted jobs fetched successfully",
        [Locale.Vi]: "Lấy danh sách job chưa hoàn tất thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => IncompletedJobsResponse,
        {
            name: "incompletedJobs",
            description:
                "Returns a flat list of { jobId, status } for jobs not yet complete (queued or processing) for Git + Google Docs pipelines, ordered by `queue_at` desc. `request.userId` defaults to the current user and must match the authenticated user.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<IncompletedJobsResponseData> {
        return this.incompletedJobsService.execute(
            {
                request: undefined,
                locale,
                user,
            },
        )
    }
}
