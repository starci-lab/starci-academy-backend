import {
    Test,
} from "@nestjs/testing"
import {
    GraphQLSchemaBuilderModule,
    GraphQLSchemaFactory,
    Query,
    Resolver,
} from "@nestjs/graphql"
import type {
    GraphQLObjectType,
    GraphQLSchema,
} from "graphql"
import {
    CvFeedback,
    CvFeedbackItem,
    CvGenerationPayload,
    CvGenerationResponse,
} from "./response"

/**
 * Minimal resolver that exists only to give the schema factory an entry point
 * into the response tree. Code-first types are unreachable until something
 * returns them, so this is how the declared contract gets built at all.
 */
@Resolver()
class CvGenerationProbeResolver {
    @Query(() => CvGenerationResponse)
    /**
     * Probe query returning the response envelope under test.
     *
     * @returns never called -- only its declared return type is read.
     */
    cvGeneration(): CvGenerationResponse {
        throw new Error("probe resolver is never executed")
    }
}

/**
 * These are declaration-only GraphQL object types: every member is a plain
 * property whose only behaviour is the `@Field` contract it publishes. So the
 * assertion that carries weight is the BUILT SCHEMA -- field names, exact
 * scalar/enum/object types, list shape and nullability. `GraphQLSchemaFactory`
 * throws outright on an undeterminable output type, and this payload in
 * particular leans on four registered enums plus a JSON scalar, any of which
 * silently failing to register is a boot-time API outage.
 */
describe("cvGeneration response types",
    () => {
        let schema: GraphQLSchema

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    GraphQLSchemaBuilderModule,
                ],
            }).compile()

            // ONE build for the whole file: the factory accumulates type metadata
            // across calls, so a second create() in the same process fails with a
            // duplicate-name error unrelated to the code under test.
            schema = await (await moduleRef.get(GraphQLSchemaFactory)).create([
                CvGenerationProbeResolver,
            ])
        })

        /**
         * Read one built object type's field map as `name -> printed GraphQL type`.
         *
         * @param name - The object type name in the built schema.
         * @returns the field map, keyed by field name.
         */
        const fieldsOf = (
            name: string,
        ): Record<string, string> => {
            const type = schema.getType(name) as GraphQLObjectType
            expect(type).toBeDefined()
            return Object.fromEntries(
                Object.values(type.getFields()).map(
                    (field) => [
                        field.name,
                        field.type.toString(),
                    ],
                ),
            )
        }

        it("exposes the query and every response type it reaches",
            () => {
                expect(schema.getQueryType()?.getFields()).toHaveProperty("cvGeneration")
                for (const cls of [
                    CvGenerationResponse,
                    CvGenerationPayload,
                    CvFeedback,
                    CvFeedbackItem,
                ]) {
                    expect(schema.getType(cls.name)).toBeDefined()
                }
            })

        it("keeps the envelope's data nullable so an ownership failure drops the payload",
            () => {
                expect(fieldsOf("CvGenerationResponse")).toEqual({
                    success: "Boolean!",
                    message: "String!",
                    error: "String",
                    data: "CvGenerationPayload",
                })
            })

        it("publishes the generation run, nulling every field that is unset until processed",
            () => {
                expect(fieldsOf("CvGenerationPayload")).toEqual({
                    id: "ID!",
                    mode: "CvGenerationMode!",
                    status: "CvGenerationStatus!",
                    source: "CvSource!",
                    // null unless mode = Revise
                    sourceCvSubmissionId: "ID",
                    // null when the CV is not tied to a course
                    courseId: "ID",
                    courseTitle: "String",
                    label: "String",
                    targetRole: "String",
                    language: "String",
                    // null only for historical rows predating the explicit bar
                    targetLevel: "CvTargetLevel",
                    selectedEvidence: "[CvSelectedEvidence!]!",
                    evidenceLevel: "CvEvidenceLevel!",
                    // null until the shared scoring step runs
                    score: "Int",
                    feedback: "CvFeedback",
                    extraPrompts: "String",
                    structuredData: "JSON",
                    latexSource: "String",
                    uploadedCvUrl: "String",
                    generatedPdfUrl: "String",
                    processedAt: "DateTime",
                    errorMessage: "String",
                    createdAt: "DateTime!",
                })
            })

        it("registers every enum the payload discriminates on",
            () => {
                // a missing registerEnumType surfaces as a boot failure, not a type error
                for (const name of [
                    "CvGenerationMode",
                    "CvGenerationStatus",
                    "CvSource",
                    "CvTargetLevel",
                    "CvEvidenceLevel",
                ]) {
                    expect(schema.getType(name)).toBeDefined()
                }
            })

        it("exposes the assembled CV document as a JSON scalar rather than a typed tree",
            () => {
                // deliberate: the CV body shape is model-driven and not worth a
                // GraphQL type per section
                expect(schema.getType("JSON")).toBeDefined()
                expect(fieldsOf("CvGenerationPayload").structuredData).toBe("JSON")
            })

        it("publishes structured scoring feedback as a summary plus findings",
            () => {
                expect(fieldsOf("CvFeedback")).toEqual({
                    shortFeedback: "String!",
                    templateLevel: "String!",
                    items: "[CvFeedbackItem!]!",
                })
                expect(fieldsOf("CvFeedbackItem")).toEqual({
                    // reuses the shared submission-severity enum, not a CV-specific one
                    severity: "SubmissionFeedbackSeverity!",
                    section: "String!",
                    message: "String!",
                    // null when the model offered no concrete fix
                    suggestion: "String",
                })
            })

        it("carries the immutable capstone evidence snapshot with its inherited fields",
            () => {
                // CvSelectedEvidence extends CvCapstoneEvidence, so the built type must
                // flatten both levels -- inheritance is not automatic in code-first
                expect(fieldsOf("CvSelectedEvidence")).toEqual({
                    id: "ID!",
                    courseId: "ID!",
                    taskTitle: "String!",
                    milestoneTitle: "String!",
                    courseTitle: "String!",
                    score: "Int!",
                    milestoneTaskId: "ID!",
                    milestoneId: "ID!",
                    passedAt: "DateTime!",
                })
            })
    })
