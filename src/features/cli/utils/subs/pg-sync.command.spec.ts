import {
    PgSyncCommand 
} from "./pg-sync.command"
import {
    WinstonLog 
} from "@modules/platform/winston/enums/winston-log"
import type {
    PgSyncCommandOptions,
} from "./types/pg-sync"

jest.mock("@modules/integrations/execa/execa.service",
    () => ({
        ExecaService: class {},
    }))

describe("PgSyncCommand",
    () => {
        const make = () => {
            const winstonService = {
                log: jest.fn() 
            }
            const asyncService = {
                resolveTuple: jest.fn((p: Promise<unknown>) =>
                    p.then((v) => [v,
                        undefined]).catch((e) => [undefined,
                        e]),
                ),
            }
            const execaService = {
                exec: jest.fn().mockResolvedValue(undefined) 
            }
            return {
                command: new PgSyncCommand(
        winstonService as never,
        asyncService as never,
        execaService as never,
                ),
                winstonService,
                asyncService,
                execaService,
            }
        }

        afterEach(() => jest.restoreAllMocks())

        it("trims option values and rejects invalid URL schemes",
            () => {
                const { command } = make()
                expect(command.parseSourceUrl("  postgres://source  ")).toBe(
                    "postgres://source",
                )
                expect(command.parseDestinationUrl(" postgres://dest ")).toBe(
                    "postgres://dest",
                )
                expect(() =>
                    (command as unknown as { assertPostgresConnectionUrl: (url: string) => void }).assertPostgresConnectionUrl("https://example.com"),
                ).toThrow()
                expect(() =>
                    (command as unknown as { assertPostgresConnectionUrl: (url: string) => void }).assertPostgresConnectionUrl("not-a-url"),
                ).toThrow()
            })

        it("runs dump then restore with generated temporary path",
            async () => {
                const { command, execaService, winstonService } = make()
                const exit = jest.spyOn(process,
                    "exit").mockImplementation((() => {
                        throw new Error("exit")
                    }) as never)
                await expect(
                    command.run([],
                        {
                            sourceUrl: "postgres://source",
                            destinationUrl: "postgres://dest",
                        }),
                ).rejects.toThrow("exit")
                expect(execaService.exec).toHaveBeenCalledTimes(2)
                expect(execaService.exec.mock.calls[0][0]).toMatchObject({
                    command: "pg_dump",
                    args: expect.arrayContaining(["--dbname",
                        "postgres://source"]),
                })
                expect(execaService.exec.mock.calls[1][0]).toMatchObject({
                    command: "pg_restore",
                    args: expect.arrayContaining(["--dbname",
                        "postgres://dest",
                        "--clean"]),
                })
                expect(winstonService.log).toHaveBeenCalledWith(
                    WinstonLog.CommandSuccess,
                    expect.objectContaining({
                        message: expect.stringContaining("pg_dump") 
                    }),
                )
                expect(exit).toHaveBeenCalledWith(0)
            })

        it.each([
            [{
                destinationUrl: "postgres://dest" 
            },
            "Missing source URL"],
            [{
                sourceUrl: "postgres://source" 
            },
            "Missing destination URL"],
            [
                {
                    sourceUrl: "postgres://same", destinationUrl: "postgres://same" 
                },
                "must not be the same",
            ],
        ])("logs and exits for invalid input",
            async (options: PgSyncCommandOptions, message: string) => {
                const { command, winstonService } = make()
                const exit = jest
                    .spyOn(process,
                        "exit")
                    .mockImplementation((() => undefined) as never)
                await command.run([],
                    options)
                expect(exit).toHaveBeenCalledWith(1)
                expect(winstonService.log).toHaveBeenCalledWith(WinstonLog.CommandError,
                    {
                        error: expect.stringContaining(message),
                    })
            })

        it("stops after a dump failure",
            async () => {
                const { command, execaService } = make()
                execaService.exec.mockRejectedValueOnce(new Error("dump failed"))
                const exit = jest.spyOn(process,
                    "exit").mockImplementation((() => {
                        throw new Error("exit")
                    }) as never)
                await expect(
                    command.run([],
                        {
                            sourceUrl: "postgres://source",
                            destinationUrl: "postgres://dest",
                        }),
                ).rejects.toThrow("exit")
                expect(exit).toHaveBeenCalledWith(1)
                expect(execaService.exec).toHaveBeenCalledTimes(1)
            })
    })
