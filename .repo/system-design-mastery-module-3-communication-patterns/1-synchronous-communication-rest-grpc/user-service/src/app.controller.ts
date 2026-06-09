/**
 * Controller — routes delegate to service.
 */
import {
    Controller,
    Logger,
} from "@nestjs/common"
import {
    GrpcMethod,
} from "@nestjs/microservices"
import {
    AppService,
} from "./app.service"

/**
 * Class `AppController` — gRPC backend for UserService.
 */
@Controller()
export class AppController {
    private readonly logger = new Logger(AppController.name)

    constructor(private readonly appService: AppService) {}

    /**
     * Logic — Receives gRPC `GetUser` request, returns user from memory.
     * Code — `@GrpcMethod` maps to `UserService.GetUser` in proto.
     */
    @GrpcMethod("UserService", "GetUser")
    getUser(data: { id: number }) {
        this.logger.log(`gRPC GetUser id=${data.id}`)
        return this.appService.getUser(data.id)
    }
}
