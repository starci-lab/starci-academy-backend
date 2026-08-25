import {
    CommunityCommentNodeObject 
} from "./community-comment-node.object"

describe("CommunityCommentNodeObject",
    () => {
        it("keeps top-level and threaded comment projections distinguishable",
            () => {
                const node = Object.assign(new CommunityCommentNodeObject(),
                    {
                        id: "c1", body: "hello", isDeleted: false, editedAt: null, createdAt: new Date(), parentCommentId: "parent", author: {
                            id: "u1" 
                        }, replyCount: 2, reactions: {
                            total: 1, items: [] 
                        }, isFounderAuthor: false 
                    })
                expect(node).toMatchObject({
                    parentCommentId: "parent", replyCount: 2, isDeleted: false 
                })
            })
    })
