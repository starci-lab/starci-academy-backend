/**
 * Service NoSQL — thao tac CRUD voi MongoDB qua Mongoose Model.
 * (EN: NoSQL service — CRUD operations with MongoDB via Mongoose Model.)
 */
import {
    Injectable,
} from "@nestjs/common"
import {
    InjectModel,
} from "@nestjs/mongoose"
import {
    Model,
} from "mongoose"
import {
    Product,
    ProductDocument,
} from "./schemas/product.schema"

/**
 * DTO tao san pham NoSQL.
 * (EN: NoSQL product creation DTO.)
 */
export interface CreateProductDto {
    name: string
    price: number
    category: string
    metadata?: Record<string, unknown> | null
}

@Injectable()
export class NosqlService {
    constructor(
        // Inject Mongoose model cho schema Product.
        // (EN: Inject Mongoose model for Product schema.)
        @InjectModel(Product.name)
        private readonly productModel: Model<ProductDocument>,
    ) {}

    /**
     * Logic — Tao mot san pham moi trong MongoDB.
     * Code — `model.create()`.
     * (EN Logic: Create a new product in MongoDB.)
     * (EN Code: `model.create()`.)
     */
    async create(dto: CreateProductDto): Promise<ProductDocument> {
        return this.productModel.create(dto)
    }

    /**
     * Logic — Tao nhieu san pham cung luc (bulk insert).
     * Code — `model.insertMany()`.
     * (EN Logic: Create many products at once (bulk insert).)
     * (EN Code: `model.insertMany()`.)
     */
    async createMany(dtos: CreateProductDto[]): Promise<void> {
        await this.productModel.insertMany(dtos)
    }

    /**
     * Logic — Lay tat ca san pham, sap xep theo ngay tao giam dan.
     * Code — `model.find().sort({ createdAt: -1 }).exec()`.
     * (EN Logic: Get all products, sorted by creation date descending.)
     * (EN Code: `model.find().sort({ createdAt: -1 }).exec()`.)
     */
    async findAll(): Promise<ProductDocument[]> {
        return this.productModel.find().sort({ createdAt: -1 }).exec()
    }

    /**
     * Logic — Tim san pham theo category (filter document).
     * Code — `model.find({ category })`.
     * (EN Logic: Find products by category (document filter).)
     * (EN Code: `model.find({ category })`.)
     */
    async findByCategory(category: string): Promise<ProductDocument[]> {
        return this.productModel
            .find({ category })
            .sort({ createdAt: -1 })
            .exec()
    }

    /**
     * Logic — Tim kiem san pham theo ten (regex query).
     * Code — `model.find({ name: { $regex, $options: "i" } })`.
     * (EN Logic: Search products by name (regex query).)
     * (EN Code: `model.find({ name: { $regex, $options: "i" } })`.)
     */
    async search(keyword: string): Promise<ProductDocument[]> {
        return this.productModel
            .find({ name: { $regex: keyword, $options: "i" } })
            .sort({ createdAt: -1 })
            .exec()
    }

    /**
     * Logic — Xoa toan bo document trong collection products.
     * Code — `model.deleteMany({})`.
     * (EN Logic: Delete all documents in products collection.)
     * (EN Code: `model.deleteMany({})`.)
     */
    async deleteAll(): Promise<void> {
        await this.productModel.deleteMany({})
    }

    /**
     * Logic — Dem tong so san pham.
     * Code — `model.countDocuments()`.
     * (EN Logic: Count total products.)
     * (EN Code: `model.countDocuments()`.)
     */
    async count(): Promise<number> {
        return this.productModel.countDocuments()
    }
}
