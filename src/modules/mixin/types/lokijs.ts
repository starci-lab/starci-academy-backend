import type {
    Collection,
} from "lokijs"

/** Params for creating a LokiJS collection. */
export interface CreateCollectionParams<T extends object> {
    /** The name of the LokiJS collection to create. */
    name: string
    /** Optional partial LokiJS collection options (indices, unique keys, etc.). */
    options?: Partial<CollectionOptions<T>>
}

/** Result of create collection (the collection instance). */
export type CreateCollectionResult<T extends object> = Collection<T>
