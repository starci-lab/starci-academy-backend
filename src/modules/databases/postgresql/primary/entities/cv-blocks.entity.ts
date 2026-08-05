import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import GraphQLJSON from "graphql-type-json"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    UserEntity,
} from "./user.entity"

@ObjectType({
    description: "A user-authored CV document stored as an ordered list of blocks (course-independent).",
})
@Entity("cv_blocks")
/**
 * **A user-authored CV document, stored as an ordered list of blocks.** One
 * row = one CV the user owns; a user may own MANY (`label` names each). This is
 * the block-editor's persistence — deliberately SIMPLE and **course-independent**
 * (no `course_id`): a CV is a user-level artifact, not tied to any track
 * (2026-07-05, teacher: "mỗi user nhiều CV, chốt đơn, không phụ thuộc khóa học").
 *
 * Replaces the old AI-job model (`cv_generations` + AI whole-CV scoring) for the
 * new flow: the user fills/edits blocks directly, AI only assists PER BLOCK
 * (split a pasted CV into blocks · RAG-rewrite one block), and the trust score
 * is the deterministic capstone signal ({@link import("../../../../bussiness/headhuntings/cv-verification.service").CvVerificationService}),
 * computed from graded StarCi work — never from this document's prose.
 *
 * `blocks` / `style` are opaque JSONB owned by the FE block schema; the BE
 * stores + serves them without interpreting their inner shape.
 *
 * ```
 * users (1) ─────< cv_blocks (N)
 * ```
 */
export class CvBlocksEntity extends UuidAbstractEntity {
    /**
     * Owner user (`user_id` foreign key, CASCADE delete).
     */
    @Field(
        () => UserEntity,
        {
            description: "User who owns this CV document.",
        },
    )
    @ManyToOne(
        () => UserEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        foreignKeyConstraintName: "fk_user_id_cv_blocks_users",
    })
        user: UserEntity

    @Field(
        () => ID,
        {
            description: "ID of the user who owns this CV document.",
        },
    )
    @RelationId(
        (cvBlocks: CvBlocksEntity) => cvBlocks.user,
    )
        userId: string

    /**
     * User-facing name for this CV (`label`), e.g. "Backend — Java". Nullable;
     * the frontend falls back to a generated name (e.g. "CV #n") when empty.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "User-facing name for this CV (frontend falls back when empty).",
        },
    )
    @Column({
        name: "label",
        type: "varchar",
        length: 255,
        nullable: true,
    })
        label: string | null

    /**
     * The ordered CV blocks (`blocks`) — opaque JSONB owned by the FE block
     * schema: an array of `{ id, type, title, order, items }`. Project-block
     * items carry their own `source` ('verified' | 'self') + optional capstone
     * `sourceRef`; the BE does not interpret the inner shape. Defaults to an
     * empty array so a freshly-created CV is valid.
     */
    @Field(
        () => GraphQLJSON,
        {
            description: "Ordered CV blocks (FE-owned JSON: array of { id, type, title, order, items }).",
        },
    )
    @Column({
        name: "blocks",
        type: "jsonb",
        nullable: false,
        default: () => "'[]'::jsonb",
    })
        blocks: Array<Record<string, unknown>>

    /**
     * Presentation params (`style`) applied to the single shared LaTeX template
     * — opaque JSONB, e.g. `{ font, accent }`. Defaults to an empty object.
     */
    @Field(
        () => GraphQLJSON,
        {
            description: "Presentation params for the shared template (FE-owned JSON, e.g. { font, accent }).",
        },
    )
    @Column({
        name: "style",
        type: "jsonb",
        nullable: false,
        default: () => "'{}'::jsonb",
    })
        style: Record<string, unknown>

    /**
     * MinIO object key of the PDF last compiled (server-side, via `tectonic`)
     * from this document's blocks + style (`pdf_cdn_key`). Null until the user
     * exports a PDF, or after an edit invalidates the previous export.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "MinIO object key of the last compiled PDF (null until exported / after edits).",
        },
    )
    @Column({
        name: "pdf_cdn_key",
        type: "varchar",
        length: 2048,
        nullable: true,
    })
        pdfCdnKey: string | null

    /**
     * The CV's LaTeX source (`tex_source`) — generated once from `blocks`+`style`
     * (the FE `buildCvTexSource`), then USER-EDITABLE: whatever `.tex` the last
     * `renderCvBlocks` compiled is stored here, so reopening restores the user's
     * hand-edits (the `.tex`, not the blocks, is the source of truth once touched).
     * Null until the first compile.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "The CV's LaTeX (.tex) source — user-editable; null until the first compile.",
        },
    )
    @Column({
        name: "tex_source",
        type: "text",
        nullable: true,
    })
        texSource: string | null
}
