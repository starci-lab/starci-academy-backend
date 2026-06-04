/**
 * HTTP controller — routes for NoSQL (MongoDB) products.
 */
import {
    Body,
    Controller,
    Get,
    Param,
    Post,
} from "@nestjs/common"
import {
    NosqlService,
    CreateProductDto,
} from "./nosql.service"

/**
 * NoSQL controller — prefix `api/nosql`.
 */
@Controller("api/nosql")
export class NosqlController {
    constructor(
        private readonly nosqlService: NosqlService,
    ) {}

    /**
     * POST /api/nosql/products — Create a new product in MongoDB.
     *
     * Logic — Nhan body JSON va luu vao collection products (Mongoose).
     * Logic: Receive JSON body and save to products collection (Mongoose).
     */
    @Post("products")
    create(@Body() dto: CreateProductDto) {
        return this.nosqlService.create(dto)
    }

    /**
     * GET /api/nosql/products — Get all products from MongoDB.
     *
     * Logic — Tra ve danh sach san pham sap xep theo ngay tao giam dan.
     * Logic: Return product list sorted by creation date descending.
     */
    @Get("products")
    findAll() {
        return this.nosqlService.findAll()
    }

    /**
     * GET /api/nosql/products/category/:cat — Filter products by category.
     *
     * Logic — Dung filter document de loc theo category trong MongoDB.
     * Logic: Use document filter to filter by category in MongoDB.
     */
    @Get("products/category/:cat")
    findByCategory(@Param("cat") category: string) {
        return this.nosqlService.findByCategory(category)
    }
}
