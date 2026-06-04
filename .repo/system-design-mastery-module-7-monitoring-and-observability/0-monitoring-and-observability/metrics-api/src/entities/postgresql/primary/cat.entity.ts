/**
 * `cats` entity — persists cats in PostgreSQL (metrics-api lab).
 */
import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "typeorm"

@Entity({
    name: "cats",
})
export class CatEntity {
    @PrimaryGeneratedColumn()
        id!: number

    @Column({
        type: "varchar",
        length: 255,
    })
        name!: string

    @Column({
        type: "int",
    })
        age!: number
}
