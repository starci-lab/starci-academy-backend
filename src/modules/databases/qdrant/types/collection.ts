/** Parameters to check whether a collection exists. */
export interface CollectionExistsParams {
    collectionName: string
}

/** Result containing all collection names in Qdrant. */
export type ListCollectionNamesResult = Array<string>
