import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    ChallengeSubmissionEntity,
} from "./challenge-submission.entity"
import {
    ChallengeSubmissionPromptTranslationEntity,
} from "./challenge-submission-prompt-translation.entity"

@Entity("challenge_submission_prompts")
/**
 * LLM / grading prompt attached to a challenge submission slot (English; internal -- not in GraphQL).
 */
export class ChallengeSubmissionPromptEntity extends UuidAbstractEntity {
    /**
     * The text of the prompt.
     */
    @Column({
        name: "prompt_text",
        type: "text",
        default: "",
    })
        promptText: string

    /**
     * Title / label for this prompt.
     */
    @Column({
        name: "title",
        type: "varchar",
        length: 200,
        default: "",
    })
        title: string

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
     * Pure ordering index used to reorder the list (decoupled from orderIndex).
     */
    @Column({
        name: "sort_index",
        type: "int",
        default: 0,
    })
        sortIndex: number

    /**
     * Challenge submission (requirement slot) this prompt belongs to.
     */
    @ManyToOne(
        () => ChallengeSubmissionEntity,
        (submission: ChallengeSubmissionEntity) => submission.prompts,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "challenge_submission_id",
        foreignKeyConstraintName:
            "fk_challenge_submission_id_challenge_submission_prompts_challenge_submissions",
    })
        challengeSubmission: ChallengeSubmissionEntity

    @RelationId(
        (p: ChallengeSubmissionPromptEntity) => p.challengeSubmission,
    )
        challengeSubmissionId: string

    @OneToMany(
        () => ChallengeSubmissionPromptTranslationEntity,
        (translation: ChallengeSubmissionPromptTranslationEntity) => translation.challengeSubmissionPrompt,
        {
            cascade: true,
        },
    )
        translations: Array<ChallengeSubmissionPromptTranslationEntity>
}
