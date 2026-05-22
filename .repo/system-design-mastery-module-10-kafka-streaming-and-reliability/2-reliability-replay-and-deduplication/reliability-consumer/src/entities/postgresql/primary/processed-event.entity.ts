/**
 * TypeORM entity — bảng persistence cho demo.
 * (EN: TypeORM entity — persistence table for demo.)
 */
import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from "typeorm"

@Entity("processed_events")
export class ProcessedEventEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ unique: true })
    clientMessageId!: string

    @Column()
    eventType!: string

    @Column({ type: "bigint" })
    sequence!: number

    @CreateDateColumn()
    createdAt!: Date
}
