import {
    Inject,
} from "@nestjs/common"
import {
    ELASTICSEARCH,
} from "./constants"

export const InjectElasticsearch = () => Inject(ELASTICSEARCH)

