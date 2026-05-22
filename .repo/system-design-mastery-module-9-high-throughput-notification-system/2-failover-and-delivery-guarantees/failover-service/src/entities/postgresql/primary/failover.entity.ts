/**
 * TypeORM entity — bảng persistence cho demo.
 * (EN: TypeORM entity — persistence table for demo.)
 */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from "typeorm"

/**
 * Thực thể lưu trữ dữ liệu tính năng.
 * (EN: Entity holding feature data records.)
 */
@Entity("failover_records")
export class FailoverEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column({ default: 0 })
    version: number
}
