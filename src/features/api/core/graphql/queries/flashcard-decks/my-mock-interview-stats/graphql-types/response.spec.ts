import {
    MockInterviewStatsTrendPoint, MyMockInterviewStatsData 
} from "./response"
describe("mock interview stats response",
    () => { it("represents trend points and aggregate counts",
        () => { const point = Object.assign(new MockInterviewStatsTrendPoint(),
            {
                date: "2026-01-01", score: 80 
            }); const data = Object.assign(new MyMockInterviewStatsData(),
            {
                totalSessions: 2, averageScore: 75, trend: [point] 
            }); expect(data).toMatchObject({
            totalSessions: 2, trend: [{
                score: 80 
            }] 
        }) }) })
