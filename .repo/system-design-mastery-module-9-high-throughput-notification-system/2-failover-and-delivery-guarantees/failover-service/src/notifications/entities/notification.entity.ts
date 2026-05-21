/**
 * TypeORM entity — bảng persistence cho demo.
 * (EN: TypeORM entity — persistence table for demo.)
 */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from "typeorm"

export enum NotificationStatus {
    QUEUED = "queued",
    SENDING = "sending",
    SENT = "sent",
    FAILED = "failed",
    DLQ = "dlq",
}

export enum NotificationChannel { EMAIL = "email", SMS = "sms", PUSH = "push" }

@Entity("notification_logs")
export class NotificationEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    userId: string

    @Column({ type: "enum", enum: NotificationChannel, default: NotificationChannel.EMAIL })
    channel: NotificationChannel

    @Column({ type: "text" })
    content: string

    @Column({ type: "enum", enum: NotificationStatus, default: NotificationStatus.QUEUED })
    status: NotificationStatus

    /** Idempotency key — đảm bảo không gửi trùng lặp. (EN: Ensures no duplicate sends.) */
    @Column({ type: "varchar", length: 255, nullable: true, unique: true })
    idempotencyKey: string

    /** SMTP provider đã gửi thành công. (EN: SMTP provider that succeeded.) */
    @Column({ type: "varchar", length: 50, nullable: true })
    sentViaProvider: string

    @Column({ type: "int", default: 0 })
    retryCount: number

    @Column({ type: "text", nullable: true })
    errorMessage: string

    @CreateDateColumn()
    createdAt: Date

    @Column({ type: "timestamp", nullable: true })
    sentAt: Date
}
