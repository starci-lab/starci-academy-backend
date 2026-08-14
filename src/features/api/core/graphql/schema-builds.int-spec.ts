import {
    Test,
} from "@nestjs/testing"
import {
    GraphQLSchemaFactory,
    GraphQLSchemaBuilderModule,
} from "@nestjs/graphql"
import type {
    GraphQLSchema,
} from "graphql"
import {
    CourseReviewsResolver,
} from "./queries/courses/course-reviews/course-reviews.resolver"
import {
    DeleteCourseReviewResolver,
} from "./mutations/courses/delete-course-review/delete-course-review.resolver"
import {
    SubmitCourseReviewResolver,
} from "./mutations/courses/submit-course-review/submit-course-review.resolver"
import {
    UpdateCourseReviewResolver,
} from "./mutations/courses/update-course-review/update-course-review.resolver"

/**
 * THE GUARD THAT WAS MISSING.
 *
 * This API is code-first: the schema does not exist until Nest walks the resolvers' decorators and
 * builds it, which happens at BOOT. So a returned type with no `@ObjectType` is not a compile error
 * and not a test failure - it is a boot failure, in production, with the whole API down and a
 * message about a type nobody can place.
 *
 * That is exactly what shipped: `CourseReviewEntity` was returned as `data` by two mutations and
 * carried no `@ObjectType`. Forty-eight unit specs and a five-step broker e2e were green, because
 * not one of them built a schema. The e2e suites that DO build one build it over the subset of
 * resolvers they import, so an operation in no e2e has its types built by nothing at all.
 *
 * Building the schema IS the assertion. `GraphQLSchemaFactory.create` throws when it cannot
 * determine an output type, so there is nothing to expect afterwards - a passing run means every
 * type these resolvers name is reachable, and a failing one names the type it could not place.
 *
 * ADD A RESOLVER HERE WHEN YOU ADD AN OPERATION. The list is deliberately explicit rather than a
 * glob: a glob would silently drag in whatever landed next, and the first time it broke for an
 * unrelated reason somebody would delete the whole file.
 */
describe("the GraphQL schema builds",
    () => {
        let schema: GraphQLSchema

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    GraphQLSchemaBuilderModule,
                ],
            }).compile()

            const factory = moduleRef.get(GraphQLSchemaFactory)

            // ONE build for the whole file. The factory accumulates type metadata across calls, so a
            // second create() in the same process re-registers every type it already saw and fails
            // with a duplicate-name error that has nothing to do with the code under test. That is
            // the factory being used wrongly, not a defect, and it cost one red run to learn.
            schema = await factory.create([
                SubmitCourseReviewResolver,
                UpdateCourseReviewResolver,
                DeleteCourseReviewResolver,
                CourseReviewsResolver,
            ])
        })

        it("builds every course review operation into the schema", () => {
            // building it was the assertion - create() throws on an undeterminable output type.
            // These four names are what proves the build covered the operations rather than
            // succeeding over an empty set.
            expect(schema.getMutationType()?.getFields()).toHaveProperty("submitCourseReview")
            expect(schema.getMutationType()?.getFields()).toHaveProperty("updateCourseReview")
            expect(schema.getMutationType()?.getFields()).toHaveProperty("deleteCourseReview")
            expect(schema.getQueryType()?.getFields()).toHaveProperty("courseReviews")
        })

        it("exposes the review row as a real output type rather than as an opaque blob", () => {
            // the specific regression: the row was returned as `data` while carrying no
            // @ObjectType, so Nest could not determine an output type and the whole API failed to
            // boot. A named type in the schema is what says it is exposed rather than merely present.
            expect(schema.getType("CourseReview")).toBeDefined()
        })
    })
