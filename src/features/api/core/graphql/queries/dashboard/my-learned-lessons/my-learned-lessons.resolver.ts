import {
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
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
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    UserContentEntity,
} from "@modules/databases/postgresql/primary/entities/user-content.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    toGlobalId,
} from "@modules/platform/routing/utils/global-id"
import {
    MyLearnedLessonItemData,
    MyLearnedLessonsResponse,
} from "./graphql-types/response"

/** Max lessons surfaced on the rail (keeps the payload bounded). */
const DASHBOARD_LIMIT = 30

@Resolver()
/**
 * Rail query: the lessons the viewer has recently read (newest first). Plain ORM
 * find over `user_contents` (is_read) joined to its content; each row becomes a
 * route-index token resolved on click.
 */
export class MyLearnedLessonsResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Learned lessons fetched successfully",
        [Locale.Vi]: "Lấy danh sách bài đã học thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyLearnedLessonsResponse,
        {
            name: "myLearnedLessons",
            description: "Lessons the viewer recently read (rail list, newest first).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<Array<MyLearnedLessonItemData>> {
        // read-lesson history, newest touch first
        const recentContents = await this.entityManager.find(
            UserContentEntity,
            {
                where: {
                    userId: user.id,
                    isRead: true,
                },
                relations: {
                    content: true,
                },
                order: {
                    updatedAt: "DESC",
                },
                take: DASHBOARD_LIMIT,
            },
        )

        // drop rows whose content was deleted, then map to clickable tokens
        return recentContents
            .filter((userContent) => Boolean(userContent.content))
            .map((userContent) => ({
                globalId: toGlobalId(ContentEntity.name,
                    userContent.content.id),
                label: userContent.content.title,
            }))
    }
}
