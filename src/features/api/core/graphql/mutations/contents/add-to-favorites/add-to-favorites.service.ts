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
    AddToFavoritesCommand,
} from "./add-to-favorites.command"
import {
    AddToFavoritesRequest,
    AddToFavoritesResponse,
} from "./graphql-types"

@Injectable()
export class AddToFavoritesService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<AddToFavoritesRequest>,
    ): Promise<AddToFavoritesResponse> {
        return this.commandBus.execute(
            new AddToFavoritesCommand(params),
        )
    }
}
