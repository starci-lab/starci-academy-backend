import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    ReviewCvCommand,
    ReviewCvCommandParams,
} from "./review-cv.command"
import {
    ReviewCvResponse,
} from "./graphql-types"

@Injectable()
export class ReviewCvService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ReviewCvCommandParams,
    ): Promise<ReviewCvResponse> {
        return this.commandBus.execute(
            new ReviewCvCommand(params),
        )
    }
}
