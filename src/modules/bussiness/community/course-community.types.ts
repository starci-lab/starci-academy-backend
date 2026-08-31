import type { CommunityPostEntity } from "@modules/databases/postgresql/primary/entities/community-post.entity"
import type { CommunityPostCommentEntity } from "@modules/databases/postgresql/primary/entities/community-post-comment.entity"
import type { ReactionType } from "@modules/databases/postgresql/primary/enums/reaction-type"
import type { UserEntity } from "@modules/databases/postgresql/primary/entities/user.entity"

export interface CourseCommunityContext { courseId: string; user: UserEntity }
export interface CourseCommunityFeedParams extends CourseCommunityContext { cursor?: string | null; limit: number; mine?: boolean; query?: string | null }
export interface CourseCommunityFeedResult { posts: Array<CommunityPostEntity>; nextCursor: string | null }
export interface CourseCommunityCreatePostParams extends CourseCommunityContext { body: string; idempotencyKey: string }
export interface CourseCommunityPostMutationParams extends CourseCommunityContext { postId: string; body?: string }
export interface CourseCommunityCommentsParams extends CourseCommunityContext { postId: string; parentCommentId?: string | null; cursor?: string | null; limit: number }
export interface CourseCommunityCommentsResult { comments: Array<CommunityPostCommentEntity>; nextCursor: string | null }
export interface CourseCommunityCreateCommentParams extends CourseCommunityContext { postId: string; parentCommentId?: string | null; body: string; idempotencyKey: string }
export interface CourseCommunityCommentMutationParams extends CourseCommunityContext { commentId: string; body?: string }
export interface CourseCommunityPostReactionParams extends CourseCommunityContext { postId: string; type: ReactionType | null }
export interface CourseCommunityCommentReactionParams extends CourseCommunityContext { commentId: string; type: ReactionType | null }
