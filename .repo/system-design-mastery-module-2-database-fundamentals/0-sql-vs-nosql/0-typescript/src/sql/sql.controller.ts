/**
 * HTTP controller — routes for SQL (PostgreSQL) products.
 */
import {
    Body,
    Controller,
    Get,
    Param,
    Post,
} from "@nestjs/common"
import {
    SqlService,
    CreateProductDto,
} from "./sql.service"

/**
 * SQL controller — prefix `api/sql`.
 */
@Controller("api/sql")
export class SqlController {
    constructor(
        private readonly sqlService: SqlService,
    ) {}

    /**
     * POST /api/sql/products — Create a new product in PostgreSQL.
     *
     * Logic — Nhan body JSON va luu vao bang products (TypeORM).
     * Logic: Receive JSON body and save to products table (TypeORM).
     */
    @Post("products")
    create(@Body() dto: CreateProductDto) {
        return this.sqlService.create(dto)
    }

    /**
     * GET /api/sql/products — Get all products from PostgreSQL.
     *
     * Logic — Tra ve danh sach san pham sap xep theo ngay tao giam dan.
     * Logic: Return product list sorted by creation date descending.
     */
    @Get("products")
    findAll() {
        return this.sqlService.findAll()
    }

    /**
     * GET /api/sql/products/category/:cat — Filter products by category.
     *
     * Logic — Dung WHERE clause de loc theo category trong PostgreSQL.
     * Logic: Use WHERE clause to filter by category in PostgreSQL.
     */
    @Get("products/category/:cat")
    findByCategory(@Param("cat") category: string) {
        return this.sqlService.findByCategory(category)
    }
}
