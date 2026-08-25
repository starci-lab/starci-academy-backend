import {
    CommunityPostNodeObject 
} from "./community-post-node.object"

describe("CommunityPostNodeObject",
    () => {
        it("represents pinned, deleted and viewer-author state",
            () => {
                const node = Object.assign(new CommunityPostNodeObject(),
                    {
                        id: "p1", body: "removed", channel: "general", isPinned: true, isDeleted: true, editedAt: null, createdAt: new Date(), author: {
                            id: "u1" 
                        }, commentCount: 0, reactions: {
                            total: 0, items: [] 
                        }, isMine: false, isFounderAuthor: true 
                    })
                expect(node).toMatchObject({
                    id: "p1", isPinned: true, isDeleted: true, editedAt: null, isFounderAuthor: true 
                })
            })
    })
