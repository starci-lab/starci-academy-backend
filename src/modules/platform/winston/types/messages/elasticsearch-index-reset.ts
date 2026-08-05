/** Message for when the Elasticsearch index reset starts dropping/recreating indices at boot. */
export interface ElasticsearchIndexResetStartedMessage {
    /** Number of concrete indices (entity x locale) being dropped and recreated. */
    indexCount: number
}

/** Message for when the Elasticsearch index reset finishes; indices are empty and awaiting sync. */
export interface ElasticsearchIndexResetDoneMessage {
    /** Number of concrete indices dropped and recreated. */
    indexCount: number
}
