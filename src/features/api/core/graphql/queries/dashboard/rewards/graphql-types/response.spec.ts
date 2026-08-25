import {
    RewardObject, RewardsResponse 
} from "./response"
describe("rewards response",
    () => { it("exposes reward status and optional redemption",
        () => { const reward = Object.assign(new RewardObject(),
            {
                id: "r1", title: "Reward", claimed: false, voucher: null 
            }); const response = Object.assign(new RewardsResponse(),
            {
                data: [reward] 
            }); expect(response).toMatchObject({
            data: [{
                id: "r1", claimed: false, voucher: null 
            }] 
        }) }) })
