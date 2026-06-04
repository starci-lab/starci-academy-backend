/**
 * TypeORM entity — `orders` table partitioned by RANGE(created_at).
 */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from "typeorm"

/**
 * Order status: pending / completed / cancelled.
 */
export enum OrderStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
}

/**
 * Logic: Map `orders` table to TypeScript class via TypeORM decorators.
 * Code: `@Entity("orders")` with `@Column` for each DB column.
 */
@Entity("orders")
export class OrderEntity {
        // Auto-generated UUID primary key.
    @PrimaryGeneratedColumn("uuid")
        id: string

        // Customer identifier.
    @Column({ name: "customer_id" })
        customerId: string

        // Product name.
    @Column()
        product: string

        // Order amount (decimal 10,2).
    @Column({ type: "decimal", precision: 10, scale: 2 })
        amount: number

        // Order region.
    @Column()
        region: string

        // Order status (enum).
    @Column({
        type: "enum",
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
        status: OrderStatus

        // Creation timestamp — also the partition key.
    @CreateDateColumn({ name: "created_at" })
        createdAt: Date
}
