import {
    Args,
    ID,
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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    JobApplicationEntity,
} from "@modules/databases/postgresql/primary/entities/job-application.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    JobApplicationsResponse,
} from "./graphql-types/response"
import {
    JobApplicationsService,
} from "./job-applications.service"

@Resolver()
/** Authenticated employer door for applicants to one owned posting. */
export class JobApplicationsResolver {
    constructor(
        private readonly jobApplicationsService: JobApplicationsService,
    ) {}

    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Applications fetched successfully",
        [Locale.Vi]: "Lấy danh sách ứng viên thành công", // vn-ok: localized GraphQL success message
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(() => JobApplicationsResponse,
        {
            name: "jobApplications",
        })
    async execute(
        @Args("jobPostingId",
            {
                type: () => ID,
            }) jobPostingId: string,
        @KeycloakGraphQLUser() user: UserEntity,
    ): Promise<Array<JobApplicationEntity>> {
        return this.jobApplicationsService.execute({
            request: {
                jobPostingId,
            },
            user,
        })
    }
}
