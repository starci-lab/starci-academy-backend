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
