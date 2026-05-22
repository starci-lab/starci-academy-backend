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
    RATE_LIMITED = "rate_limited",
}

export enum NotificationChannel {
    EMAIL = "email",
    SMS = "sms",
    PUSH = "push",
}

/**
 * Loại thông báo — quyết định mức ưu tiên trong hàng đợi.
 * (EN: Notification type — determines priority level in queue.)
 */
export enum NotificationType {
    /** OTP: ưu tiên cao nhất (priority = 1). (EN: OTP: highest priority.) */
    OTP = "otp",
    /** Giao dịch: ưu tiên trung bình (priority = 5). (EN: Transactional: medium priority.) */
    TRANSACTIONAL = "transactional",
    /** Marketing: ưu tiên thấp (priority = 10). (EN: Marketing: lowest priority.) */
    MARKETING = "marketing",
}

@Entity("notification_logs")
export class NotificationEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    userId: string

    @Column({ type: "enum", enum: NotificationChannel, default: NotificationChannel.EMAIL })
    channel: NotificationChannel

    @Column({ type: "enum", enum: NotificationType, default: NotificationType.TRANSACTIONAL })
    type: NotificationType

    @Column({ type: "text" })
    content: string

    @Column({ type: "enum", enum: NotificationStatus, default: NotificationStatus.QUEUED })
    status: NotificationStatus

    @Column({ type: "int", default: 5 })
    priority: number

    @Column({ type: "text", nullable: true })
    errorMessage: string

    @CreateDateColumn()
    createdAt: Date

    @Column({ type: "timestamp", nullable: true })
    sentAt: Date
}
