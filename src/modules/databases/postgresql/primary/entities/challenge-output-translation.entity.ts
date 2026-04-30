import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"
import {
    AbstractEntity,
} from "./abstract"
import {
    ChallengeOutputEntity,
} from "./challenge-output.entity"

@ObjectType({
    description: "Localized value for a challenge output field.",
})
@Entity("challenge_output_translations")
export class ChallengeOutputTranslationEntity extends AbstractEntity {
    @Field(() => String)
    @PrimaryColumn({
        name: "challenge_output_id",
        type: "uuid",
    })
        challengeOutputId: string

    @Field(() => GraphQLTypeLocale)
    @PrimaryColumn({
        name: "locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        locale: Locale

    @Field(() => String)
    @PrimaryColumn({
        name: "field",
        type: "varchar",
        length: 128,
    })
        field: string

    @Field(() => String)
    @Column({
        name: "value",
        type: "text",
    })
        value: string

    @ManyToOne(
        () => ChallengeOutputEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_output_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_challenge_output_id_output_translations_challenge_outputs",
    })
        challengeOutput: ChallengeOutputEntity
}
