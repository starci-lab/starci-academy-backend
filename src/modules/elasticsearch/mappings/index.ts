import {
    ChallengeEntity,
    ContentEntity,
} from "@modules/databases"
import type {
    ElasticsearchIndexMapping,
} from "./types"
import {
    challengeIndexMapping,
} from "./challenge.mapping"
import {
    contentIndexMapping,
} from "./content.mapping"

export * from "./types"

/**
 * Registry of index mappings keyed by entity name (`Entity.name`). Add an entry here to give an
 * index an explicit mapping; entities without an entry keep Elasticsearch's dynamic mapping.
 */
const elasticsearchIndexMappings: Record<string, ElasticsearchIndexMapping> = {
    [ChallengeEntity.name]: challengeIndexMapping,
    [ContentEntity.name]: contentIndexMapping,
}

/**
 * Resolve the index mapping for an entity, or `undefined` when none is registered.
 *
 * @param entity - Entity name (`Entity.name`).
 * @returns The mapping (settings + mappings) or `undefined`.
 */
export function resolveElasticsearchIndexMapping(
    entity: string,
): ElasticsearchIndexMapping | undefined {
    return elasticsearchIndexMappings[entity]
}
