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
    ChallengePrerequisiteEntity,
} from "./challenge-prerequisite.entity"

@ObjectType({
    description: "Localized value for a challenge prerequisite field.",
})
@Entity("challenge_prerequisite_translations")
export class ChallengePrerequisiteTranslationEntity extends AbstractEntity {
    @Field(() => String)
    @PrimaryColumn({
        name: "challenge_prerequisite_id",
        type: "uuid",
    })
        challengePrerequisiteId: string

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
        () => ChallengePrerequisiteEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_prerequisite_id",
        referencedColumnName: "id",
        foreignKeyConstraintName:
            "fk_challenge_prerequisite_id_prerequisite_translations_challenge_prerequisites",
    })
        challengePrerequisite: ChallengePrerequisiteEntity
}
