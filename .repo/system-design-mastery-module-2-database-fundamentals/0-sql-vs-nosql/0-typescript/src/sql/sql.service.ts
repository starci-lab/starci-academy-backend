/**
 * SQL service — CRUD operations with PostgreSQL via TypeORM Repository.
 */
import {
    Injectable,
} from "@nestjs/common"
import {
    InjectRepository,
} from "@nestjs/typeorm"
import {
    Like,
    Repository,
} from "typeorm"
import {
    ProductEntity,
} from "./entities/product.entity"

/**
 * SQL product creation DTO.
 */
export interface CreateProductDto {
    name: string
    price: number
    category: string
    metadata?: Record<string, unknown> | null
}

@Injectable()
export class SqlService {
    constructor(
                // Inject TypeORM repository for ProductEntity.
        @InjectRepository(ProductEntity)
        private readonly productRepository: Repository<ProductEntity>,
    ) {}

    /**
     * Logic: Create a new product in PostgreSQL.
     * Code: `repository.create()` + `repository.save()`.
     */
    async create(dto: CreateProductDto): Promise<ProductEntity> {
        const product = this.productRepository.create(dto)
        return this.productRepository.save(product)
    }

    /**
     * Logic: Create many products at once (bulk insert).
     * Code: `repository.save()` with entity array.
     */
    async createMany(dtos: CreateProductDto[]): Promise<void> {
        await this.productRepository.save(
            dtos.map((dto) => this.productRepository.create(dto)),
        )
    }

    /**
     * Logic: Get all products, sorted by creation date descending.
     * Code: `repository.find()` with `order: { createdAt: "DESC" }`.
     */
    async findAll(): Promise<ProductEntity[]> {
        return this.productRepository.find({ order: { createdAt: "DESC" } })
    }

    /**
     * Logic: Find products by category (WHERE clause).
     * Code: `repository.find()` with `where: { category }`.
     */
    async findByCategory(category: string): Promise<ProductEntity[]> {
        return this.productRepository.find({
            where: { category },
            order: { createdAt: "DESC" },
        })
    }

    /**
     * Logic: Search products by name (LIKE query).
     * Code: TypeORM `Like(\`%${keyword}%\`)` operator.
     */
    async search(keyword: string): Promise<ProductEntity[]> {
        return this.productRepository.find({
            where: { name: Like(`%${keyword}%`) },
            order: { createdAt: "DESC" },
        })
    }

    /**
     * Logic: Delete all data in products table.
     * Code: `repository.clear()` (TRUNCATE).
     */
    async deleteAll(): Promise<void> {
        await this.productRepository.clear()
    }

    /**
     * Logic: Count total products.
     * Code: `repository.count()`.
     */
    async count(): Promise<number> {
        return this.productRepository.count()
    }
}
