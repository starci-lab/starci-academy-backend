/** Parameters to check whether a collection exists. */
export interface CollectionExistsParams {
    collectionName: string
}

/** Result of collection existence check. */
export type CollectionExistsResult = boolean

/** Result containing all collection names in Qdrant. */
export type ListCollectionNamesResult = Array<string>
