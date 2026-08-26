jest.mock("winston-loki",
    () => class LokiTransport {
        log(): void {}
        on(): this { return this }
        once(): this { return this }
        emit(): boolean { return true }
    })
import {
    createConsoleOnlyWinstonProvider, createLokiOnlyWinstonProvider, createWinstonAndConsoleProvider
} from "./winston.providers"
import {
    CONSOLE_WINSTON, LOKI_WINSTON, WINSTON_AND_CONSOLE
} from "./constants/winston"
import {
    MODULE_OPTIONS_TOKEN
} from "./winston.module-definition"
import type {
    WinstonOptions
} from "./types/options"
import {
    ServiceName
} from "@modules/lib/common/enums/service"
import {
    WinstonLevel
} from "./types/level"
describe("winston providers",
    () => {
        const options: WinstonOptions = {
            serviceName: ServiceName.Api,
            id: "1",
            level: WinstonLevel.Info,
            useConsole: false
        }
        it("creates logger factories with their configured provider tokens",
            () => {
                const consoleProvider = createConsoleOnlyWinstonProvider()
                const lokiProvider = createLokiOnlyWinstonProvider()
                const combinedProvider = createWinstonAndConsoleProvider()
                expect(consoleProvider).toMatchObject({
                    provide: CONSOLE_WINSTON, inject: [MODULE_OPTIONS_TOKEN]
                })
                expect(lokiProvider).toMatchObject({
                    provide: LOKI_WINSTON, inject: [MODULE_OPTIONS_TOKEN]
                })
                expect(combinedProvider).toMatchObject({
                    provide: WINSTON_AND_CONSOLE, inject: [MODULE_OPTIONS_TOKEN]
                })
                expect(consoleProvider.useFactory(options)).toMatchObject({
                    level: "info", transports: []
                })
                expect(lokiProvider.useFactory(options).transports).toHaveLength(1)
                expect(combinedProvider.useFactory(options).transports).toHaveLength(1)
            })

        it("adds console transport when the console option is enabled",
            () => {
                const provider = createConsoleOnlyWinstonProvider()
                const logger = provider.useFactory({
                    ...options,
                    useConsole: true,
                })

                expect(logger.transports).toHaveLength(1)
                expect(logger.level).toBe("info")
            })
    })
