import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm"
import {
    AbstractEntity,
} from "./abstract"
import {
    CVSubmissionEntity 
} from "./cv-submission.entity"

/**
 * Stores LLM prompt templates used to analyse a CV.
 * Each prompt uses `{{cv_text}}` as a placeholder for the extracted CV text.
 */
@ObjectType({
    description: "An LLM prompt template used to analyse CV submissions.",
})
@Entity("cv_prompts")
export class CVPromptEntity extends AbstractEntity {
    /**
     * Auto-generated UUID primary key.
     * We use UuidAbstractEntity's pattern but define it here to keep
     * AbstractEntity as the base (it already has createdAt / updatedAt).
     */
    @Field(
        () => ID,
        {
            description: "Primary key (UUID).",
        },
    )
    @PrimaryGeneratedColumn(
        "uuid",
        {
            name: "id",
        },
    )
        id: string

    /**
     * Human-readable name for this prompt (e.g. "default-en").
     */
    @Field(
        () => String,
        {
            description: "Human-readable name for this prompt template.",
        },
    )
    @Column({
        name: "name",
        type: "varchar",
        length: 200,
        unique: true,
    })
        name: string

    /**
     * The prompt text sent to the LLM.
     * Use `{{cv_text}}` as the placeholder for the extracted CV content.
     */
    @Field(
        () => String,
        {
            description: "LLM prompt template; use {{cv_text}} as the CV placeholder.",
        },
    )
    @Column({
        name: "prompt_text",
        type: "text",
    })
        promptText: string

    /**
     * All CV submissions that were analysed using this prompt.
     */
    @OneToMany(
        () => CVSubmissionEntity,
        (submission: CVSubmissionEntity) => submission.cvPrompt,
    )
        submissions: Array<CVSubmissionEntity>
}
