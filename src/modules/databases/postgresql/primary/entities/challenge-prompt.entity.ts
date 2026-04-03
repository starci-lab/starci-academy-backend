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
     * The English prompt.
     */
    @Column({
        name: "prompt_en",
        type: "text",
    })
        promptEn: string

    /**
     * The name of the prompt.
     */
    @Column({
        name: "name",
        type: "varchar",
        length: 200,
        nullable: true,
    })
        name: string | null

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
