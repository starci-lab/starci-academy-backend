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
        it("ignores malformed samples and treats an unbounded memory limit as null",
            async () => {
                const fetchMock = jest.spyOn(global,
                    "fetch").mockImplementation(async (url) => ({
                    ok: true,
                    json: async () => ({
                        data: {
                            result: [
                                {
                                    metric: {
                                        name: "starci-api"
                                    }, value: [1,
                                        "not-a-number"]
                                },
                                {
                                    metric: {
                                    }, value: [1,
                                        "2"]
                                },
                                {
                                    metric: {
                                        name: "starci-worker"
                                    }, value: [1,
                                        String(url).includes("memory_limit") ? "999999999999999999" : "3"]
                                },
                            ]
                        }
                    }),
                } as Response))
                const result = await new PrometheusMetricsService({
                    log: jest.fn()
                } as never).containerMetricsByName()
                expect(result.get("worker")).toEqual(expect.objectContaining({
                    cpuPercent: 3, memoryLimitBytes: null
                }))
                expect(result.has("api")).toBe(false)
                fetchMock.mockRestore()
            })

        it("returns an empty map when Prometheus responds with a non-success status",
            async () => {
                const fetchMock = jest.spyOn(
                    global,
                    "fetch",
                ).mockResolvedValue({
                    ok: false,
                    json: jest.fn(),
                } as unknown as Response)

                const result = await new PrometheusMetricsService({
                    log: jest.fn(),
                } as never).containerMetricsByName()

                expect(result).toEqual(new Map())
                expect(fetchMock).toHaveBeenCalledTimes(5)
                fetchMock.mockRestore()
            })

        it("returns an empty map when every scrape rejects with a primitive failure",
            async () => {
                const fetchMock = jest.spyOn(
                    global,
                    "fetch",
                ).mockRejectedValue("prometheus offline")

                await expect(new PrometheusMetricsService({
                    log: jest.fn(),
                } as never).containerMetricsByName()).resolves.toEqual(new Map())
                expect(fetchMock).toHaveBeenCalledTimes(5)
                fetchMock.mockRestore()
            })
    })
