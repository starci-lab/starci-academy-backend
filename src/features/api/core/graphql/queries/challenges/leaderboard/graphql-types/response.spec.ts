import {
    LeaderboardEntryData, LeaderboardResponseData 
} from "./response"
describe("challenge leaderboard response DTOs",
    () => { it("preserves rank, score and optional viewer rank",
        () => { const entry = Object.assign(new LeaderboardEntryData(),
            {
                rank: 1, userId: "u1", username: "alice", score: 99, solvedCount: 4 
            }); const data = Object.assign(new LeaderboardResponseData(),
            {
                entries: [entry], myRank: null, total: 1 
            }); expect(data).toMatchObject({
            entries: [{
                rank: 1, score: 99 
            }], myRank: null, total: 1 
        }) }) })
