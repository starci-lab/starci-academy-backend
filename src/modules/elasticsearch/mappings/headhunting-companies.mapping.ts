import type {
    ElasticsearchIndexMapping,
} from "./types"

/**
 * Index mapping for the `headhunting-companies-*` indices.
 *
 * Types the real search/sort fields of a recruitment company and adds a dedicated
 * `suggest` field of type `completion` (an in-memory FST) powering fast, ranked
 * autocomplete — the ES sync builder populates it with the clean company name and
 * a popularity weight derived from `orderIndex`. The localized translation blob is
 * stored but not indexed so it cannot blow the dynamic field limit.
 */
export const headhuntingCompaniesIndexMapping: ElasticsearchIndexMapping = {
    mappings: {
        dynamic: true,
        properties: {
            // stable primary key — exact-match/term lookups only
            id: {
                type: "keyword",
            },
            // routing slug — exact-match only
            displayId: {
                type: "keyword",
            },
            // company display name — full-text searchable
            title: {
                type: "text",
            },
            // free-form company description — full-text searchable
            description: {
                type: "text",
            },
            // public website URL — stored, not analyzed for search
            websiteUrl: {
                type: "keyword",
                index: false,
            },
            // logo image URL — stored, not analyzed for search
            logoUrl: {
                type: "keyword",
                index: false,
            },
            // display order — drives the suggest weight and list sorting
            orderIndex: {
                type: "integer",
            },
            // pure reorder index, decoupled from orderIndex
            sortIndex: {
                type: "integer",
            },
            // default locale for company copy — exact-match only
            defaultLocale: {
                type: "keyword",
            },
            // FST-backed autocomplete field; populated by the ES sync builder
            suggest: {
                type: "completion",
            },
            // localized override blob — stored, not indexed
            translations: {
                type: "object",
                enabled: false,
            },
        },
    },
}
