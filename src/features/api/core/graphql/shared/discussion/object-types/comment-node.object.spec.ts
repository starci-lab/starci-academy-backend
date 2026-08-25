import {
    CommentNodeObject 
} from "./comment-node.object"

describe("CommentNodeObject",
    () => {
        it("represents a root comment with nullable parent and reaction summary",
            () => {
                const node = Object.assign(new CommentNodeObject(),
                    {
                        id: "c1", body: "hello", isDeleted: false, editedAt: null, createdAt: new Date(), parentCommentId: null, author: {
                            id: "u1" 
                        }, replyCount: 0, reactions: {
                            total: 0, items: [] 
                        }, isFounderAuthor: true 
                    })
                expect(node).toMatchObject({
                    parentCommentId: null, replyCount: 0, isFounderAuthor: true 
                })
            })
    })
