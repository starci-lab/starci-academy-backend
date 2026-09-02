import {
    Module 
} from "@nestjs/common"
import {
    GraphQLSchemaBuilderModule, GraphQLSchemaFactory, Query, Resolver 
} from "@nestjs/graphql"
import {
    Test 
} from "@nestjs/testing"
import {
    printSchema 
} from "graphql"
import {
    CourseCommunityCommentNode, CourseCommunityFeedPage, CourseCommunityPostNode 
} from "./course-community-graphql.types"
import {
    CourseCommunityQueriesResolver 
} from "../../queries/community/course-community/course-community.resolver"
import {
    CourseCommunityMutationsResolver 
} from "../../mutations/community/course-community/course-community.resolver"

@Resolver() class CourseCommunityContractProbe {
    @Query(() => CourseCommunityFeedPage) feed(): CourseCommunityFeedPage { return {
    } as never }
    @Query(() => CourseCommunityPostNode) post(): CourseCommunityPostNode { return {
    } as never }
    @Query(() => CourseCommunityCommentNode) comment(): CourseCommunityCommentNode { return {
    } as never }
}
@Module({
    imports: [GraphQLSchemaBuilderModule], providers: [CourseCommunityContractProbe] 
}) class ProbeModule {}

describe("Course Community GraphQL contract",
    () => {
        it("exposes client nodes and excludes founder/channel policy",
            async () => {
                const moduleRef = await Test.createTestingModule({
                    imports: [ProbeModule] 
                }).compile()
                const schema = printSchema(await moduleRef.get(GraphQLSchemaFactory).create([CourseCommunityContractProbe,
                    CourseCommunityQueriesResolver,
                    CourseCommunityMutationsResolver]))
                expect(schema).toContain("type CourseCommunityPostNode")
                expect(schema).toContain("commentCount: Int!")
                expect(schema).toContain("reactions: ReactionSummaryObject!")
                expect(schema).toContain("isMine: Boolean!")
                expect(schema).toContain("type CourseCommunityCommentNode")
                expect(schema).toContain("replyCount: Int!")
                expect(schema).not.toContain("CourseCommunityPostNode {\n  channel")
                expect(schema).not.toContain("isFounderAuthor")
                expect(schema).toContain("reactToCourseCommunityPost(request: ReactCourseCommunityPostRequest!): CourseCommunityPostNode!")
                expect(schema).toContain("reactToCourseCommunityComment(request: ReactCourseCommunityCommentRequest!): CourseCommunityCommentNode!")
            })
    })
