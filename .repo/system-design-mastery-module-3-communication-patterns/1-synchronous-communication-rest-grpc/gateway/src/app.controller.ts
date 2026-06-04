/**
 * REST Gateway Controller — receives HTTP requests, forwards to gRPC backends.
 */
import {
    Controller,
    Get,
    Inject,
    Logger,
    OnModuleInit,
    Param,
} from "@nestjs/common"
import {
    ClientGrpc,
} from "@nestjs/microservices"
import {
    firstValueFrom,
    Observable,
} from "rxjs"

/**
 * gRPC User interface — matches `user.proto` service definition.
 */
interface UserGrpc {/**
 * Logic — Read/query via `getUser`.
 * Code — Query in-memory / DB / cache and map response.
 */
    getUser(data: { id: number }): Observable<{ id: number; name: string; email: string }>
}

/**
 * gRPC Product interface — matches `product.proto` service definition.
 */
interface ProductGrpc {/**
 * Logic — Read/query via `getProduct`.
 * Code — Query in-memory / DB / cache and map response.
 */
    getProduct(data: { id: number }): Observable<{ id: number; name: string; price: number }>
}

/**
 * Class `AppController` — lesson lab component.
 */
export class AppController implements OnModuleInit {
    private readonly logger = new Logger(AppController.name)
    private userSvc!: UserGrpc
    private productSvc!: ProductGrpc

    constructor(
        @Inject("USER_SERVICE") private readonly userClient: ClientGrpc,
        @Inject("PRODUCT_SERVICE") private readonly productClient: ClientGrpc,
    ) {}

    /**
     * Logic — Gets gRPC stubs from clients when module initializes.
     * Code — Calls `getService()` matching the service name in proto.
     */
    onModuleInit() {
        this.userSvc = this.userClient.getService<UserGrpc>("UserService")
        this.productSvc = this.productClient.getService<ProductGrpc>("ProductService")
    }

    /**
     * Logic — Client calls REST `GET /users/:id`, gateway forwards to gRPC `GetUser`.
     * Code — `firstValueFrom` converts gRPC Observable to Promise for REST response.
     */
    @Get("users/:id")
    async getUser(@Param("id") id: string) {
        this.logger.log(`REST → gRPC: GetUser id=${id}`)
        return firstValueFrom(this.userSvc.getUser({ id: +id }))
    }

    /**
     * Logic — Client calls REST `GET /products/:id`, gateway forwards to gRPC `GetProduct`.
     * Code — Same as `getUser`, forwards to Product gRPC backend.
     */
    @Get("products/:id")
    async getProduct(@Param("id") id: string) {
        this.logger.log(`REST → gRPC: GetProduct id=${id}`)
        return firstValueFrom(this.productSvc.getProduct({ id: +id }))
    }
}
