import {
    AiBalancerKeyHealthData, AiBalancerHealthResponseData 
} from "./response"
describe("AI balancer health response",
    () => { it("keeps key availability and provider summaries",
        () => { const key = Object.assign(new AiBalancerKeyHealthData(),
            {
                keyId: "k1", available: true, latencyMs: 20 
            }); const data = Object.assign(new AiBalancerHealthResponseData(),
            {
                providers: [], keys: [key], healthy: true 
            }); expect(data).toMatchObject({
            healthy: true, keys: [{
                available: true, latencyMs: 20 
            }] 
        }) }) })
