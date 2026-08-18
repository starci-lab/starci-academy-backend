import type {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"

/**
 * Minimal Elasticsearch `_source` row shape used by the foundations handler
 * test helper to build a search response.
 */
export interface EsSourceRow {
    /** Foundation document id carried in the hit `_source`. */
    id: string
}

/**
 * Object form of the Elasticsearch `hits.total` field, as returned when the
 * cluster reports the total as a `{ value }` object rather than a bare number.
 */
export interface EsTotalValue {
    /** Total number of matching documents. */
    value: number
}

/**
 * Minimal mocked Elasticsearch client surface needed by the foundations
 * handler test, exposing only the `search` jest mock the handler invokes.
 */
export interface MockedEsClient {
    /** Jest mock standing in for `client.search`. */
    search: jest.Mock
}

/** The `client` field mixed onto the jest-mocked `ElasticsearchService`. */
export interface MockedElasticsearchServiceClientField {
    /** Minimal mocked Elasticsearch client. */
    client: MockedEsClient
}

/**
 * Mocked `ElasticsearchService` shape used as the test provider value: the real
 * `indicateName` method (jest-mocked) plus a minimal `client` exposing `search`.
 */
export type MockedElasticsearchService =
    jest.Mocked<Pick<ElasticsearchService, "indicateName">> & MockedElasticsearchServiceClientField
