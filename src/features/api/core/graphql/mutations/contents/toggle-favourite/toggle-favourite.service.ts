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
    ToggleFavouriteCommand,
} from "./toggle-favourite.command"
import {
    ToggleFavouriteRequest,
} from "./graphql-types"

@Injectable()
/** CommandBus hop so the resolver stays persistence-free. */
export class ToggleFavouriteService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<ToggleFavouriteRequest>,
    ): Promise<void> {
        return this.commandBus.execute(
            new ToggleFavouriteCommand(params),
        )
    }
}
