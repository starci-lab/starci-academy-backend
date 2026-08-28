import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    GraphQLLocale,
} from "@modules/api/apollo/server/decorators/locale.decorators"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
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
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    JobStatusRequest,
} from "./graphql-types/request"
import {
    JobStatusResponse,
    JobStatusResponseData,
} from "./graphql-types/response"
import {
    JobStatusService,
} from "./job-status.service"

@Resolver()
/** Authenticated GraphQL entry point for reload-safe job polling. */
export class JobStatusResolver {
    constructor(
        private readonly service: JobStatusService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Job status fetched successfully",
        [Locale.Vi]: "Lấy trạng thái job thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => JobStatusResponse,
        {
            name: "jobStatus",
            description: "Reload-safe status for one asynchronous job owned by the authenticated user.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
        @Args("request")
            request: JobStatusRequest,
    ): Promise<JobStatusResponseData> {
        return this.service.execute({
            request,
            locale,
            user,
        })
    }
}
