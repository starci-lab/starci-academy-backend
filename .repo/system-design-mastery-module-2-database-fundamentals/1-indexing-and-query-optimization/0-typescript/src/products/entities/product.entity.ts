/**
 * Product entity — `products` table used for index demo.
 */
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from "typeorm"

/**
 * Composite index (category, price) — optimizes queries filtering by category and price.
 *
 * Single index (brand) — optimizes queries searching by brand.
 *
 * Single index (sku) — optimizes queries searching by SKU.
 */
@Entity("products")
@Index("idx_category_price", ["category", "price"])
@Index("idx_brand", ["brand"])
@Index("idx_sku", ["sku"])
export class ProductEntity {
    /**
     * Auto-generated UUID primary key.
     */
    @PrimaryGeneratedColumn("uuid")
        id: string

    /**
     * Product name.
     */
    @Column({ type: "varchar", length: 255 })
        name: string

    /**
     * Unique SKU code.
     */
    @Column({ type: "varchar", length: 100, unique: true })
        sku: string

    /**
     * Product price (10 digits, 2 decimals).
     */
    @Column({ type: "decimal", precision: 10, scale: 2 })
        price: number

    /**
     * Product category.
     */
    @Column({ type: "varchar", length: 100 })
        category: string

    /**
     * Brand.
     */
    @Column({ type: "varchar", length: 100 })
        brand: string

    /**
     * Description (nullable).
     */
    @Column({ type: "text", nullable: true })
        description: string

    /**
     * Stock quantity.
     */
    @Column({ type: "int", default: 0 })
        stock: number

    /**
     * Average rating (3 digits, 1 decimal).
     */
    @Column({ type: "decimal", precision: 3, scale: 1, default: 0 })
        rating: number

    /**
     * Created date — auto-filled by TypeORM.
     */
    @CreateDateColumn({ name: "created_at" })
        createdAt: Date
}
