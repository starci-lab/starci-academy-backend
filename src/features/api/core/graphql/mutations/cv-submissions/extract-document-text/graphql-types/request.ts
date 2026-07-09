import {
    Field,
    InputType,
} from "@nestjs/graphql"

/**
 * Extract plain text from an already-uploaded document (a CV file or a job
 * description file) identified by its storage object key. The FE presigns +
 * PUTs the raw file first, then calls this with the returned `cdnKey`; the
 * extracted text is handed back to the FE (not persisted) so the user can
 * review/edit it before feeding it into `splitCvFromText` / `tailorCvBlocks`.
 */
@InputType({
    description: "Extract plain text from an uploaded document (CV / job description) by its storage key (no persistence).",
})
export class ExtractDocumentTextRequest {
    @Field(
        () => String,
        {
            description: "Storage object key of the already-uploaded file (from the presign step).",
        },
    )
        cdnKey: string
}
