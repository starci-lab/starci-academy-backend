import {
    ChallengeEntity,
    ContentEntity,
} from "@modules/databases"
import type {
    ElasticsearchIndexPatch,
} from "./types"
import {
    challengeIndexPatch,
} from "./challenge.patch"
import {
    contentIndexPatch,
} from "./content.patch"

export * from "./types"

/**
 * Registry of index patches keyed by entity name (`Entity.name`). Add an entry here to give an
 * index an explicit mapping; entities without an entry keep Elasticsearch's dynamic mapping.
 */
const elasticsearchIndexPatches: Record<string, ElasticsearchIndexPatch> = {
    [ChallengeEntity.name]: challengeIndexPatch,
    [ContentEntity.name]: contentIndexPatch,
}

/**
 * Resolve the index patch for an entity, or `undefined` when none is registered.
 *
 * @param entity - Entity name (`Entity.name`).
 * @returns The patch (settings + mappings) or `undefined`.
 */
export function resolveElasticsearchIndexPatch(
    entity: string,
): ElasticsearchIndexPatch | undefined {
    return elasticsearchIndexPatches[entity]
}
