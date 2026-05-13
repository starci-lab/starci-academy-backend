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
    ReviewCvResponseData,
} from "./graphql-types"

@Injectable()
export class ReviewCvService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ReviewCvCommandParams,
    ): Promise<ReviewCvResponseData> {
        return this.commandBus.execute(
            new ReviewCvCommand(params),
        )
    }
}
