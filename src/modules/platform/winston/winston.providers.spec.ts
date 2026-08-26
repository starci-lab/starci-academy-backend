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
describe("winston providers",
    () => {
        const options = {
            serviceName: "api", id: "1", level: "info", useConsole: false
        } as never
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
    })
