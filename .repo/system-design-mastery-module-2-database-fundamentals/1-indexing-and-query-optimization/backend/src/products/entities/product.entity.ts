/**
 * Entity sản phẩm — bảng `products` dùng để demo index.
 * (EN: Product entity — `products` table used for index demo.)
 */
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from "typeorm"

/**
 * Composite index (category, price) — tối ưu truy vấn lọc theo danh mục và giá.
 * (EN: Composite index (category, price) — optimizes queries filtering by category and price.)
 *
 * Index đơn (brand) — tối ưu truy vấn tìm theo thương hiệu.
 * (EN: Single index (brand) — optimizes queries searching by brand.)
 *
 * Index đơn (sku) — tối ưu truy vấn tìm theo mã sản phẩm.
 * (EN: Single index (sku) — optimizes queries searching by SKU.)
 */
@Entity("products")
@Index("idx_category_price", ["category", "price"])
@Index("idx_brand", ["brand"])
@Index("idx_sku", ["sku"])
export class ProductEntity {
    /**
     * Khoá chính UUID tự sinh.
     * (EN: Auto-generated UUID primary key.)
     */
    @PrimaryGeneratedColumn("uuid")
        id: string

    /**
     * Tên sản phẩm.
     * (EN: Product name.)
     */
    @Column({ type: "varchar", length: 255 })
        name: string

    /**
     * Mã SKU duy nhất.
     * (EN: Unique SKU code.)
     */
    @Column({ type: "varchar", length: 100, unique: true })
        sku: string

    /**
     * Giá sản phẩm (10 chữ số, 2 thập phân).
     * (EN: Product price (10 digits, 2 decimals).)
     */
    @Column({ type: "decimal", precision: 10, scale: 2 })
        price: number

    /**
     * Danh mục sản phẩm.
     * (EN: Product category.)
     */
    @Column({ type: "varchar", length: 100 })
        category: string

    /**
     * Thương hiệu.
     * (EN: Brand.)
     */
    @Column({ type: "varchar", length: 100 })
        brand: string

    /**
     * Mô tả (có thể null).
     * (EN: Description (nullable).)
     */
    @Column({ type: "text", nullable: true })
        description: string

    /**
     * Số lượng tồn kho.
     * (EN: Stock quantity.)
     */
    @Column({ type: "int", default: 0 })
        stock: number

    /**
     * Đánh giá trung bình (3 chữ số, 1 thập phân).
     * (EN: Average rating (3 digits, 1 decimal).)
     */
    @Column({ type: "decimal", precision: 3, scale: 1, default: 0 })
        rating: number

    /**
     * Ngày tạo — TypeORM tự điền.
     * (EN: Created date — auto-filled by TypeORM.)
     */
    @CreateDateColumn({ name: "created_at" })
        createdAt: Date
}
