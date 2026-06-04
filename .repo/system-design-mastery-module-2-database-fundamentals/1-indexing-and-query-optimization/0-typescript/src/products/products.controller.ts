/**
 * Products controller — API for index and query optimization demo.
 */
import {
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
} from "@nestjs/common"
import {
    ProductsService,
} from "./products.service"

@Controller("api")
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    /**
     * POST /api/seed/:count — Seed product data.
     */
    @Post("seed/:count")
    seed(@Param("count", ParseIntPipe) count: number) {
        return this.productsService.seed(count)
    }

    /**
     * GET /api/query/no-index — Query without index (sequential scan).
     */
    @Get("query/no-index")
    findWithoutIndex(@Query("category") category: string) {
        return this.productsService.findWithoutIndex(category)
    }

    /**
     * GET /api/query/with-index — Query using composite index (category, price).
     */
    @Get("query/with-index")
    findWithIndex(
        @Query("category") category: string,
        @Query("minPrice") minPrice: string,
    ) {
        return this.productsService.findWithIndex(category, parseFloat(minPrice))
    }

    /**
     * GET /api/explain — Run EXPLAIN ANALYZE on SQL.
     */
    @Get("explain")
    explainQuery(@Query("sql") sql: string) {
        return this.productsService.explainQuery(sql)
    }

    /**
     * GET /api/compare — Compare queries with/without index.
     */
    @Get("compare")
    compareQueries() {
        return this.productsService.compareQueries()
    }

    /**
     * GET /api/stats — Get table and index statistics.
     */
    @Get("stats")
    getTableStats() {
        return this.productsService.getTableStats()
    }
}
