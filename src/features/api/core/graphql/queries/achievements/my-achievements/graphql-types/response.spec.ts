import {
    MyAchievementItemData, MyAchievementsData 
} from "./response"
describe("achievements response",
    () => { it("projects earned and locked achievement states",
        () => { const item = Object.assign(new MyAchievementItemData(),
            {
                id: "a1", title: "First", earned: true, earnedAt: new Date() 
            }); const data = Object.assign(new MyAchievementsData(),
            {
                items: [item], total: 1 
            }); expect(data).toMatchObject({
            items: [{
                earned: true 
            }], total: 1 
        }) }) })
