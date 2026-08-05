import {
    Field,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Split a raw pasted CV / free-text resume into ordered block-editor blocks (no persistence).",
})
/**
 * Split a raw pasted CV / free-text resume into ordered block-editor blocks.
 * The AI parses the prose into structured blocks; nothing is persisted — the
 * frontend loads the returned blocks into the editor for the user to refine.
 */
export class SplitCvFromTextRequest {
    @Field(
        () => String,
        {
            description: "Raw pasted CV / resume free text to parse into blocks.",
        },
    )
        text: string
}
