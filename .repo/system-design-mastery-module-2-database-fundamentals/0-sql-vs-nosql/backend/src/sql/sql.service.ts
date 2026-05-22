/**
 * Service SQL — thao tac CRUD voi PostgreSQL qua TypeORM Repository.
 * (EN: SQL service — CRUD operations with PostgreSQL via TypeORM Repository.)
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
 * DTO tao san pham SQL.
 * (EN: SQL product creation DTO.)
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
        // Inject TypeORM repository cho entity ProductEntity.
        // (EN: Inject TypeORM repository for ProductEntity.)
        @InjectRepository(ProductEntity)
        private readonly productRepository: Repository<ProductEntity>,
    ) {}

    /**
     * Logic — Tao mot san pham moi trong PostgreSQL.
     * Code — `repository.create()` + `repository.save()`.
     * (EN Logic: Create a new product in PostgreSQL.)
     * (EN Code: `repository.create()` + `repository.save()`.)
     */
    async create(dto: CreateProductDto): Promise<ProductEntity> {
        const product = this.productRepository.create(dto)
        return this.productRepository.save(product)
    }

    /**
     * Logic — Tao nhieu san pham cung luc (bulk insert).
     * Code — `repository.save()` voi mang entity.
     * (EN Logic: Create many products at once (bulk insert).)
     * (EN Code: `repository.save()` with entity array.)
     */
    async createMany(dtos: CreateProductDto[]): Promise<void> {
        await this.productRepository.save(
            dtos.map((dto) => this.productRepository.create(dto)),
        )
    }

    /**
     * Logic — Lay tat ca san pham, sap xep theo ngay tao giam dan.
     * Code — `repository.find()` voi `order: { createdAt: "DESC" }`.
     * (EN Logic: Get all products, sorted by creation date descending.)
     * (EN Code: `repository.find()` with `order: { createdAt: "DESC" }`.)
     */
    async findAll(): Promise<ProductEntity[]> {
        return this.productRepository.find({ order: { createdAt: "DESC" } })
    }

    /**
     * Logic — Tim san pham theo category (WHERE clause).
     * Code — `repository.find()` voi `where: { category }`.
     * (EN Logic: Find products by category (WHERE clause).)
     * (EN Code: `repository.find()` with `where: { category }`.)
     */
    async findByCategory(category: string): Promise<ProductEntity[]> {
        return this.productRepository.find({
            where: { category },
            order: { createdAt: "DESC" },
        })
    }

    /**
     * Logic — Tim kiem san pham theo ten (LIKE query).
     * Code — `Like(\`%${keyword}%\`)` cua TypeORM.
     * (EN Logic: Search products by name (LIKE query).)
     * (EN Code: TypeORM `Like(\`%${keyword}%\`)` operator.)
     */
    async search(keyword: string): Promise<ProductEntity[]> {
        return this.productRepository.find({
            where: { name: Like(`%${keyword}%`) },
            order: { createdAt: "DESC" },
        })
    }

    /**
     * Logic — Xoa toan bo du lieu trong bang products.
     * Code — `repository.clear()` (TRUNCATE).
     * (EN Logic: Delete all data in products table.)
     * (EN Code: `repository.clear()` (TRUNCATE).)
     */
    async deleteAll(): Promise<void> {
        await this.productRepository.clear()
    }

    /**
     * Logic — Dem tong so san pham.
     * Code — `repository.count()`.
     * (EN Logic: Count total products.)
     * (EN Code: `repository.count()`.)
     */
    async count(): Promise<number> {
        return this.productRepository.count()
    }
}
