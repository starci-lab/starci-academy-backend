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
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
    GraphQLLocale,
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
    EnrollmentEntity,
} from "@modules/databases"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"
import {
    SubmitPersonalGithubUrlRequest,
    SubmitPersonalGithubUrlResponse,
} from "./graphql-types"
import {
    SubmitPersonalGithubUrlService,
} from "./submit-personal-github-url.service"

@Resolver(() => EnrollmentEntity)
export class SubmitPersonalGithubUrlResolver {
    constructor(
        private readonly service: SubmitPersonalGithubUrlService,
    ) {}

    @UseThrottler(ThrottlerConfig.Medium)
    @GraphQLSuccessMessage({
        [Locale.En]: "GitHub URL submitted successfully",
        [Locale.Vi]: "Đã gửi GitHub URL thành công",
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
