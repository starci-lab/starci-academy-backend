import {
    Args,
    Mutation,
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
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness/guards/graphql-must-enrolled.guard"
import {
    SubmitPersonalGithubUrlRequest,
} from "./graphql-types/request"
import {
    SubmitPersonalGithubUrlResponse,
} from "./graphql-types/response"
import {
    SubmitPersonalGithubUrlService,
} from "./submit-personal-github-url.service"

@Resolver(() => EnrollmentEntity)
/**
 * GraphQL leaf for the first-time repo bind. Enrollment guard lives here
 * so an unenrolled caller never reaches the handler's findOneOrFail.
 */
export class SubmitPersonalGithubUrlResolver {
    constructor(
        private readonly service: SubmitPersonalGithubUrlService,
    ) {}

    @UseThrottler(ThrottlerConfig.Medium)
    @GraphQLSuccessMessage({
        [Locale.En]: "GitHub URL submitted successfully",
        [Locale.Vi]: "Đã gửi GitHub URL thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SubmitPersonalGithubUrlResponse,
        {
            name: "submitPersonalGithubUrl",
            description: "Save the user's personal project GitHub URL.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Personal GitHub URL submission request.",
            },
        )
            request: SubmitPersonalGithubUrlRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<EnrollmentEntity> {
        return this.service.execute({
            request,
            user,
            locale,
        })
    }
}
