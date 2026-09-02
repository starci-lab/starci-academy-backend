import {
    Field, ID, InputType, Int, ObjectType
} from "@nestjs/graphql"
import {
    UserEntity
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ReactionSummaryObject
} from "../discussion/object-types/reaction-summary.object"
import {
    GraphQLTypeReactionType, ReactionType
} from "@modules/databases/postgresql/primary/enums/reaction-type"

@InputType()
/** Page request for a course's community feed -- reach for this to list posts, optionally scoped to the caller's own posts or a search query. */
export class CourseCommunityFeedRequest {
    @Field(() => String) courseDisplayId: string
    @Field(() => String,
        {
            nullable: true
        }) cursor?: string
    @Field(() => Int,
        {
            defaultValue: 20
        }) limit = 20
    @Field(() => Boolean,
        {
            defaultValue: false
        }) mine = false
    @Field(() => String,
        {
            nullable: true
        }) query?: string
}

@InputType()
/** Identifies one post within a course's community -- the shared shape every single-post read or mutation extends. */
export class CourseCommunityPostRequest {
    @Field(() => String) courseDisplayId: string
    @Field(() => String) postId: string
}

@InputType()
/** Page request for a post's comment thread, optionally scoped to one reply's children. */
export class CourseCommunityCommentsRequest extends CourseCommunityPostRequest {
    @Field(() => String,
        {
            nullable: true
        }) parentCommentId?: string
    @Field(() => String,
        {
            nullable: true
        }) cursor?: string
    @Field(() => Int,
        {
            defaultValue: 20
        }) limit = 20
}

@InputType()
/** Creates a new top-level post in a course's community. The idempotency key guards against duplicate submission on retry. */
export class CreateCourseCommunityPostRequest {
    @Field(() => String) courseDisplayId: string
    @Field(() => String) body: string
    @Field(() => String) idempotencyKey: string
}

@InputType()
/** Edits or soft-deletes an existing post -- omit `body` to delete. */
export class MutateCourseCommunityPostRequest extends CourseCommunityPostRequest {
    @Field(() => String,
        {
            nullable: true
        }) body?: string
}

@InputType()
/** Creates a new comment (or reply, via `parentCommentId`) on a post. The idempotency key guards against duplicate submission on retry. */
export class CreateCourseCommunityCommentRequest extends CourseCommunityPostRequest {
    @Field(() => String,
        {
            nullable: true
        }) parentCommentId?: string
    @Field(() => String) body: string
    @Field(() => String) idempotencyKey: string
}

@InputType()
/** Edits or soft-deletes an existing comment -- omit `body` to delete. */
export class MutateCourseCommunityCommentRequest {
    @Field(() => String) courseDisplayId: string
    @Field(() => String) commentId: string
    @Field(() => String,
        {
            nullable: true
        }) body?: string
}

@InputType()
/** Sets or clears (via omitted `type`) the caller's reaction on a post. */
export class ReactCourseCommunityPostRequest extends CourseCommunityPostRequest {
    @Field(() => GraphQLTypeReactionType,
        {
            nullable: true
        }) type?: ReactionType | null
}

@InputType()
/** Sets or clears (via omitted `type`) the caller's reaction on a comment. */
export class ReactCourseCommunityCommentRequest {
    @Field(() => String) courseDisplayId: string
    @Field(() => String) commentId: string
    @Field(() => GraphQLTypeReactionType,
        {
            nullable: true
        }) type?: ReactionType | null
}

@ObjectType()
/** A community post as returned to clients -- reach for this over the raw entity, it carries the viewer-scoped `isMine` and aggregated reaction/comment counts. */
export class CourseCommunityPostNode {
    @Field(() => ID) id: string
    @Field(() => String) body: string
    @Field(() => Boolean) isDeleted: boolean
    @Field(() => Date,
        {
            nullable: true
        }) editedAt: Date | null
    @Field(() => Date) createdAt: Date
    @Field(() => UserEntity) author: UserEntity
    @Field(() => Int) commentCount: number
    @Field(() => ReactionSummaryObject) reactions: ReactionSummaryObject
    @Field(() => Boolean) isMine: boolean
}

@ObjectType()
/** A community comment (or reply) as returned to clients -- reach for this over the raw entity, it carries the viewer-scoped `isMine` and aggregated reaction/reply counts. */
export class CourseCommunityCommentNode {
    @Field(() => ID) id: string
    @Field(() => String) body: string
    @Field(() => Boolean) isDeleted: boolean
    @Field(() => Date,
        {
            nullable: true
        }) editedAt: Date | null
    @Field(() => Date) createdAt: Date
    @Field(() => ID,
        {
            nullable: true
        }) parentCommentId: string | null
    @Field(() => UserEntity) author: UserEntity
    @Field(() => Int) replyCount: number
    @Field(() => ReactionSummaryObject) reactions: ReactionSummaryObject
    @Field(() => Boolean) isMine: boolean
}

@ObjectType()
/** One cursor-paginated page of a course's community feed. */
export class CourseCommunityFeedPage {
    @Field(() => [CourseCommunityPostNode]) posts: Array<CourseCommunityPostNode>
    @Field(() => String,
        {
            nullable: true
        }) nextCursor: string | null
}

@ObjectType()
/** One cursor-paginated page of a post's comment thread. */
export class CourseCommunityCommentsPage {
    @Field(() => [CourseCommunityCommentNode]) comments: Array<CourseCommunityCommentNode>
    @Field(() => String,
        {
            nullable: true
        }) nextCursor: string | null
}
