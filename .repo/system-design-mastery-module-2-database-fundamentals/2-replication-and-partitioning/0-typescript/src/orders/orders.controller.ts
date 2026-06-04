/**
 * REST controller for orders — CRUD + replication status + partition info.
 */
import {
    Controller,
    Get,
    Post,
    Body,
    Param,
} from "@nestjs/common"
import {
    OrdersService,
} from "./orders.service"
import {
    OrderEntity,
    OrderStatus,
} from "./entities"

@Controller("api")
export class OrdersController {
    constructor(
        private readonly ordersService: OrdersService,
    ) {}

    /**
     * POST /api/orders — Create new order (write to master).
     */
    @Post("orders")
    async create(
        @Body() body: {
            customerId: string
            product: string
            amount: number
            region: string
            status?: OrderStatus
        },
    ): Promise<OrderEntity> {
        return this.ordersService.create(body)
    }

    /**
     * GET /api/orders — List orders (read from replica).
     */
    @Get("orders")
    async findAll(): Promise<OrderEntity[]> {
        return this.ordersService.findAll()
    }

    /**
     * GET /api/orders/region/:region — Filter orders by region (read from replica).
     */
    @Get("orders/region/:region")
    async findByRegion(
        @Param("region") region: string,
    ): Promise<OrderEntity[]> {
        return this.ordersService.findByRegion(region)
    }

    /**
     * GET /api/replication/status — Streaming replication status.
     */
    @Get("replication/status")
    async getReplicationStatus(): Promise<Record<string, unknown>[]> {
        return this.ordersService.getReplicationStatus()
    }

    /**
     * GET /api/partitions — Orders table partition info.
     */
    @Get("partitions")
    async getPartitionInfo(): Promise<Record<string, unknown>[]> {
        return this.ordersService.getPartitionInfo()
    }

    /**
     * POST /api/seed/:count — Seed sample data (write to master).
     */
    @Post("seed/:count")
    async seed(
        @Param("count") count: string,
    ): Promise<{ inserted: number }> {
        return this.ordersService.seed(Number(count))
    }
}
