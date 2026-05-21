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

/**
 * Trạng thái của thông báo trong hệ thống.
 * (EN: Notification status in the system.)
 */
export enum NotificationStatus {
    /** Đã xếp hàng chờ xử lý. (EN: Queued for processing.) */
    QUEUED = "queued",
    /** Đang gửi. (EN: Currently being sent.) */
    SENDING = "sending",
    /** Đã gửi thành công. (EN: Successfully sent.) */
    SENT = "sent",
    /** Gửi thất bại. (EN: Failed to send.) */
    FAILED = "failed",
}

/**
 * Kênh gửi thông báo.
 * (EN: Notification delivery channel.)
 */
export enum NotificationChannel {
    EMAIL = "email",
    SMS = "sms",
    PUSH = "push",
}

/**
 * Thực thể lưu trữ log thông báo — ghi nhận mọi thông báo đã nhận và trạng thái xử lý.
 * (EN: Entity storing notification log — records every notification received and its processing status.)
 */
@Entity("notification_logs")
export class NotificationEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    userId: string

    @Column({
        type: "enum",
        enum: NotificationChannel,
        default: NotificationChannel.EMAIL,
    })
    channel: NotificationChannel

    @Column({ type: "text" })
    content: string

    @Column({
        type: "enum",
        enum: NotificationStatus,
        default: NotificationStatus.QUEUED,
    })
    status: NotificationStatus

    @Column({ type: "text", nullable: true })
    errorMessage: string

    @CreateDateColumn()
    createdAt: Date

    @Column({ type: "timestamp", nullable: true })
    sentAt: Date
}
