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
    SyncPersonalProjectGithubRequest,
    SyncPersonalProjectGithubResponse,
} from "./graphql-types"
import {
    SyncPersonalProjectGithubService,
} from "./sync-personal-project-github.service"

@Resolver(() => EnrollmentEntity)
export class SyncPersonalProjectGithubResolver {
    constructor(
        private readonly service: SyncPersonalProjectGithubService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Personal project GitHub URL synced successfully",
        [Locale.Vi]: "Đồng bộ GitHub URL dự án cá nhân thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SyncPersonalProjectGithubResponse,
        {
            name: "syncPersonalProjectGithub",
            description: "Sync (upsert) the user's personal project GitHub URL with validation.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Personal project GitHub URL sync request.",
            },
        )
            request: SyncPersonalProjectGithubRequest,
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
