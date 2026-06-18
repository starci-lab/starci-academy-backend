import {
    Injectable,
    Logger,
    type OnModuleInit,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import type {
    ReindexUserParams,
    ReindexAllUsersResult,
    UserSearchDoc,
} from "./types"

/**
 * How many users to load + bulk-index per page during a full re-index. Kept as
 * a local detail (not an env knob) — it only trades memory for round-trips and
 * never needs to differ per environment.
 */
const REINDEX_PAGE_SIZE = 500

/**
 * Keeps the non-localized `users` Elasticsearch index in sync with the
 * `users` Postgres table.
 *
 * This is the single source of truth for the user search document: both the
 * event-driven path ({@link reindexOne}, called by the CDC listener) and the
 * bulk backfill ({@link reindexAll}, called at seed/init) build the doc through
 * {@link buildDoc}. A user is always re-read from Postgres before indexing, so
 * the index reflects the authoritative row — a soft-deleted (or removed) user
 * is dropped from the index instead of indexed.
 *
 * NOTE: this is deliberately NOT a CQRS projection — it writes to Elasticsearch,
 * not to a Postgres read-model table.
 */
@Injectable()
export class EsSyncUserService implements OnModuleInit {
    /** Scoped logger so sync issues are easy to grep. */
    private readonly logger = new Logger(EsSyncUserService.name)

    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    /**
     * Ensure the single `users` index exists with its explicit mapping before
     * any document is written — so the CDC listener's first write lands in a
     * correctly-typed index rather than triggering dynamic mapping.
     */
    async onModuleInit(): Promise<void> {
        try {
            // locale omitted → the non-localized `users` index (not `users-vi`/`-en`)
            await this.elasticsearchService.ensureIndexForEntity({
                entity: UserEntity.name,
            })
        } catch (error) {
            // ES being unreachable at boot must not block the app — log + continue;
            // a later reindexAll / CDC event recreates the index on demand
            const cause = error instanceof Error ? error : new Error(String(error))
            this.logger.error(
                "Failed to ensure the `users` Elasticsearch index on boot",
                cause.stack,
            )
        }
    }

    /**
     * Map a user row to its search document (the searchable/displayable subset).
     *
     * @param user - the persisted user entity.
     * @returns the `users`-index document.
     */
    private buildDoc(user: UserEntity): UserSearchDoc {
        // project only the fields the index needs (identity + discovery signals)
        return {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            bio: user.bio,
            avatar: user.avatar,
            githubUsername: user.githubUsername,
            openToWork: user.openToWork,
            points: user.rewardPoints,
        }
    }

    /**
     * (Re)sync one user into the `users` index by id.
     *
     * Re-reads the authoritative row: a live user is indexed (upsert by id); a
     * missing or soft-deleted user is deleted from the index. Idempotent, so the
     * at-least-once CDC stream can safely re-deliver.
     *
     * @param params - the id of the user to sync.
     *
     * @example
     * await service.reindexOne({ userId })
     */
    async reindexOne(
        {
            userId,
        }: ReindexUserParams,
    ): Promise<void> {
        // load the source-of-truth row for this id
        const user = await this.entityManager.findOne(UserEntity,
            {
                where: {
                    id: userId,
                },
            })
        // gone or soft-deleted → ensure the index has no stale doc for it
        if (!user || user.isDeleted) {
            await this.elasticsearchService.deleteEntity({
                entity: UserEntity.name,
                id: userId,
            })
            return
        }
        // live user → upsert the document by id into the non-localized index
        await this.elasticsearchService.indexEntity({
            entity: UserEntity,
            data: this.buildDoc(user),
        })
    }

    /**
     * Bulk re-index every live user into the `users` index, then prune any
     * orphan docs (users that no longer exist / were soft-deleted). Used at
     * seed/init to backfill the index from the existing user base.
     *
     * @returns counts of indexed + pruned documents.
     */
    async reindexAll(): Promise<ReindexAllUsersResult> {
        // accumulate the ids we keep so we can prune everything else afterwards
        const liveIds: Array<string> = []
        // offset pagination over live users, ordered by id for a stable cursor
        let skip = 0
        // loop until a page comes back short (fewer than a full page = last page)
        for (;;) {
            // load one page of non-deleted users
            const users = await this.entityManager.find(UserEntity,
                {
                    where: {
                        isDeleted: false,
                    },
                    order: {
                        id: "ASC",
                    },
                    take: REINDEX_PAGE_SIZE,
                    skip,
                })
            // no more rows → done paging
            if (users.length === 0) {
                break
            }
            // bulk-index this page into the single `users` index (no locale)
            await this.elasticsearchService.indexEntities({
                entity: UserEntity,
                data: users.map((user) => this.buildDoc(user)),
            })
            // remember the indexed ids for the prune keep-list
            for (const user of users) {
                liveIds.push(user.id)
            }
            // advance the cursor; a short page means we just handled the last one
            skip += users.length
            if (users.length < REINDEX_PAGE_SIZE) {
                break
            }
        }
        // delete any doc whose id is NOT in the live set (orphans / soft-deleted)
        const pruned = await this.elasticsearchService.pruneOrphans({
            entity: UserEntity.name,
            ids: liveIds,
        })
        // surface the outcome for the caller's sync log
        return {
            indexed: liveIds.length,
            pruned,
        }
    }
}
