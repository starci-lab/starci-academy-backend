import type {
    CommunityPostEntity
} from "@modules/databases/postgresql/primary/entities/community-post.entity"
import type {
    CommunityPostCommentEntity
} from "@modules/databases/postgresql/primary/entities/community-post-comment.entity"
import type {
    ReactionType
} from "@modules/databases/postgresql/primary/enums/reaction-type"
import type {
    UserEntity
} from "@modules/databases/postgresql/primary/entities/user.entity"

/** Shared identity every `CourseCommunityService` call takes: which course, and who is calling. */
export interface CourseCommunityContext { courseId: string; user: UserEntity }

/** Params for paging a course's community feed, optionally scoped to the caller's own posts or a search query. */
export interface CourseCommunityFeedParams extends CourseCommunityContext { cursor?: string | null; limit: number; mine?: boolean; query?: string | null }

/** One cursor-paginated page of a course's community feed. */
export interface CourseCommunityFeedResult { posts: Array<CommunityPostEntity>; nextCursor: string | null }

/** Params for creating a new top-level post in a course's community. */
export interface CourseCommunityCreatePostParams extends CourseCommunityContext { body: string; idempotencyKey: string }

/** Params for editing or soft-deleting (via omitted `body`) an existing post. */
export interface CourseCommunityPostMutationParams extends CourseCommunityContext { postId: string; body?: string }

/** Params for paging a post's comment thread, optionally scoped to one reply's children. */
export interface CourseCommunityCommentsParams extends CourseCommunityContext { postId: string; parentCommentId?: string | null; cursor?: string | null; limit: number }

/** One cursor-paginated page of a post's comment thread. */
export interface CourseCommunityCommentsResult { comments: Array<CommunityPostCommentEntity>; nextCursor: string | null }

/** Params for creating a new comment (or reply, via `parentCommentId`) on a post. */
export interface CourseCommunityCreateCommentParams extends CourseCommunityContext { postId: string; parentCommentId?: string | null; body: string; idempotencyKey: string }

/** Params for editing or soft-deleting (via omitted `body`) an existing comment. */
export interface CourseCommunityCommentMutationParams extends CourseCommunityContext { commentId: string; body?: string }

/** Params for setting or clearing (via `type: null`) the caller's reaction on a post. */
export interface CourseCommunityPostReactionParams extends CourseCommunityContext { postId: string; type: ReactionType | null }

/** Params for setting or clearing (via `type: null`) the caller's reaction on a comment. */
export interface CourseCommunityCommentReactionParams extends CourseCommunityContext { commentId: string; type: ReactionType | null }
