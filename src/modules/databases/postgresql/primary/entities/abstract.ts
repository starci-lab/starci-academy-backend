import {
    Field, ID, ObjectType
} from "@nestjs/graphql"
import {
    ClassConstructor, Exclude, instanceToPlain, plainToInstance
} from "class-transformer"
import {
    CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn
} from "typeorm"

@ObjectType({
    isAbstract: true
})
/**
 * Shared TypeORM + GraphQL timestamp base. Every table inherits `createdAt` /
 * `updatedAt` from here so projections and TTL refresh can key off one contract
 * instead of each entity inventing its own timestamp columns.
 */
export abstract class AbstractEntity {
    @Exclude()
    @Field(
        () => Date,
        {
            description: "Row creation timestamp (UTC).",
        },
    )
    @CreateDateColumn({
        type: "timestamptz", name: "created_at"
    })
        createdAt: Date

    @Exclude()
    @Field(
        () => Date,
        {
            description: "Row last update timestamp (UTC).",
        },
    )
    @UpdateDateColumn({
        type: "timestamptz", name: "updated_at"
    })
        updatedAt: Date

    toDto<Dto>(dtoClass: ClassConstructor<Dto>): Dto {
        return plainToInstance(dtoClass,
            this)
    }

    toPlain<Plain>(): Plain {
        return instanceToPlain(this) as Plain
    }
}

@ObjectType({
    isAbstract: true
})
/**
 * Adds a generated UUID primary key on top of {@link AbstractEntity}. Use this
 * for rows that other tables / GraphQL leaves address by `id`; composite-key
 * tables (translations) stay on {@link AbstractEntity} alone.
 */
export abstract class UuidAbstractEntity extends AbstractEntity {
    @Field(
        () => ID,
        {
            description: "Primary key (UUID).",
        },
    )
    @PrimaryGeneratedColumn(
        "uuid",
        {
            name: "id"
        })
        id: string
}
