/**
 * TypeORM entity — `products` table in PostgreSQL.
 */
import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from "typeorm"

/**
 * Logic: Define `products` table schema with columns: id, name, price, category, metadata, created_at.
 * Code: Decorators `@Entity`, `@Column`, `@PrimaryGeneratedColumn`, `@CreateDateColumn`.
 */
@Entity("products")
export class ProductEntity {
        // Auto-generated UUID primary key.
    @PrimaryGeneratedColumn("uuid")
        id: string

        // Product name, max 255 characters.
    @Column({ type: "varchar", length: 255 })
        name: string

        // Product price, decimal 10 digits, 2 decimal places.
    @Column({ type: "decimal", precision: 10, scale: 2 })
        price: number

        // Product category.
    @Column({ type: "varchar", length: 100 })
        category: string

        // Extended metadata as JSON, nullable.
    @Column({ type: "simple-json", nullable: true })
        metadata: Record<string, unknown> | null

        // Creation timestamp, auto-set by TypeORM.
    @CreateDateColumn({ name: "created_at" })
        createdAt: Date
}
