import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    GlobalSearchQuery,
} from "./types"
import {
    TypedSocket,
} from "@modules/socketio"
import type {
    AutocompleteGlobalSearchExecuteParams,
    AutocompleteGlobalSearchExecuteResult,
    AutocompleteGlobalSearchClient,
    BuildAutocompleteGlobalSearchPayloadParams,
    BuildAutocompleteGlobalSearchPayloadResult,
} from "./types"
import {
    AutocompleteGlobalSearchRequest,
} from "./graphql-types"

@Injectable()
export class AutocompleteGlobalSearchService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    private buildPayload(
        {
            request,
            locale,
        }: BuildAutocompleteGlobalSearchPayloadParams,
    ): BuildAutocompleteGlobalSearchPayloadResult {
        return {
            locale,
            data: {
                query: request.query,
                entities: (request.entities ?? []) as Array<SearchableEntity>,
                size: request.size,
            },
        }
    }

    async execute(
        {
            request,
            locale,
            user,
        }: AutocompleteGlobalSearchExecuteParams,
    ): Promise<AutocompleteGlobalSearchExecuteResult> {
        const payload: AutocompleteGlobalSearchRequest = this.buildPayload(
            {
                request,
                locale,
            },
        )

        const clientMinimal: AutocompleteGlobalSearchClient = {
            data: {
                userId: user.keycloakId,
            },
        }

        return this.queryBus.execute(
            new GlobalSearchQuery(
                {
                    payload,
                    client: clientMinimal as unknown as TypedSocket,
                },
            ),
        )
    }
}

