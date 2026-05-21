/**
 * Entity người dùng — bảng `users` trong Postgres (primary + replica).
 * (EN: User entity — `users` table in Postgres (primary + replicas).)
 */
import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "typeorm"

@Entity("users")
export class UserEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    name!: string

    @Column({ unique: true })
    email!: string
}
