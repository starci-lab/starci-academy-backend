import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import type {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "One localized concept learning outcome or prerequisite.",
})
/** Learner-visible outcome text with its stable authored identity. */
export class ConceptOutcomeData {
    @Field(() => String)
        id: string

    @Field(() => String)
        text: string
}

@ObjectType({
    description: "One learner-visible concept reference.",
})
/** Localized citation metadata rendered below a concept. */
export class ConceptReferenceData {
    @Field(() => String)
        id: string

    @Field(() => String)
        label: string

    @Field(() => String,
        {
            nullable: true,
        })
        url: string | null

    @Field(() => String,
        {
            nullable: true,
        })
        citation: string | null
}

@ObjectType({
    description: "A learner-safe source file from the concept workspace.",
})
/** Public workspace file projection; private activity checks stay in server JSONB. */
export class ConceptWorkspaceFileData {
    @Field(() => String)
        path: string

    @Field(() => String)
        role: string

    @Field(() => String,
        {
            nullable: true,
            description: "UTF-8 source content, or null when the retained snapshot is unavailable.",
        })
        content: string | null
}

@ObjectType({
    description: "Commands supplied with a concept workspace.",
})
/** Optional platform-specific commands displayed with the workspace. */
export class ConceptWorkspaceCommandsData {
    @Field(() => String,
        {
            nullable: true,
        })
        windows: string | null

    @Field(() => String,
        {
            nullable: true,
        })
        unix: string | null
}

@ObjectType({
    description: "Learner-safe concept workspace metadata and source files.",
})
/** Render-ready workspace with its intentionally public source and test files. */
export class ConceptWorkspaceData {
    @Field(() => String)
        runtime: string

    @Field(() => [ConceptWorkspaceFileData])
        files: Array<ConceptWorkspaceFileData>

    @Field(() => ConceptWorkspaceCommandsData,
        {
            nullable: true,
        })
        commands: ConceptWorkspaceCommandsData | null
}

@ObjectType({
    description: "One visible choice without answer-key metadata.",
})
/** Choice label projection that deliberately omits correctness and feedback. */
export class ConceptActivityOptionData {
    @Field(() => String)
        id: string

    @Field(() => String)
        label: string
}

@ObjectType({
    description: "Learner-facing exercise instructions.",
})
/** Exercise copy without hidden verification checks or reference files. */
export class ConceptExerciseData {
    @Field(() => String)
        submissionInstructions: string

    @Field(() => String)
        verificationMode: string

    @Field(() => String)
        verificationInstructions: string
}

@ObjectType({
    description: "A learner-safe activity prompt.",
})
/** Public activity projection with every answer and rubric field removed. */
export class ConceptActivityData {
    @Field(() => String)
        id: string

    @Field(() => String)
        kind: string

    @Field(() => String,
        {
            nullable: true,
        })
        stableKey: string | null

    @Field(() => String)
        prompt: string

    @Field(() => String,
        {
            nullable: true,
        })
        responseKind: string | null

    @Field(() => Boolean,
        {
            nullable: true,
        })
        isDiagnostic: boolean | null

    @Field(() => [String])
        outcomeIds: Array<string>

    @Field(() => Int,
        {
            nullable: true,
        })
        afterDays: number | null

    @Field(() => [ConceptActivityOptionData])
        options: Array<ConceptActivityOptionData>

    @Field(() => ConceptExerciseData,
        {
            nullable: true,
        })
        exercise: ConceptExerciseData | null
}

@ObjectType({
    description: "One localized, ordered concept section.",
})
/** Section Markdown and learner-safe activities for rendering. */
export class ConceptSectionData {
    @Field(() => String)
        displayId: string

    @Field(() => String)
        title: string

    @Field(() => String)
        phase: string

    @Field(() => String)
        body: string

    @Field(() => Int)
        sortIndex: number

    @Field(() => [ConceptActivityData])
        activities: Array<ConceptActivityData>
}

@ObjectType({
    isAbstract: true,
    description: "Shared localized concept summary fields.",
})
/** Fields common to catalog cards and concept detail. */
export abstract class ConceptSummaryData {
    @Field(() => String)
        displayId: string

    @Field(() => String)
        title: string

    @Field(() => String)
        description: string

    @Field(() => String)
        category: string

    @Field(() => String)
        difficulty: string

    @Field(() => Int)
        minutesRead: number

    @Field(() => String)
        implementation: string

    @Field(() => Int)
        sortIndex: number
}

@ObjectType({
    description: "One localized concept catalog card.",
})
/** Lightweight concept card for `/concept/`. */
export class ConceptListItemData extends ConceptSummaryData {}

@ObjectType({
    description: "Current interactive capabilities of the V1 concept reader.",
})
/** Explicitly prevents the reader from implying unavailable grading behavior. */
export class ConceptCapabilitiesData {
    @Field(() => Boolean)
        choiceSubmission: boolean

    @Field(() => Boolean)
        writtenResponseGrading: boolean

    @Field(() => Boolean)
        simulationExecution: boolean
}

@ObjectType({
    description: "A complete localized concept for the lesson reader.",
})
/** Render-ready detail assembled from the independent Concepts domain. */
export class ConceptDetailData extends ConceptSummaryData {
    @Field(() => String,
        {
            nullable: true,
        })
        body: string | null

    @Field(() => [ConceptOutcomeData])
        learningOutcomes: Array<ConceptOutcomeData>

    @Field(() => [ConceptOutcomeData])
        prerequisites: Array<ConceptOutcomeData>

    @Field(() => [ConceptReferenceData])
        references: Array<ConceptReferenceData>

    @Field(() => ConceptWorkspaceData,
        {
            nullable: true,
        })
        workspace: ConceptWorkspaceData | null

    @Field(() => [ConceptActivityData])
        activities: Array<ConceptActivityData>

    @Field(() => [ConceptSectionData])
        sections: Array<ConceptSectionData>

    @Field(() => ConceptCapabilitiesData)
        capabilities: ConceptCapabilitiesData
}

@ObjectType({
    description: "Response wrapper for the concepts query.",
})
/** Standard GraphQL envelope for the concept catalog. */
export class ConceptsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<ConceptListItemData>> {
    @Field(() => [ConceptListItemData])
        data: Array<ConceptListItemData>
}

@ObjectType({
    description: "Response wrapper for the concept query.",
})
/** Standard GraphQL envelope whose data is null for an unknown route slug. */
export class ConceptResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ConceptDetailData | null> {
    @Field(() => ConceptDetailData,
        {
            nullable: true,
        })
        data: ConceptDetailData | null
}
