import {
    JobReadinessData, JobReadinessTrackItem 
} from "./response"
describe("job readiness response",
    () => { it("retains track progress and foundation status",
        () => { const track = Object.assign(new JobReadinessTrackItem(),
            {
                key: "frontend", title: "Frontend", completed: 3, total: 5 
            }); const data = Object.assign(new JobReadinessData(),
            {
                tracks: [track], score: 60 
            }); expect(data).toMatchObject({
            tracks: [{
                key: "frontend", completed: 3, total: 5 
            }], score: 60 
        }) }) })
