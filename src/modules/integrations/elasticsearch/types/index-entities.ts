import type {
    Locale,
} from "@modules/databases"
import type {
    ObjectLiteral,
} from "typeorm"

/** Params for bulk indexing documents into Elasticsearch. */
export interface IndexEntitiesParams<T extends ObjectLiteral> {
    /** TypeORM entity instance (used for determining index name). */
    entity: T
    /** List of documents to index. */
    data: Array<ObjectLiteral>
    /** Optional locale suffix for the index name. */
    locale?: Locale
}

/** Result of bulk indexing documents. */
export type IndexEntitiesResult = void

