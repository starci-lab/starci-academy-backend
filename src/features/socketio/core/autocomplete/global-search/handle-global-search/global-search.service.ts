import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import type {
    GlobalSearchSocketIoMessage,
} from "./types/message"
import type {
    GlobalSearchSocketIoPayload,
} from "./types/payload"
import type {
    ExecuteParams,
} from "../../../types/execute"
import {
    GlobalSearchQuery,
} from "./global-search.query"

@Injectable()
/**
 * Service responsible for executing global fuzzy search via CQRS QueryBus.
 */
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