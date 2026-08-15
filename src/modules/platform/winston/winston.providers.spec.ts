import LokiTransport from "winston-loki"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    ServiceName,
} from "@modules/lib/common/enums/service"
import {
    WinstonLevel,
} from "./types/level"
import {
    createLokiTransport,
} from "./winston.providers"

jest.mock("winston-loki",
    () => ({
        __esModule: true,
        default: jest.fn(),
    }))

jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn(),
    }))

describe("createLokiTransport",
    () => {
        const mockedEnvConfig = jest.mocked(envConfig)
        const mockedLokiTransport = jest.mocked(LokiTransport)

        beforeEach(() => {
            jest.clearAllMocks()
            mockedEnvConfig.mockReturnValue({
                nodeEnv: "development",
                loki: {
                    host: "https://logs-prod-020.grafana.net",
                    requireAuth: true,
                    username: "1478295",
                    password: "write-token",
                },
            } as ReturnType<typeof envConfig>)
        })

        it("uses the managed Loki endpoint with bounded stable labels",
            () => {
                createLokiTransport({
                    serviceName: ServiceName.Api,
                    id: "1",
                    level: WinstonLevel.Info,
                })

                expect(mockedLokiTransport).toHaveBeenCalledWith(expect.objectContaining({
                    host: "https://logs-prod-020.grafana.net",
                    json: true,
                    labels: {
                        project: "starci-academy",
                        environment: "development",
                        service_name: "API 1",
                    },
                    basicAuth: "1478295:write-token",
                }))
                const options = mockedLokiTransport.mock.calls[0][0]
                expect(JSON.stringify(options.labels)).not.toContain("write-token")
            })

        it("omits basic auth when the configured Loki endpoint does not require it",
            () => {
                mockedEnvConfig.mockReturnValue({
                    nodeEnv: "test",
                    loki: {
                        host: "http://localhost:3100",
                        requireAuth: false,
                        username: "unused",
                        password: "unused",
                    },
                } as ReturnType<typeof envConfig>)

                createLokiTransport({
                    serviceName: ServiceName.Cli,
                    level: WinstonLevel.Debug,
                })

                expect(mockedLokiTransport).toHaveBeenCalledWith(expect.objectContaining({
                    host: "http://localhost:3100",
                    basicAuth: undefined,
                    labels: {
                        project: "starci-academy",
                        environment: "test",
                        service_name: "CLI",
                    },
                }))
            })
    })
