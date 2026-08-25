import {
    PrometheusMetricsService 
} from "./prometheus-metrics.service"

jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: () => ({
            prometheus: {
                url: "http://prom.test" 
            } 
        }) 
    }))
describe("PrometheusMetricsService",
    () => {
        it("aggregates container samples and strips the prefix",
            async () => {
                const fetchMock = jest.spyOn(global,
                    "fetch").mockResolvedValue({
                        ok: true, json: async () => ({
                            data: {
                                result: [{
                                    metric: {
                                        name: "starci-api" 
                                    }, value: [1,
                                        "4.5"] 
                                }] 
                            } 
                        }) 
                    } as Response)
                const service = new PrometheusMetricsService({
                    log: jest.fn() 
                } as never); const result = await service.containerMetricsByName()
                expect(result.get("api")).toMatchObject({
                    cpuPercent: 4.5 
                }); expect(fetchMock).toHaveBeenCalledTimes(5)
                await service.containerMetricsByName(); expect(fetchMock).toHaveBeenCalledTimes(5); fetchMock.mockRestore()
            })
        it("degrades failed Prometheus requests to an empty map",
            async () => {
                jest.spyOn(global,
                    "fetch").mockRejectedValue(new Error("offline")); const log = jest.fn(); const result = await new PrometheusMetricsService({
                        log 
                    } as never).containerMetricsByName()
                expect(result).toEqual(new Map()); expect(log).toHaveBeenCalled()
            })
    })
