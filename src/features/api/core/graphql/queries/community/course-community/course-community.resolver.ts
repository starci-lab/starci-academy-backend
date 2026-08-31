import { Args, Query, Resolver } from "@nestjs/graphql"
import { UseGuards } from "@nestjs/common"
import { KeycloakAuthGraphQLGuard } from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import { KeycloakGraphQLUser } from "@modules/integrations/keycloak/keycloak.decorators"
import { UserEntity } from "@modules/databases/postgresql/primary/entities/user.entity"
import { CourseCommunityApiService } from "../../../shared/community/course-community-api.service"
import { CourseCommunityCommentNode, CourseCommunityCommentsPage, CourseCommunityCommentsRequest, CourseCommunityFeedPage, CourseCommunityFeedRequest, CourseCommunityPostNode, CourseCommunityPostRequest } from "../../../shared/community/course-community-graphql.types"

@Resolver()
@UseGuards(KeycloakAuthGraphQLGuard)
export class CourseCommunityQueriesResolver {
    constructor(private readonly api: CourseCommunityApiService) {}
    @Query(() => CourseCommunityFeedPage, { name: "courseCommunityFeed" })
    async feed(@Args("request") request: CourseCommunityFeedRequest, @KeycloakGraphQLUser() user: UserEntity): Promise<CourseCommunityFeedPage> { const courseId = await this.api.authorize(request.courseDisplayId, user); const page = await this.api.community.listFeed({ ...request, courseId, user }); return { posts: await this.api.postNodes(courseId, page.posts, user.id), nextCursor: page.nextCursor } }
    @Query(() => CourseCommunityPostNode, { name: "courseCommunityPost" })
    async post(@Args("request") request: CourseCommunityPostRequest, @KeycloakGraphQLUser() user: UserEntity): Promise<CourseCommunityPostNode> { const courseId = await this.api.authorize(request.courseDisplayId, user); return this.api.postNode(courseId, await this.api.community.getPost({ courseId, postId: request.postId, user }), user.id) }
    @Query(() => CourseCommunityCommentsPage, { name: "courseCommunityPostComments" })
    async comments(@Args("request") request: CourseCommunityCommentsRequest, @KeycloakGraphQLUser() user: UserEntity): Promise<CourseCommunityCommentsPage> { const courseId = await this.api.authorize(request.courseDisplayId, user); const page = await this.api.community.listComments({ ...request, courseId, user }); return { comments: await this.api.commentNodes(courseId, page.comments, user.id), nextCursor: page.nextCursor } }
}
