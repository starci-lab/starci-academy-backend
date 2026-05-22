/**
 * Entity TypeORM — bang `products` trong PostgreSQL.
 * (EN: TypeORM entity — `products` table in PostgreSQL.)
 */
import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from "typeorm"

/**
 * Logic — Dinh nghia schema bang `products` voi cac cot: id, name, price, category, metadata, created_at.
 * Code — Decorator `@Entity`, `@Column`, `@PrimaryGeneratedColumn`, `@CreateDateColumn`.
 * (EN Logic: Define `products` table schema with columns: id, name, price, category, metadata, created_at.)
 * (EN Code: Decorators `@Entity`, `@Column`, `@PrimaryGeneratedColumn`, `@CreateDateColumn`.)
 */
@Entity("products")
export class ProductEntity {
    // Khoa chinh UUID tu dong sinh.
    // (EN: Auto-generated UUID primary key.)
    @PrimaryGeneratedColumn("uuid")
        id: string

    // Ten san pham, toi da 255 ky tu.
    // (EN: Product name, max 255 characters.)
    @Column({ type: "varchar", length: 255 })
        name: string

    // Gia san pham, so thuc 10 chu so, 2 thap phan.
    // (EN: Product price, decimal 10 digits, 2 decimal places.)
    @Column({ type: "decimal", precision: 10, scale: 2 })
        price: number

    // Phan loai san pham.
    // (EN: Product category.)
    @Column({ type: "varchar", length: 100 })
        category: string

    // Du lieu mo rong dang JSON, co the null.
    // (EN: Extended metadata as JSON, nullable.)
    @Column({ type: "simple-json", nullable: true })
        metadata: Record<string, unknown> | null

    // Thoi gian tao, tu dong gan boi TypeORM.
    // (EN: Creation timestamp, auto-set by TypeORM.)
    @CreateDateColumn({ name: "created_at" })
        createdAt: Date
}
