/**
 * NoSQL service — CRUD operations with MongoDB via Mongoose Model.
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
 * NoSQL product creation DTO.
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
                // Inject Mongoose model for Product schema.
        @InjectModel(Product.name)
        private readonly productModel: Model<ProductDocument>,
    ) {}

    /**
     * Logic: Create a new product in MongoDB.
     * Code: `model.create()`.
     */
    async create(dto: CreateProductDto): Promise<ProductDocument> {
        return this.productModel.create(dto)
    }

    /**
     * Logic: Create many products at once (bulk insert).
     * Code: `model.insertMany()`.
     */
    async createMany(dtos: CreateProductDto[]): Promise<void> {
        await this.productModel.insertMany(dtos)
    }

    /**
     * Logic: Get all products, sorted by creation date descending.
     * Code: `model.find().sort({ createdAt: -1 }).exec()`.
     */
    async findAll(): Promise<ProductDocument[]> {
        return this.productModel.find().sort({ createdAt: -1 }).exec()
    }

    /**
     * Logic: Find products by category (document filter).
     * Code: `model.find({ category })`.
     */
    async findByCategory(category: string): Promise<ProductDocument[]> {
        return this.productModel
            .find({ category })
            .sort({ createdAt: -1 })
            .exec()
    }

    /**
     * Logic: Search products by name (regex query).
     * Code: `model.find({ name: { $regex, $options: "i" } })`.
     */
    async search(keyword: string): Promise<ProductDocument[]> {
        return this.productModel
            .find({ name: { $regex: keyword, $options: "i" } })
            .sort({ createdAt: -1 })
            .exec()
    }

    /**
     * Logic: Delete all documents in products collection.
     * Code: `model.deleteMany({})`.
     */
    async deleteAll(): Promise<void> {
        await this.productModel.deleteMany({})
    }

    /**
     * Logic: Count total products.
     * Code: `model.countDocuments()`.
     */
    async count(): Promise<number> {
        return this.productModel.countDocuments()
    }
}
