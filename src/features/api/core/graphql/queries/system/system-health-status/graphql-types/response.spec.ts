import {
    ComponentHealthData, SystemHealthStatusResponseData 
} from "./response"
describe("system health response",
    () => { it("reports component health and aggregate status",
        () => { const component = Object.assign(new ComponentHealthData(),
            {
                name: "db", status: "up", latencyMs: 5 
            }); const data = Object.assign(new SystemHealthStatusResponseData(),
            {
                status: "healthy", components: [component] 
            }); expect(data).toMatchObject({
            status: "healthy", components: [{
                name: "db", status: "up" 
            }] 
        }) }) })
