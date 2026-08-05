import {
    Injectable,
} from "@nestjs/common"
import {
    AiModelsHandler,
} from "./ai-models.handler"
import type {
    AiModelsResponseData,
} from "./graphql-types/response"

@Injectable()
/** Thin bridge from the `aiModels` resolver to `AiModelsHandler`. */
export class AiModelsService {
    constructor(
        private readonly handler: AiModelsHandler,
    ) {}

    async execute(): Promise<AiModelsResponseData> {
        return this.handler.execute()
    }
}
