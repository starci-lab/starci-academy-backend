import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    ChallengeEntity,
} from "./challenge.entity"

/**
 * LLM / grading prompt attached to a challenge (English copy; internal use only — not in GraphQL).
 */
@Entity("challenge_prompts")
export class ChallengePromptEntity extends UuidAbstractEntity {
    /**
     * The English text of the prompt.
     */
    @Column({
        name: "text_en",
        type: "text",
        default: "",
    })
        textEn: string

    /**
     * English title / label for this prompt.
     */
    @Column({
        name: "title_en",
        type: "varchar",
        length: 200,
        default: "",
    })
        titleEn: string

    /**
     * Weight or points for this prompt.
     */
    @Column({
        name: "score",
        type: "int",
        default: 0,
    })
        score: number

    /**
     * The order index of the prompt.
     */
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * The challenge that the prompt belongs to.
     */
    @ManyToOne(
        () => ChallengeEntity,
        (challenge: ChallengeEntity) => challenge.prompts,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_id",
    })
        challenge: ChallengeEntity


    /**
     * The challenge that the prompt belongs to.
     */
    @Column({
        name: "challenge_id",
        type: "uuid",
    })
        challengeId: string
}
