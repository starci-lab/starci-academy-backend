import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    RemoveFromFavoritesCommand,
} from "./remove-from-favorites.command"
import {
    RemoveFromFavoritesRequest,
    RemoveFromFavoritesResponse,
} from "./graphql-types"

@Injectable()
export class RemoveFromFavoritesService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<RemoveFromFavoritesRequest>,
    ): Promise<RemoveFromFavoritesResponse> {
        return this.commandBus.execute(
            new RemoveFromFavoritesCommand(params),
        )
    }
}
