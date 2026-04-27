import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import type {
    GlobalSearchSocketIoPayload,
    GlobalSearchSocketIoMessage,
} from "./types"
import type {
    ExecuteParams,
} from "../../../types"
import {
    GlobalSearchQuery,
} from "./global-search.query"

/**
 * Service responsible for executing global fuzzy search via CQRS QueryBus.
 */
@Injectable()
export class GlobalSearchService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * Executes global search query.
     *
     * @param payload - Search payload
     * @returns Search message
     */
    async execute(
        params: ExecuteParams<GlobalSearchSocketIoPayload>,
    ): Promise<GlobalSearchSocketIoMessage> {
        return this.queryBus.execute(
            new GlobalSearchQuery(params),
        )
    }
}