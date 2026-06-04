/**
 * Users controller — REST endpoints for sharding strategies demo.
 */
import {
    Controller,
    Get,
    Post,
    Param,
    Query,
    Body,
} from "@nestjs/common"
import {
    UsersService,
} from "./users.service"
import {
    User,
} from "./schemas"

@Controller("api")
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) {}

    /**
     * POST /api/users — Create a new user.
     */
    @Post("users")
    createUser(@Body() body: Partial<User>) {
        return this.usersService.create(body)
    }

    /**
     * GET /api/users/:userId — Targeted point query (hits exactly 1 shard).
     */
    @Get("users/:userId")
    findByUserId(@Param("userId") userId: string) {
        return this.usersService.findByUserId(userId)
    }

    /**
     * GET /api/users/country/:country — Scatter-gather query (scans multiple shards).
     */
    @Get("users/country/:country")
    findByCountry(@Param("country") country: string) {
        return this.usersService.findByCountry(country)
    }

    /**
     * GET /api/users/tier/:tier — Scatter-gather query by tier.
     */
    @Get("users/tier/:tier")
    findByTier(@Param("tier") tier: string) {
        return this.usersService.findByTier(tier)
    }

    /**
     * POST /api/seed/:count — Seed test data into the cluster.
     */
    @Post("seed/:count")
    seed(@Param("count") count: string) {
        return this.usersService.seed(parseInt(count, 10))
    }

    /**
     * GET /api/shards/distribution — Data distribution stats across shards.
     */
    @Get("shards/distribution")
    getShardDistribution() {
        return this.usersService.getShardDistribution()
    }

    /**
     * GET /api/shards/status — Cluster status (shards, chunks, collections).
     */
    @Get("shards/status")
    getShardStatus() {
        return this.usersService.getShardStatus()
    }

    /**
     * GET /api/shards/explain?field=...&value=... — Explain execution plan.
     */
    @Get("shards/explain")
    explainQuery(
        @Query("field") field: string,
        @Query("value") value: string,
    ) {
        return this.usersService.explainQuery(field, value)
    }
}
