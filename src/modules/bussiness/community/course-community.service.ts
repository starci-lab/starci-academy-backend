import {
    Injectable 
} from "@nestjs/common"
import {
    createHash 
} from "node:crypto"
import {
    Brackets, EntityManager 
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager 
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    CommunityPostEntity 
} from "@modules/databases/postgresql/primary/entities/community-post.entity"
import {
    CommunityPostCommentEntity 
} from "@modules/databases/postgresql/primary/entities/community-post-comment.entity"
import {
    CommunityPostReactionEntity 
} from "@modules/databases/postgresql/primary/entities/community-post-reaction.entity"
import {
    CommunityPostCommentReactionEntity 
} from "@modules/databases/postgresql/primary/entities/community-post-comment-reaction.entity"
import type {
    ReactionSummaryResult, ReactionCountResult
} from "../discussion/types/reaction"
import type {
    ReactionType 
} from "@modules/databases/postgresql/primary/enums/reaction-type"
import {
    CommunityScope 
} from "@modules/databases/postgresql/primary/enums/community-scope"
import {
    CommunityChannel 
} from "@modules/databases/postgresql/primary/enums/community-channel"
import {
    CourseCommunityIdempotencyConflictException, CourseCommunityUnavailableException 
} from "@modules/platform/exceptions/errors/community/course-community"
import {
    CourseCommunityCursorService 
} from "./course-community-cursor.service"
import type {
    CourseCommunityCommentMutationParams, CourseCommunityCommentReactionParams, CourseCommunityCommentsParams, CourseCommunityCommentsResult, CourseCommunityCreateCommentParams, CourseCommunityCreatePostParams, CourseCommunityFeedParams, CourseCommunityFeedResult, CourseCommunityPostMutationParams, CourseCommunityPostReactionParams 
} from "./course-community.types"

@Injectable()
/**
 * Domain service for a course's community feed -- reach for this (not the
 * global `CommunityPostService`/`CommunityCommentService`) for anything
 * scoped to `CommunityScope.Course`: paging the feed and comment threads,
 * creating/editing/deleting posts and comments, and reacting to either.
 * Create/comment mutations are idempotent via `community_command_receipts`,
 * and every write appends a `community_outbox` row for the socket gateway.
 */
export class CourseCommunityService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager() private readonly manager: EntityManager,
        private readonly cursors: CourseCommunityCursorService,
    ) {}

    async listFeed(params: CourseCommunityFeedParams): Promise<CourseCommunityFeedResult> {
        const mine = params.mine ?? false
        const query = (params.query ?? "").trim()
        const queryHash = this.cursors.queryHash(query)
        const cursor = params.cursor ? this.cursors.decode(params.cursor,
            {
                courseId: params.courseId, mine, queryHash 
            }) : null
        const limit = Math.max(1,
            Math.min(params.limit,
                50))
        const qb = this.manager.createQueryBuilder(CommunityPostEntity,
            "post")
            .leftJoinAndSelect("post.author",
                "author")
            .where("post.scope = :scope",
                {
                    scope: CommunityScope.Course 
                })
            .andWhere("post.course_id = :courseId",
                {
                    courseId: params.courseId 
                })
            .andWhere("post.is_deleted = false")
            .orderBy("post.createdAt",
                "DESC").addOrderBy("post.id",
                "DESC").take(limit + 1)
        if (mine) qb.andWhere("post.author_id = :authorId",
            {
                authorId: params.user.id 
            })
        if (query) qb.andWhere("to_tsvector('simple', post.body) @@ plainto_tsquery('simple', :query)",
            {
                query 
            })
        if (cursor) qb.andWhere(new Brackets((nested) => nested.where("post.created_at < :createdAt",
            {
                createdAt: cursor.createdAt 
            }).orWhere("post.created_at = :createdAt AND post.id < :cursorId",
            {
                createdAt: cursor.createdAt, cursorId: cursor.id 
            })))
        const rows = await qb.getMany()
        const hasMore = rows.length > limit
        const posts = rows.slice(0,
            limit)
        const last = posts.at(-1)
        return {
            posts, nextCursor: hasMore && last ? this.cursors.encode({
                courseId: params.courseId, mine, queryHash, createdAt: last.createdAt.toISOString(), id: last.id 
            }) : null 
        }
    }

    async getPost({ courseId, postId }: CourseCommunityPostMutationParams): Promise<CommunityPostEntity> {
        const post = await this.manager.findOne(CommunityPostEntity,
            {
                where: {
                    id: postId, scope: CommunityScope.Course, course: {
                        id: courseId 
                    }, isDeleted: false 
                }, relations: {
                    author: true 
                } 
            })
        if (!post) throw new CourseCommunityUnavailableException({
        })
        return post
    }

    async createPost(params: CourseCommunityCreatePostParams): Promise<CommunityPostEntity> {
        return this.idempotentCreate("CREATE_POST",
            params,
            {
                body: params.body 
            },
            async (tx) => {
                const post = tx.create(CommunityPostEntity,
                    {
                        body: params.body, channel: CommunityChannel.General, scope: CommunityScope.Course, course: {
                            id: params.courseId 
                        }, author: {
                            id: params.user.id 
                        }, isPinned: false, isDeleted: false, editedAt: null 
                    })
                return tx.save(post)
            })
    }

    async updatePost(params: CourseCommunityPostMutationParams): Promise<CommunityPostEntity> {
        const post = await this.getPost(params)
        if (post.authorId !== params.user.id || params.body === undefined) throw new CourseCommunityUnavailableException({
        })
        post.body = params.body; post.editedAt = new Date()
        return this.manager.transaction(async (tx) => { const saved = await tx.save(post); await this.outbox(tx,
            "POST_UPDATED",
            params.courseId,
            saved.id); return saved })
    }

    async deletePost(params: CourseCommunityPostMutationParams): Promise<CommunityPostEntity> {
        const post = await this.getPost(params)
        if (post.authorId !== params.user.id) throw new CourseCommunityUnavailableException({
        })
        post.isDeleted = true
        return this.manager.transaction(async (tx) => { const saved = await tx.save(post); await this.outbox(tx,
            "POST_DELETED",
            params.courseId,
            saved.id); return saved })
    }

    async listComments(params: CourseCommunityCommentsParams): Promise<CourseCommunityCommentsResult> {
        await this.getPost(params)
        const limit = Math.max(1,
            Math.min(params.limit,
                50))
        const cursor = params.cursor ? this.cursors.decode(params.cursor,
            {
                courseId: params.courseId, mine: false, queryHash: this.cursors.queryHash(`comments:${params.postId}:${params.parentCommentId ?? "root"}`) 
            }) : null
        const qb = this.manager.createQueryBuilder(CommunityPostCommentEntity,
            "comment").leftJoinAndSelect("comment.user",
            "user")
            .innerJoin("comment.post",
                "post",
                "post.scope = :scope AND post.course_id = :courseId",
                {
                    scope: CommunityScope.Course, courseId: params.courseId 
                })
            .where("comment.post_id = :postId",
                {
                    postId: params.postId 
                }).orderBy("comment.createdAt",
                "ASC").addOrderBy("comment.id",
                "ASC").take(limit + 1)
        if (params.parentCommentId) qb.andWhere("comment.parent_comment_id = :parent",
            {
                parent: params.parentCommentId 
            })
        else qb.andWhere("comment.parent_comment_id IS NULL")
        if (cursor) qb.andWhere(new Brackets((nested) => nested.where("comment.created_at > :createdAt",
            {
                createdAt: cursor.createdAt 
            }).orWhere("comment.created_at = :createdAt AND comment.id > :cursorId",
            {
                createdAt: cursor.createdAt, cursorId: cursor.id 
            })))
        const rows = await qb.getMany(); const comments = rows.slice(0,
            limit); const last = comments.at(-1)
        const nextCursor = rows.length > limit && last ? this.cursors.encode({
            courseId: params.courseId, mine: false, queryHash: this.cursors.queryHash(`comments:${params.postId}:${params.parentCommentId ?? "root"}`), createdAt: last.createdAt.toISOString(), id: last.id 
        }) : null
        return {
            comments, nextCursor 
        }
    }

    async createComment(params: CourseCommunityCreateCommentParams): Promise<CommunityPostCommentEntity> {
        return this.idempotentCreate("CREATE_COMMENT",
            params,
            {
                postId: params.postId, parentCommentId: params.parentCommentId ?? null, body: params.body 
            },
            async (tx) => {
                const post = await tx.findOne(CommunityPostEntity,
                    {
                        where: {
                            id: params.postId, scope: CommunityScope.Course, course: {
                                id: params.courseId 
                            }, isDeleted: false 
                        } 
                    })
                if (!post) throw new CourseCommunityUnavailableException({
                })
                if (params.parentCommentId) {
                    const parent = await tx.findOne(CommunityPostCommentEntity,
                        {
                            where: {
                                id: params.parentCommentId, post: {
                                    id: params.postId, scope: CommunityScope.Course, course: {
                                        id: params.courseId 
                                    } 
                                } 
                            }, lock: {
                                mode: "pessimistic_read" 
                            } 
                        })
                    if (!parent) throw new CourseCommunityUnavailableException({
                    })
                }
                return tx.save(tx.create(CommunityPostCommentEntity,
                    {
                        post: {
                            id: params.postId 
                        }, parentComment: params.parentCommentId ? {
                            id: params.parentCommentId 
                        } : null, user: {
                            id: params.user.id 
                        }, body: params.body, isDeleted: false, editedAt: null 
                    }))
            })
    }

    async updateComment(params: CourseCommunityCommentMutationParams): Promise<CommunityPostCommentEntity> { return this.mutateComment(params,
        false) }
    async deleteComment(params: CourseCommunityCommentMutationParams): Promise<CommunityPostCommentEntity> { return this.mutateComment(params,
        true) }

    async reactToPost(params: CourseCommunityPostReactionParams): Promise<CommunityPostEntity> {
        await this.getPost(params)
        await this.manager.transaction(async (tx) => { if (params.type === null) await tx.delete(CommunityPostReactionEntity,
            {
                post: {
                    id: params.postId 
                }, user: {
                    id: params.user.id 
                } 
            }); else await tx.upsert(CommunityPostReactionEntity,
            {
                post: {
                    id: params.postId 
                }, user: {
                    id: params.user.id 
                }, type: params.type 
            },
            {
                conflictPaths: ["post",
                    "user"] 
            }); await this.outbox(tx,
            "POST_REACTION_CHANGED",
            params.courseId,
            params.postId) })
        return this.getPost(params)
    }

    async reactToComment(params: CourseCommunityCommentReactionParams): Promise<CommunityPostCommentEntity> {
        const comment = await this.findComment(params)
        await this.manager.transaction(async (tx) => { if (params.type === null) await tx.delete(CommunityPostCommentReactionEntity,
            {
                comment: {
                    id: params.commentId 
                }, user: {
                    id: params.user.id 
                } 
            }); else await tx.upsert(CommunityPostCommentReactionEntity,
            {
                comment: {
                    id: params.commentId 
                }, user: {
                    id: params.user.id 
                }, type: params.type 
            },
            {
                conflictPaths: ["comment",
                    "user"] 
            }); await this.outbox(tx,
            "COMMENT_REACTION_CHANGED",
            params.courseId,
            comment.postId,
            params.commentId) })
        return this.findComment(params)
    }

    async aggregatePosts(courseId: string, postIds: Array<string>, userId: string): Promise<{ comments: Record<string, number>; reactions: Record<string, ReactionSummaryResult> }> {
        if (!postIds.length) return {
            comments: {
            }, reactions: {
            } 
        }
        const comments = await this.manager.query("SELECT c.post_id AS \"postId\", COUNT(*) AS count FROM community_post_comments c JOIN community_posts p ON p.id=c.post_id WHERE p.scope='COURSE' AND p.course_id=$1 AND c.post_id=ANY($2::uuid[]) GROUP BY c.post_id",
            [courseId,
                postIds]) as Array<{ postId: string; count: string }>
        return {
            comments: Object.fromEntries(comments.map((row) => [row.postId,
                Number(row.count)])), reactions: await this.aggregateReactions(courseId,
                "post",
                postIds,
                userId) 
        }
    }

    async aggregateComments(courseId: string, commentIds: Array<string>, userId: string): Promise<{ replies: Record<string, number>; reactions: Record<string, ReactionSummaryResult> }> {
        if (!commentIds.length) return {
            replies: {
            }, reactions: {
            } 
        }
        const replies = await this.manager.query("SELECT child.parent_comment_id AS \"commentId\", COUNT(*) AS count FROM community_post_comments child JOIN community_post_comments parent ON parent.id=child.parent_comment_id JOIN community_posts p ON p.id=parent.post_id WHERE p.scope='COURSE' AND p.course_id=$1 AND parent.id=ANY($2::uuid[]) GROUP BY child.parent_comment_id",
            [courseId,
                commentIds]) as Array<{ commentId: string; count: string }>
        return {
            replies: Object.fromEntries(replies.map((row) => [row.commentId,
                Number(row.count)])), reactions: await this.aggregateReactions(courseId,
                "comment",
                commentIds,
                userId) 
        }
    }

    private async aggregateReactions(courseId: string, target: "post" | "comment", ids: Array<string>, userId: string): Promise<Record<string, ReactionSummaryResult>> {
        const join = target === "post" ? "community_post_reactions r JOIN community_posts p ON p.id=r.post_id" : "community_post_comment_reactions r JOIN community_post_comments c ON c.id=r.comment_id JOIN community_posts p ON p.id=c.post_id"
        const column = target === "post" ? "r.post_id" : "r.comment_id"
        const counts = await this.manager.query(`SELECT ${column} AS id, r.type, COUNT(*) AS count FROM ${join} WHERE p.scope='COURSE' AND p.course_id=$1 AND ${column}=ANY($2::uuid[]) GROUP BY ${column}, r.type`,
            [courseId,
                ids]) as Array<{ id: string; type: ReactionType; count: string }>
        const mine = await this.manager.query(`SELECT ${column} AS id, r.type FROM ${join} WHERE p.scope='COURSE' AND p.course_id=$1 AND ${column}=ANY($2::uuid[]) AND r.user_id=$3`,
            [courseId,
                ids,
                userId]) as Array<{ id: string; type: ReactionType }>
        const mineById = Object.fromEntries(mine.map((row) => [row.id,
            row.type])) as Record<string, ReactionType>
        const countsById = counts.reduce<Record<string, Array<ReactionCountResult>>>((acc, row) => { (acc[row.id] ??= []).push({
            type: row.type, count: Number(row.count) 
        }); return acc },
        {
        })
        return Object.fromEntries(ids.map((id) => { const values = countsById[id] ?? []; return [id,
            {
                counts: values, total: values.reduce((sum, item) => sum + item.count,
                    0), myReaction: mineById[id] ?? null, viewCount: 0, shareCount: 0 
            }] }))
    }

    private async findComment(params: CourseCommunityCommentMutationParams): Promise<CommunityPostCommentEntity> {
        const comment = await this.manager.findOne(CommunityPostCommentEntity,
            {
                where: {
                    id: params.commentId, post: {
                        scope: CommunityScope.Course, course: {
                            id: params.courseId 
                        }, isDeleted: false 
                    } 
                }, relations: {
                    user: true, post: true 
                } 
            })
        if (!comment) throw new CourseCommunityUnavailableException({
        })
        return comment
    }

    private async mutateComment(params: CourseCommunityCommentMutationParams, remove: boolean): Promise<CommunityPostCommentEntity> {
        const comment = await this.findComment(params)
        if (comment.userId !== params.user.id || (!remove && params.body === undefined)) throw new CourseCommunityUnavailableException({
        })
        if (remove) comment.isDeleted = true; else { comment.body = params.body as string; comment.editedAt = new Date() }
        return this.manager.transaction(async (tx) => { const saved = await tx.save(comment); await this.outbox(tx,
            remove ? "COMMENT_DELETED" : "COMMENT_UPDATED",
            params.courseId,
            comment.postId,
            comment.id); return saved })
    }

    private async idempotentCreate<T extends CommunityPostEntity | CommunityPostCommentEntity>(kind: string, params: CourseCommunityCreatePostParams | CourseCommunityCreateCommentParams, payload: unknown, create: (tx: EntityManager) => Promise<T>): Promise<T> {
        const requestHash = createHash("sha256").update(JSON.stringify(payload)).digest("hex")
        return this.manager.transaction(async (tx) => {
            await tx.query("INSERT INTO community_command_receipts(actor_id, course_id, operation_kind, idempotency_key, request_hash) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING",
                [params.user.id,
                    params.courseId,
                    kind,
                    params.idempotencyKey,
                    requestHash])
            const [receipt] = await tx.query("SELECT request_hash, result_target_id FROM community_command_receipts WHERE actor_id=$1 AND course_id=$2 AND operation_kind=$3 AND idempotency_key=$4 FOR UPDATE",
                [params.user.id,
                    params.courseId,
                    kind,
                    params.idempotencyKey])
            if (receipt.request_hash !== requestHash) throw new CourseCommunityIdempotencyConflictException({
            })
            if (receipt.result_target_id) {
                const entity = kind === "CREATE_POST" ? CommunityPostEntity : CommunityPostCommentEntity
                const existing = await tx.findOne(entity,
{
    where: {
        id: receipt.result_target_id 
    }, relations: kind === "CREATE_POST" ? {
        author: true 
    } : {
        user: true, post: true 
    } 
} as never)
                if (!existing) throw new CourseCommunityUnavailableException({
                })
                return existing as T
            }
            const created = await create(tx)
            const entity = kind === "CREATE_POST" ? CommunityPostEntity : CommunityPostCommentEntity
            const result = await tx.findOneOrFail(entity,
{
    where: {
        id: created.id 
    }, relations: kind === "CREATE_POST" ? {
        author: true 
    } : {
        user: true, post: true 
    } 
} as never) as T
            await tx.query("UPDATE community_command_receipts SET result_target_id=$1 WHERE actor_id=$2 AND course_id=$3 AND operation_kind=$4 AND idempotency_key=$5",
                [result.id,
                    params.user.id,
                    params.courseId,
                    kind,
                    params.idempotencyKey])
            await this.outbox(tx,
                kind === "CREATE_POST" ? "POST_CREATED" : "COMMENT_CREATED",
                params.courseId,
                kind === "CREATE_POST" ? result.id : (params as CourseCommunityCreateCommentParams).postId,
                kind === "CREATE_COMMENT" ? result.id : undefined)
            return result
        })
    }

    private async outbox(tx: EntityManager, kind: string, courseId: string, postId: string, commentId?: string): Promise<void> {
        const eventKey = `${kind}:${postId}:${commentId ?? ""}:${Date.now()}:${Math.random()}`
        await tx.query("INSERT INTO community_outbox(event_key, kind, payload) VALUES ($1,$2,$3::jsonb)",
            [eventKey,
                kind,
                JSON.stringify({
                    schemaVersion: 1, scope: CommunityScope.Course, courseId, postId, commentId: commentId ?? null 
                })])
    }
}
