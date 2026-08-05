import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    ActivityReactionEntity,
    CommentReactionEntity,
    ContentCommentEntity,
    ContentEntity,
    ContentReactionEntity,
    InjectPrimaryPostgreSQLEntityManager,
    ReactionType,
} from "@modules/databases"
import {
    ActivityNotFoundException,
    ActivitySelfReactionException,
    CommentNotFoundException,
} from "@modules/exceptions"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
import {
    ContentEngagementProjectionService,
} from "../projections"
import {
    UserService,
} from "../user"
import type {
    ActivityOwnerRow,
    CommentReactionCountRow,
    CommentReactionRow,
    ReactionCountInputRow,
    ReactionCountResult,
    ReactionSummaryResult,
    ReactToActivityParams,
    ReactToCommentParams,
    ReactToContentParams,
    SummarizeCommentReactionsParams,
    SummarizeContentReactionsParams,
} from "./types"

@Injectable()
/**
 * Domain service for Facebook-style reactions on contents and comments.
 *
 * Each user holds at most one reaction per target (enforced by composite uniques on the
 * entities). Picking the same/another emotion updates the row; passing `null` removes it.
 * Every change fans out a local event for the Socket.IO gateway to push to the content room.
 */
export class ReactionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly eventEmitterService: EventEmitterService,
        private readonly contentEngagementProjectionService: ContentEngagementProjectionService,
        private readonly userService: UserService,
    ) {}

    /**
     * Sets, changes, or removes the current user's reaction on a content.
     * @param params - {@link ReactToContentParams}
     * @returns The fresh reaction summary for the content from this user's view.
     */
    async reactToContent({
        contentId,
        user,
        type,
    }: ReactToContentParams): Promise<ReactionSummaryResult> {
        // find the user's existing reaction on this content (at most one by unique)
        const existing = await this.entityManager.findOne(ContentReactionEntity,
            {
                where: {
                    content: {
                        id: contentId,
                    },
                    user: {
                        id: user.id,
                    },
                },
            })
        // null type means "remove my reaction" — delete only if one exists
        if (type === null) {
            if (existing) {
                await this.entityManager.remove(existing)
            }
        } else if (existing) {
            // already reacted → just switch the emotion in place
            existing.type = type
            await this.entityManager.save(existing)
        } else {
            // resolve the course for this content so we can key the row by enrollment
            // (user × course) — the anchor going forward — while still setting user_id
            // during the re-key transition.
            const content = await this.entityManager.findOne(ContentEntity,
                {
                    where: {
                        id: contentId,
                    },
                    relations: {
                        module: {
                            course: true,
                        },
                    },
                })
            const courseId = content?.module?.courseId ?? null
            const enrollment = courseId
                ? await this.userService.resolveOrCreateTrialEnrollment(
                    user.id,
                    courseId,
                )
                : null
            // first-time reaction → insert a new row via relation ids; key by
            // enrollment going forward (set BOTH columns during the transition).
            await this.entityManager.save(this.entityManager.create(ContentReactionEntity,
                {
                    type,
                    content: {
                        id: contentId,
                    },
                    user: {
                        id: user.id,
                    },
                    ...(enrollment
                        ? {
                            enrollment,
                        }
                        : {
                        }),
                }))
        }
        // tell the room the content's reaction totals moved
        await this.eventEmitterService.emit({
            event: EventName.ContentReactionChanged,
            payload: {
                contentId,
            },
        })
        // refresh the engagement projection inline so the returned summary + the
        // next read are immediately fresh (CDC also covers this asynchronously)
        await this.contentEngagementProjectionService.recompute({
            contentId,
        })
        // return the recomputed summary so the caller can answer the mutation immediately
        return this.summarizeContent({
            contentId,
            userId: user.id,
        })
    }

    /**
     * Sets, changes, or removes the current user's reaction on a FEED ACTIVITY.
     * A user can never react to their own activity (enforced here). No engagement
     * projection — counts are read live from `activity_reactions` (the feed query
     * also reads them inline; reactions on a feed are an explicit CQRS exception).
     * @param params - {@link ReactToActivityParams}
     * @returns The activity's fresh reaction summary from this user's view.
     */
    async reactToActivity({
        activityId,
        user,
        type,
    }: ReactToActivityParams): Promise<ReactionSummaryResult> {
        // guard: activity must exist + must NOT belong to the reactor (no self-react)
        const owners = await this.entityManager.query<Array<ActivityOwnerRow>>(
            "SELECT user_id AS \"userId\" FROM activities WHERE id = $1",
            [
                activityId,
            ],
        )
        const ownerId = owners[0]?.userId
        if (!ownerId) {
            throw new ActivityNotFoundException({
                activityId,
            })
        }
        if (ownerId === user.id) {
            throw new ActivitySelfReactionException({
                activityId,
                userId: user.id,
            })
        }
        // at most one reaction per (activity, user) — same upsert/delete shape as content
        const existing = await this.entityManager.findOne(ActivityReactionEntity,
            {
                where: {
                    activity: {
                        id: activityId,
                    },
                    user: {
                        id: user.id,
                    },
                },
            })
        if (type === null) {
            if (existing) {
                await this.entityManager.remove(existing)
            }
        } else if (existing) {
            existing.type = type
            await this.entityManager.save(existing)
        } else {
            await this.entityManager.save(this.entityManager.create(ActivityReactionEntity,
                {
                    type,
                    activity: {
                        id: activityId,
                    },
                    user: {
                        id: user.id,
                    },
                }))
        }
        // live grouped counts + the viewer's own pick (no projection)
        const countRows = await this.entityManager
            .createQueryBuilder(ActivityReactionEntity,
                "reaction")
            .select("reaction.type",
                "type")
            .addSelect("COUNT(*)",
                "count")
            .where("reaction.activity_id = :activityId",
                {
                    activityId,
                })
            .groupBy("reaction.type")
            .getRawMany<ReactionCountInputRow>()
        const mine = await this.entityManager.findOne(ActivityReactionEntity,
            {
                where: {
                    activity: {
                        id: activityId,
                    },
                    user: {
                        id: user.id,
                    },
                },
            })
        return this.buildSummary(countRows,
            mine?.type ?? null)
    }

    /**
     * Sets, changes, or removes the current user's reaction on a comment.
     * @param params - {@link ReactToCommentParams}
     * @returns The fresh reaction summary for the comment from this user's view.
     */
    async reactToComment({
        commentId,
        user,
        type,
    }: ReactToCommentParams): Promise<ReactionSummaryResult> {
        // resolve the comment first — we need its content id for the room event + a 404 guard
        const comment = await this.entityManager.findOne(ContentCommentEntity,
            {
                where: {
                    id: commentId,
                },
            })
        if (!comment) {
            throw new CommentNotFoundException({
                commentId,
            })
        }
        // find the user's existing reaction on this comment (at most one by unique)
        const existing = await this.entityManager.findOne(CommentReactionEntity,
            {
                where: {
                    comment: {
                        id: commentId,
                    },
                    user: {
                        id: user.id,
                    },
                },
            })
        // null type means "remove my reaction"
        if (type === null) {
            if (existing) {
                await this.entityManager.remove(existing)
            }
        } else if (existing) {
            // switch emotion in place
            existing.type = type
            await this.entityManager.save(existing)
        } else {
            // first-time reaction on this comment
            await this.entityManager.save(this.entityManager.create(CommentReactionEntity,
                {
                    type,
                    comment: {
                        id: commentId,
                    },
                    user: {
                        id: user.id,
                    },
                }))
        }
        // notify the room (scoped to the comment's content) of the change — a
        // course-general question has no content room (see comment.service.ts).
        if (comment.contentId) {
            await this.eventEmitterService.emit({
                event: EventName.CommentReactionChanged,
                payload: {
                    contentId: comment.contentId,
                    commentId,
                },
            })
        }
        // recompute via the batch summarizer, then pick this comment's bucket
        const summaries = await this.summarizeComments({
            commentIds: [
                commentId,
            ],
            userId: user.id,
        })
        // fall back to an empty summary if somehow absent (shouldn't happen)
        return summaries[commentId] ?? this.emptySummary()
    }

    /**
     * Returns the view count (distinct readers) for a content, read from the
     * content-engagement projection (replaces the old Redis view-count cache;
     * the projection lazily recomputes itself when stale).
     * @param contentId - The content UUID.
     * @returns Number of distinct users who have marked the content as read.
     */
    async getViewCount(contentId: string): Promise<number> {
        // view count is one column of the flat engagement projection row
        const summary = await this.contentEngagementProjectionService.getSummary(contentId)
        return summary.viewCount
    }

    /**
     * Refreshes the content's engagement projection so its view count reflects a
     * just-changed reader set. Called when a user marks a content read/unread.
     * (Kept the name for its single caller; it now recomputes instead of evicting.)
     * @param contentId - The content UUID whose projection to refresh.
     */
    async invalidateViewCount(contentId: string): Promise<void> {
        // read-state moved → recompute the engagement projection (idempotent UPSERT)
        await this.contentEngagementProjectionService.recompute({
            contentId,
        })
    }

    /**
     * Computes the reaction summary for a single content from a user's view.
     * Aggregate counters (counts/total/view/share) come from the flat
     * content-engagement projection; only the per-viewer `myReaction` is a live
     * lookup since it depends on who is asking.
     * @param params - {@link SummarizeContentReactionsParams}
     * @returns The content's reaction summary including view + share counts.
     */
    async summarizeContent({
        contentId,
        userId,
    }: SummarizeContentReactionsParams): Promise<ReactionSummaryResult> {
        // aggregate counters from the projection (lazy-recomputed if stale)
        const summary = await this.contentEngagementProjectionService.getSummary(contentId)
        // the viewing user's own reaction (per-viewer → single indexed lookup)
        const mine = await this.entityManager.findOne(ContentReactionEntity,
            {
                where: {
                    content: {
                        id: contentId,
                    },
                    user: {
                        id: userId,
                    },
                },
            })
        // expand the per-emotion jsonb map into the counts array shape callers expect
        const counts: Array<ReactionCountResult> = Object.entries(summary.reactionsByType)
            .map(([type,
                count]) => ({
                type: type as ReactionType,
                count: Number(count),
            }))
        // assemble the shared summary shape from projection counters + my reaction
        return {
            counts,
            total: summary.totalReactions,
            myReaction: mine?.type ?? null,
            viewCount: summary.viewCount,
            shareCount: summary.shareCount,
        }
    }

    /**
     * Batch-computes reaction summaries for many comments in two grouped queries.
     * @param params - {@link SummarizeCommentReactionsParams}
     * @returns Map of comment id → reaction summary (every requested id is present).
     */
    async summarizeComments({
        commentIds,
        userId,
    }: SummarizeCommentReactionsParams): Promise<Record<string, ReactionSummaryResult>> {
        // nothing requested → empty map (also guards an empty IN () clause)
        if (commentIds.length === 0) {
            return {
            }
        }
        // grouped counts per (comment, emotion) across all requested comments
        const countRows = await this.entityManager
            .createQueryBuilder(CommentReactionEntity,
                "reaction")
            .select("reaction.comment_id",
                "commentId")
            .addSelect("reaction.type",
                "type")
            .addSelect("COUNT(*)",
                "count")
            .where("reaction.comment_id IN (:...commentIds)",
                {
                    commentIds,
                })
            .groupBy("reaction.comment_id")
            .addGroupBy("reaction.type")
            .getRawMany<CommentReactionCountRow>()
        // the viewing user's own reaction per comment (for highlighting)
        const mineRows = await this.entityManager
            .createQueryBuilder(CommentReactionEntity,
                "reaction")
            .select("reaction.comment_id",
                "commentId")
            .addSelect("reaction.type",
                "type")
            .where("reaction.comment_id IN (:...commentIds)",
                {
                    commentIds,
                })
            .andWhere("reaction.user_id = :userId",
                {
                    userId,
                })
            .getRawMany<CommentReactionRow>()
        // index "my reaction" by comment id for O(1) lookup while assembling
        const myByComment = mineRows.reduce<Record<string, ReactionType>>((acc, row) => {
            acc[row.commentId] = row.type
            return acc
        },
        {
        })
        // bucket count rows by comment id so each comment gets its own counts array
        const countsByComment = countRows.reduce<Record<string, Array<ReactionCountResult>>>((acc, row) => {
            // lazily create the per-comment bucket on first sighting
            const bucket = acc[row.commentId] ?? []
            bucket.push({
                type: row.type,
                count: Number(row.count),
            })
            acc[row.commentId] = bucket
            return acc
        },
        {
        })
        // build a summary for EVERY requested id so callers never get an undefined bucket
        return commentIds.reduce<Record<string, ReactionSummaryResult>>((acc, commentId) => {
            acc[commentId] = this.buildSummary(
                countsByComment[commentId] ?? [],
                myByComment[commentId] ?? null,
            )
            return acc
        },
        {
        })
    }

    /**
     * Folds raw per-emotion counts into a {@link ReactionSummaryResult}.
     * viewCount and shareCount are set to 0 here; callers that need them must
     * spread the result and override (e.g. `summarizeContent` sets viewCount).
     * @param counts - Per-emotion count rows (string counts from raw SQL or numeric).
     * @param myReaction - The viewing user's own emotion, or null.
     * @returns The assembled summary.
     */
    private buildSummary(
        counts: Array<ReactionCountInputRow>,
        myReaction: ReactionType | null,
    ): ReactionSummaryResult {
        // normalize raw string counts (Postgres COUNT returns text) into numbers
        const normalized: Array<ReactionCountResult> = counts.map((count) => ({
            type: count.type,
            count: Number(count.count),
        }))
        // total is the sum across every emotion bucket
        const total = normalized.reduce((acc, count) => acc + count.count,
            0)
        return {
            counts: normalized,
            total,
            myReaction,
            // comment summaries never carry view/share counts
            viewCount: 0,
            shareCount: 0,
        }
    }

    /**
     * Builds an empty reaction summary (no reactions, no personal pick).
     * @returns A zeroed summary.
     */
    private emptySummary(): ReactionSummaryResult {
        return {
            counts: [],
            total: 0,
            myReaction: null,
            viewCount: 0,
            shareCount: 0,
        }
    }
}
