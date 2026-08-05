import {
    Inject,
} from "@nestjs/common"
import {
    ELASTICSEARCH,
} from "./constants"

/** Inject the shared Elasticsearch client (token {@link ELASTICSEARCH}). */
export const InjectElasticsearch = () => Inject(ELASTICSEARCH)

