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
    SyncIdealTextRequest,
    SyncIdealTextResponse,
} from "./graphql-types"
import {
    SyncIdealTextService,
} from "./sync-ideal-text.service"

@Resolver(() => EnrollmentEntity)
export class SyncIdealTextResolver {
    constructor(
        private readonly service: SyncIdealTextService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Project idea text synced successfully",
        [Locale.Vi]: "Đồng bộ ý tưởng dự án thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SyncIdealTextResponse,
        {
            name: "syncIdealText",
            description: "Sync (upsert) the user's personal project idea text.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Personal project idea text sync request.",
            },
        )
            request: SyncIdealTextRequest,
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
