import type {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import type {
    ObjectLiteral,
} from "typeorm"

/** Params for indexing a single document into Elasticsearch. */
export interface IndexEntityParams<T extends ObjectLiteral> {
    /** TypeORM entity instance (used for determining index name). */
    entity: T
    /** Document body to index. */
    data: ObjectLiteral
    /** Optional locale suffix for the index name. */
    locale?: Locale
}

