import type {
    ElasticsearchIndexMapping,
} from "./types"

/**
 * Index mapping for the `consultants-*` indices.
 *
 * Types the real search/sort fields of an IT recruitment consultant and adds a
 * dedicated `suggest` field of type `completion` (an in-memory FST) powering
 * fast, ranked autocomplete -- the ES sync builder populates it with the bare
 * consultant name + a popularity weight derived from `orderIndex`. Localized
 * translation blobs are stored but not indexed.
 */
export const consultantsIndexMapping: ElasticsearchIndexMapping = {
    mappings: {
        dynamic: true,
        properties: {
            // primary-key id -- exact-match / lookup only
            id: {
                type: "keyword",
            },
            // stable routing identifier -- exact-match only
            displayId: {
                type: "keyword",
            },
            // full display name -- analyzed text so it is searchable
            fullName: {
                type: "text",
            },
            // job title at the company -- analyzed text
            jobTitle: {
                type: "text",
            },
            // short bio / introduction -- analyzed text
            description: {
                type: "text",
            },
            // avatar image URL -- stored only, never queried/analyzed
            avatarUrl: {
                type: "keyword",
                index: false,
            },
            // owning company id -- exact-match filter
            companyId: {
                type: "keyword",
            },
            // display order within the company -- used for ranking / sort
            orderIndex: {
                type: "integer",
            },
            sortIndex: {
                type: "integer",
            },
            // default locale for consultant copy -- exact-match only
            defaultLocale: {
                type: "keyword",
            },
            // FST-backed autocomplete field; populated by the ES sync builder
            suggest: {
                type: "completion",
            },
            // localized override blob -- stored, not indexed
            translations: {
                type: "object",
                enabled: false,
            },
        },
    },
}
