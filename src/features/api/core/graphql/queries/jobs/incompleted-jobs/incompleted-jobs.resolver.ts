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
} from "@modules/api/apollo/server/decorators/locale.decorators"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness/guards/graphql-must-enrolled.guard"
import {
    IncompletedJobsResponse,
    IncompletedJobsResponseData,
} from "./graphql-types/response"
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
        [Locale.Vi]: "Lấy danh sách job chưa hoàn tất thành công", // vn-ok: vi-locale string emitted to clients
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
