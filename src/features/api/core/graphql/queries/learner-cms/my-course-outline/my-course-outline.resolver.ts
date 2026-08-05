import {
    Args,
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
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MyCourseOutlineRequest,
} from "./graphql-types/request"
import {
    MyCourseOutlineData,
    MyCourseOutlineResponse,
} from "./graphql-types/response"
import {
    MyCourseOutlineService,
} from "./my-course-outline.service"

@Resolver()
/**
 * Learner-CMS query: the authenticated viewer's full outline for ONE enrolled
 * course -- the module/lesson/challenge tree plus the milestone/task tree, with
 * read flags + challenge/task progress overlaid and a current-task pointer. The
 * resolver stays thin: it resolves the viewer + locale and delegates assembly to
 * the service -> CQRS handler.
 */
export class MyCourseOutlineResolver {
    constructor(
        private readonly myCourseOutlineService: MyCourseOutlineService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Course outline fetched successfully",
        [Locale.Vi]: "Lấy dàn bài khóa học thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyCourseOutlineResponse,
        {
            name: "myCourseOutline",
            description: "The authenticated viewer's full outline for one enrolled course with progress overlaid.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("request",
            {
                description: "Course lookup request (the enrolled course id).",
            })
            request: MyCourseOutlineRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<MyCourseOutlineData> {
        // pass the resolved viewer + locale down so the handler can scope the read
        // to this user's enrollment and localize the course / milestone trees
        return this.myCourseOutlineService.execute({
            request,
            locale,
            user,
        })
    }
}
