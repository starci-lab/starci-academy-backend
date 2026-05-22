/**
 * Entity TypeORM — bảng `orders` phân vùng theo RANGE(created_at).
 * (EN: TypeORM entity — `orders` table partitioned by RANGE(created_at).)
 */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from "typeorm"

/**
 * Trạng thái đơn hàng: pending / completed / cancelled.
 * (EN: Order status: pending / completed / cancelled.)
 */
export enum OrderStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
}

/**
 * Logic — Ánh xạ bảng `orders` sang class TypeScript, dùng decorator TypeORM.
 * Code — `@Entity("orders")` + các `@Column` tương ứng từng cột DB.
 * (EN Logic: Map `orders` table to TypeScript class via TypeORM decorators.)
 * (EN Code: `@Entity("orders")` with `@Column` for each DB column.)
 */
@Entity("orders")
export class OrderEntity {
    // Khoá chính UUID tự sinh.
    // (EN: Auto-generated UUID primary key.)
    @PrimaryGeneratedColumn("uuid")
        id: string

    // Mã khách hàng.
    // (EN: Customer identifier.)
    @Column({ name: "customer_id" })
        customerId: string

    // Tên sản phẩm.
    // (EN: Product name.)
    @Column()
        product: string

    // Số tiền đơn hàng (decimal 10,2).
    // (EN: Order amount (decimal 10,2).)
    @Column({ type: "decimal", precision: 10, scale: 2 })
        amount: number

    // Khu vực đặt hàng.
    // (EN: Order region.)
    @Column()
        region: string

    // Trạng thái đơn hàng (enum).
    // (EN: Order status (enum).)
    @Column({
        type: "enum",
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
        status: OrderStatus

    // Thời điểm tạo — cũng là khoá phân vùng.
    // (EN: Creation timestamp — also the partition key.)
    @CreateDateColumn({ name: "created_at" })
        createdAt: Date
}
