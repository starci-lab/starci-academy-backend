import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    In,
} from "typeorm"
import type {
    FindOptionsSelect,
    ObjectLiteral,
} from "typeorm"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    CodingProblemEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"
import {
    CacheKey,
} from "@modules/integrations/cache/enums/cache-key"
import {
    toUnknownRecord,
} from "@modules/lib/common/utils/unknown-record"
import {
    toGlobalId,
} from "./utils/global-id"
import type {
    EntityRef,
    FillFromCacheParams,
    FillFromDatabaseParams,
    LabelKind,
    LabelRow,
    ResolveLabelsParams,
} from "./types/label"

@Injectable()
/**
 * Service that resolves a batch of entity references (`{ entityName, id }`) into
 * display labels, batched per entity kind and cached in Redis to avoid the N+1
 * problem when rendering id-only references (activity / notification feeds).
 *
 * Algorithm per call:
 *   1. Dedupe refs and group them by `entityName`.
 *   2. For each known kind, bulk-read the Redis cache for every id.
 *   3. Issue ONE `WHERE id IN (...)` query for the cache misses, then warm the cache.
 *   4. Return a Map keyed by `toGlobalId(entityName, id)` -> label.
 *
 * Unknown entity names are skipped (they produce no Map entry).
 *
 * @example
 * const labels = await service.resolveLabels({
 *     refs: [{ entityName: CourseEntity.name, id }],
 *     locale: Locale.Vi,
 * })
 * const label = labels.get(toGlobalId(CourseEntity.name, id))
 */
export class LabelResolverService {
    /**
     * Lookup table mapping a supported entity name to its query descriptor.
     * Built once per process from each entity's `.name` so the keys stay in sync
     * with the actual class names used by {@link toGlobalId}.
     *
     * TODO: localized labels -- `fillFromDatabase` below still reads the base
     * `labelColumn` regardless of `locale`; per-entity `*_translations` tables
     * (e.g. `CourseTranslationEntity`) already exist for every kind here except
     * `UserEntity` -- wire a `(entityId, locale, field="title"/"username")`
     * lookup against them (falling back to the base column when no row exists)
     * instead of always reading the base column.
     */
    private readonly kinds: Record<string, LabelKind> = {
        // courses, contents, challenges, milestone tasks and coding problems all label by `title`
        [CourseEntity.name]: {
            entity: CourseEntity, labelColumn: "title",
        },
        [ContentEntity.name]: {
            entity: ContentEntity, labelColumn: "title",
        },
        [ChallengeEntity.name]: {
            entity: ChallengeEntity, labelColumn: "title",
        },
        [MilestoneTaskEntity.name]: {
            entity: MilestoneTaskEntity, labelColumn: "title",
        },
        [CodingProblemEntity.name]: {
            entity: CodingProblemEntity, labelColumn: "title",
        },
        // users label by `username` (the cached Keycloak handle)
        [UserEntity.name]: {
            entity: UserEntity, labelColumn: "username",
        },
    }

    constructor(
        private readonly cacheService: CacheService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Resolve a batch of entity references into display labels.
     *
     * @param params - Refs to resolve plus the active locale.
     * @returns Map keyed by `toGlobalId(entityName, id)` -> label (unknown kinds omitted).
     */
    async resolveLabels({
        refs, locale,
    }: ResolveLabelsParams): Promise<Map<string, string>> {
        // accumulate the final globalId -> label mapping returned to the caller
        const labels = new Map<string, string>()

        // dedupe + group refs by entity name so each kind is queried at most once
        const idsByEntityName = this.groupUniqueIdsByEntityName(refs)

        // resolve every group in parallel -- each kind hits its own cache + table
        await Promise.all(
            Array.from(idsByEntityName.entries()).map(
                async ([entityName,
                    ids]) => {
                    // skip entity names we have no label source for (no Map entries produced)
                    const kind = this.kinds[entityName]
                    if (!kind) {
                        return
                    }

                    // first pass: pull whatever is already cached so we only query the misses
                    const missingIds = await this.fillFromCache({
                        entityName, ids, locale, labels,
                    })

                    // nothing left to query -> this kind was fully served from cache
                    if (missingIds.length === 0) {
                        return
                    }

                    // second pass: ONE batched DB read for the misses, then warm the cache
                    await this.fillFromDatabase({
                        entityName, ids: missingIds, locale, kind, labels,
                    })
                },
            ),
        )

        return labels
    }

    /**
     * Dedupe refs and group their ids by entity name.
     *
     * @param refs - Raw (possibly duplicated) entity references.
     * @returns Map of entityName -> unique array of ids.
     */
    private groupUniqueIdsByEntityName(
        refs: Array<EntityRef>,
    ): Map<string, Array<string>> {
        // entityName -> Set of ids guarantees each id is queried once per kind
        const seen = new Map<string, Set<string>>()
        for (const ref of refs) {
            // lazily create the per-entity id set on first sight
            const idSet = seen.get(ref.entityName) ?? new Set<string>()
            idSet.add(ref.id)
            seen.set(ref.entityName,
                idSet)
        }

        // materialize the Sets into plain arrays for downstream IN (...) queries
        const grouped = new Map<string, Array<string>>()
        for (const [entityName,
            idSet] of seen.entries()) {
            grouped.set(entityName,
                Array.from(idSet))
        }
        return grouped
    }

    /**
     * Bulk-read the cache for one entity kind, writing hits into `labels`.
     *
     * @param params - Entity name, candidate ids, locale, and the output Map.
     * @returns Ids that were NOT in the cache and still need a DB read.
     */
    private async fillFromCache({
        entityName, ids, locale, labels,
    }: FillFromCacheParams): Promise<Array<string>> {
        // accumulate ids that missed the cache for the follow-up DB query
        const missingIds: Array<string> = []

        // one cache GET per id -- manager already pipelines these to Redis
        await Promise.all(
            ids.map(async (id) => {
                // cache key args mirror the EntityLabel namespace: [entityName, id, locale]
                const cached = await this.cacheService.get({
                    key: CacheKey.EntityLabel,
                    args: [entityName,
                        id,
                        locale],
                })
                // a non-empty string is a real hit; anything else needs the DB
                if (typeof cached === "string" && cached.length > 0) {
                    labels.set(toGlobalId(entityName,
                        id),
                    cached)
                    return
                }
                missingIds.push(id)
            }),
        )

        return missingIds
    }

    /**
     * Run ONE `WHERE id IN (...)` query for the cache misses of a single kind,
     * write the labels into `labels`, and warm the cache.
     *
     * @param params - Entity name, missing ids, locale, kind descriptor, output Map.
     */
    private async fillFromDatabase({
        entityName, ids, locale, kind, labels,
    }: FillFromDatabaseParams): Promise<void> {
        // project only the id + the label column so the row payload stays tiny
        const select = {
            id: true,
            [kind.labelColumn]: true,
        } as FindOptionsSelect<ObjectLiteral>

        // single batched read for every missing id of this kind
        const rows = await this.entityManager.find(kind.entity,
            {
                where: {
                    id: In(ids),
                },
                select,
            })

        // map each row to a label, populate the output Map, and warm the cache
        await Promise.all(
            rows.map(async (row) => {
                // pull id + the dynamic label column via a typed view of the row
                const typedRow = toUnknownRecord(row)
                const id = String(typedRow.id)
                const rawLabel = typedRow[kind.labelColumn]

                // skip rows whose label column is null/empty -- nothing useful to show
                if (typeof rawLabel !== "string" || rawLabel.length === 0) {
                    return
                }
                const labelRow: LabelRow = {
                    id, label: rawLabel,
                }

                // expose the resolved label under the ref's global id
                labels.set(toGlobalId(entityName,
                    labelRow.id),
                labelRow.label)

                // warm the cache so subsequent feed renders skip the DB entirely
                await this.cacheService.set({
                    key: CacheKey.EntityLabel,
                    args: [entityName,
                        labelRow.id,
                        locale],
                    cacheResult: labelRow.label,
                })
            }),
        )
    }
}
