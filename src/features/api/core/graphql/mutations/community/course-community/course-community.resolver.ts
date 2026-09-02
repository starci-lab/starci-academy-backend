import {
    Args, Mutation, Resolver 
} from "@nestjs/graphql"
import {
    UseGuards 
} from "@nestjs/common"
import {
    KeycloakAuthGraphQLGuard 
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser 
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    UserEntity 
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    CourseCommunityApiService 
} from "../../../shared/community/course-community-api.service"
import {
    CourseCommunityCommentNode, CourseCommunityPostNode, CreateCourseCommunityCommentRequest, CreateCourseCommunityPostRequest, MutateCourseCommunityCommentRequest, MutateCourseCommunityPostRequest, ReactCourseCommunityCommentRequest, ReactCourseCommunityPostRequest 
} from "../../../shared/community/course-community-graphql.types"

@Resolver()
@UseGuards(KeycloakAuthGraphQLGuard)
/**
 * GraphQL write surface for a course's community feed -- reach for this to
 * create/update/delete a post or comment, or react to one; reads live on
 * {@link CourseCommunityQueriesResolver}.
 */
export class CourseCommunityMutationsResolver {
    constructor(private readonly api: CourseCommunityApiService) {}
    @Mutation(() => CourseCommunityPostNode,
        {
            name: "createCourseCommunityPost" 
        }) async createPost(@Args("request") r: CreateCourseCommunityPostRequest, @KeycloakGraphQLUser() user: UserEntity) { const courseId = await this.api.authorize(r.courseDisplayId,
        user); return this.api.postNode(courseId,
        await this.api.community.createPost({
            ...r, courseId, user 
        }),
        user.id) }
    @Mutation(() => CourseCommunityPostNode,
        {
            name: "updateCourseCommunityPost" 
        }) async updatePost(@Args("request") r: MutateCourseCommunityPostRequest, @KeycloakGraphQLUser() user: UserEntity) { const courseId = await this.api.authorize(r.courseDisplayId,
        user); return this.api.postNode(courseId,
        await this.api.community.updatePost({
            ...r, courseId, user 
        }),
        user.id) }
    @Mutation(() => CourseCommunityPostNode,
        {
            name: "deleteCourseCommunityPost" 
        }) async deletePost(@Args("request") r: MutateCourseCommunityPostRequest, @KeycloakGraphQLUser() user: UserEntity) { const courseId = await this.api.authorize(r.courseDisplayId,
        user); return this.api.postNode(courseId,
        await this.api.community.deletePost({
            ...r, courseId, user 
        }),
        user.id) }
    @Mutation(() => CourseCommunityCommentNode,
        {
            name: "createCourseCommunityPostComment" 
        }) async createComment(@Args("request") r: CreateCourseCommunityCommentRequest, @KeycloakGraphQLUser() user: UserEntity) { const courseId = await this.api.authorize(r.courseDisplayId,
        user); return this.api.commentNode(courseId,
        await this.api.community.createComment({
            ...r, courseId, user 
        }),
        user.id) }
    @Mutation(() => CourseCommunityCommentNode,
        {
            name: "updateCourseCommunityPostComment" 
        }) async updateComment(@Args("request") r: MutateCourseCommunityCommentRequest, @KeycloakGraphQLUser() user: UserEntity) { const courseId = await this.api.authorize(r.courseDisplayId,
        user); return this.api.commentNode(courseId,
        await this.api.community.updateComment({
            ...r, courseId, user 
        }),
        user.id) }
    @Mutation(() => CourseCommunityCommentNode,
        {
            name: "deleteCourseCommunityPostComment" 
        }) async deleteComment(@Args("request") r: MutateCourseCommunityCommentRequest, @KeycloakGraphQLUser() user: UserEntity) { const courseId = await this.api.authorize(r.courseDisplayId,
        user); return this.api.commentNode(courseId,
        await this.api.community.deleteComment({
            ...r, courseId, user 
        }),
        user.id) }
    @Mutation(() => CourseCommunityPostNode,
        {
            name: "reactToCourseCommunityPost" 
        }) async reactPost(@Args("request") r: ReactCourseCommunityPostRequest, @KeycloakGraphQLUser() user: UserEntity) { const courseId = await this.api.authorize(r.courseDisplayId,
        user); return this.api.postNode(courseId,
        await this.api.community.reactToPost({
            ...r, type: r.type ?? null, courseId, user 
        }),
        user.id) }
    @Mutation(() => CourseCommunityCommentNode,
        {
            name: "reactToCourseCommunityComment" 
        }) async reactComment(@Args("request") r: ReactCourseCommunityCommentRequest, @KeycloakGraphQLUser() user: UserEntity) { const courseId = await this.api.authorize(r.courseDisplayId,
        user); return this.api.commentNode(courseId,
        await this.api.community.reactToComment({
            ...r, type: r.type ?? null, courseId, user 
        }),
        user.id) }
}
