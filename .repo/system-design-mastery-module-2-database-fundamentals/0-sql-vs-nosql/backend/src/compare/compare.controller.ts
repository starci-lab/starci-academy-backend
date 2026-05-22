/**
 * HTTP controller — routes seed va compare SQL vs NoSQL.
 * (EN: HTTP controller — seed and compare SQL vs NoSQL routes.)
 */
import {
    Controller,
    Get,
    Post,
    Query,
} from "@nestjs/common"
import {
    CompareService,
} from "./compare.service"

/**
 * Controller Compare — prefix `api`.
 * (EN: Compare controller — prefix `api`.)
 */
@Controller("api")
export class CompareController {
    constructor(
        private readonly compareService: CompareService,
    ) {}

    /**
     * POST /api/seed — Tao du lieu mau vao ca hai database.
     * (EN: POST /api/seed — Seed sample data into both databases.)
     *
     * Logic — Nhan query param `count` (mac dinh 1000), seed dong thoi vao PostgreSQL va MongoDB.
     * (EN Logic: Receive query param `count` (default 1000), seed concurrently into PostgreSQL and MongoDB.)
     */
    @Post("seed")
    seed(@Query("count") count?: string) {
        return this.compareService.seed(count ? parseInt(count, 10) : 1000)
    }

    /**
     * GET /api/compare — So sanh hieu nang truy van giua SQL va NoSQL.
     * (EN: GET /api/compare — Compare query performance between SQL and NoSQL.)
     *
     * Logic — Nhan query param `category` (mac dinh "Electronics"), benchmark findByCategory va search.
     * (EN Logic: Receive query param `category` (default "Electronics"), benchmark findByCategory and search.)
     */
    @Get("compare")
    compare(@Query("category") category?: string) {
        return this.compareService.compare(category || "Electronics")
    }
}
