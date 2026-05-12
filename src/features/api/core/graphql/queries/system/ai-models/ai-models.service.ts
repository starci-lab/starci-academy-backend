import {
    Injectable,
} from "@nestjs/common"
import {
    AiModelsHandler,
} from "./ai-models.handler"
import type {
    AiModelsResponseData,
} from "./graphql-types"

@Injectable()
export class AiModelsService {
    constructor(
        private readonly handler: AiModelsHandler,
    ) {}

    execute(): AiModelsResponseData {
        return this.handler.execute()
    }
}
