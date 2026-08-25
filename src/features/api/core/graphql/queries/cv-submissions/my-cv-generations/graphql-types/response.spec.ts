import {
    CvGenerationListItem 
} from "./response"
describe("CV generations response",
    () => { it("projects generation status and download metadata",
        () => { const item = Object.assign(new CvGenerationListItem(),
            {
                id: "g1", status: "completed", downloadUrl: null, createdAt: new Date() 
            }); expect(item).toMatchObject({
            id: "g1", status: "completed", downloadUrl: null 
        }) }) })
