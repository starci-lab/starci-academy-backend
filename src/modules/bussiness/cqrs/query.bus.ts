import {
    Injectable,
} from "@nestjs/common"
import {
    ICqrsHandler,
} from "./icqrs-handler"

@Injectable()
export class QueryBus {
    async execute<TResponse>(handler: ICqrsHandler<TResponse>): Promise<TResponse> {
        return handler.execute()
    }
}
