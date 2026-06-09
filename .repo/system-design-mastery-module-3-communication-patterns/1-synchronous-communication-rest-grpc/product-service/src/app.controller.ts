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
 * Class `AppController` — gRPC backend for ProductService.
 */
@Controller()
export class AppController {
    private readonly logger = new Logger(AppController.name)

    constructor(private readonly appService: AppService) {}

    /**
     * Logic — Receives gRPC `GetProduct` request, returns product from memory.
     * Code — `@GrpcMethod` maps to `ProductService.GetProduct` in proto.
     */
    @GrpcMethod("ProductService", "GetProduct")
    getProduct(data: { id: number }) {
        this.logger.log(`gRPC GetProduct id=${data.id}`)
        return this.appService.getProduct(data.id)
    }
}
