import {
    Field, Int, ObjectType 
} from "@nestjs/graphql"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    Column, Entity, JoinColumn, ManyToOne 
} from "typeorm"
import {
    OneToMany,
} from "typeorm"
import {
    ModuleEntity 
} from "./module.entity"
import {
    StringAbstractEntity 
} from "./abstract"
import {
    OutcomeTranslationEntity,
} from "./outcome-translation.entity"

@ObjectType({
    description: "A learning outcome for a course module."
})
@Entity("outcomes")
export class OutcomeEntity extends StringAbstractEntity {
    /**
     * Outcome title.
     */
    @Field(() => String)
    @Column({
        name: "title",
        type: "varchar",
        length: 500
    })
        title: string

    /**
     * Optional outcome description.
     */
    @Field(() => String,
        {
            nullable: true
        })
    @Column({
        name: "description",
        type: "text",
        nullable: true
    })
        description: string | null

    /**
     * Display order within the parent module outcome list.
     */
    @Field(() => Int)
    @Column({
        name: "order_index",
        type: "int",
        default: 0
    })
        orderIndex: number

    /**
     * Default locale for the outcome.
     */
    @Field(() => GraphQLTypeLocale)
    @Column({
        name: "default_locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        defaultLocale: Locale

    /**
     * Parent module this outcome belongs to.
     */
    @Field(() => ModuleEntity)
    @ManyToOne(() => ModuleEntity,
        (mod: ModuleEntity) => mod.outcomes,
        {
            onDelete: "CASCADE"
        })
    @JoinColumn({
        name: "course_module_id"
    })
        module: ModuleEntity

    /**
     * Localized translations of outcome fields such as title and description.
     */
    @Field(
        () => [OutcomeTranslationEntity],
        {
            nullable: true,
        },
    )
    @OneToMany(
        () => OutcomeTranslationEntity,
        (outcomeTranslation: OutcomeTranslationEntity) => outcomeTranslation.outcome,
        {
            cascade: true,
        },
    )
        translations?: Array<OutcomeTranslationEntity>
}
