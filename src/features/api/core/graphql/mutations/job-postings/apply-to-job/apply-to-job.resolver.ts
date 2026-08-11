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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    JobApplicationEntity,
} from "@modules/databases/postgresql/primary/entities/job-application.entity"
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
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ApplyToJobRequest,
} from "./graphql-types/request"
import {
    ApplyToJobResponse,
} from "./graphql-types/response"
import {
    ApplyToJobService,
} from "./apply-to-job.service"

@Resolver()
/** Authenticated GraphQL door for one internal application. */
export class ApplyToJobResolver {
    constructor(
        private readonly applyToJobService: ApplyToJobService,
    ) {}

    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Application submitted successfully",
        [Locale.Vi]: "Nộp hồ sơ thành công", // vn-ok: localized GraphQL success message
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(() => ApplyToJobResponse,
        {
            name: "applyToJob",
        })
    async execute(
        @Args("request") request: ApplyToJobRequest,
        @KeycloakGraphQLUser() user: UserEntity,
    ): Promise<JobApplicationEntity> {
        return this.applyToJobService.execute({
            request,
            user,
        })
    }
}
