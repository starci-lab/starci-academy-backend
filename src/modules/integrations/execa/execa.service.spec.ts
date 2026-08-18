import {
    ExecaCommandCanceledException,
} from "@modules/platform/exceptions/errors/execa/canceled"
import {
    ExecaCommandNotFoundException,
} from "@modules/platform/exceptions/errors/execa/command-not-found"
import {
    ExecaExecutionFailedException,
} from "@modules/platform/exceptions/errors/execa/failed"
import {
    ExecaInvalidParamsException,
} from "@modules/platform/exceptions/errors/execa/invalid-params"
import {
    ExecaCommandTimedOutException,
} from "@modules/platform/exceptions/errors/execa/timed-out"
import {
    execa,
    ExecaError,
} from "execa"
import {
    createWriteStream,
} from "fs"
import {
    pipeline,
} from "stream/promises"
import {
    ExecaService,
} from "./execa.service"

// never spawn a real subprocess: `execa` is a jest mock and `ExecaError` is a
// stand-in class so the service's `instanceof` narrowing still works against
// errors the tests construct.
jest.mock("execa",
    () => {
        class MockExecaError extends Error {
        }
        return {
            execa: jest.fn(),
            ExecaError: MockExecaError,
        }
    })

// keep the rest of `fs` real -- only the destination stream is stubbed so no
// file is ever written by execToFile.
jest.mock("fs",
    () => ({
        ...jest.requireActual("fs"),
        createWriteStream: jest.fn(),
    }))

jest.mock("stream/promises",
    () => ({
        ...jest.requireActual("stream/promises"),
        pipeline: jest.fn(),
    }))

describe("ExecaService",
    () => {
        let service: ExecaService
        const execaMock = execa as unknown as jest.Mock
        const pipelineMock = pipeline as unknown as jest.Mock
        const createWriteStreamMock = createWriteStream as unknown as jest.Mock

        /**
         * Build an execa-shaped error carrying the fields the service branches on.
         *
         * `ExecaError` takes no constructor arguments -- execa builds it internally
         * and fills the message afterwards -- so the message is assigned like every
         * other field the service reads off the rejection.
         */
        const execaFailure = (
            props: Record<string, unknown>,
        ): Error => Object.assign(new ExecaError(),
            {
                message: "execa failed",
                ...props,
            })

        /**
         * A fake subprocess: awaitable (execa's promise contract) while still
         * exposing the `stdout` / `stderr` stream handles execToFile reads.
         */
        const subprocess = (
            settled: Promise<{ stdout?: unknown, stderr?: unknown }>,
            streams: Record<string, unknown> = {
            },
        ): Promise<unknown> => Object.assign(settled,
            streams)

        beforeEach(() => {
            jest.clearAllMocks()
            pipelineMock.mockResolvedValue(undefined)
            createWriteStreamMock.mockReturnValue({
                path: "/tmp/out",
            })
            service = new ExecaService()
        })

        describe("exec",
            () => {
                it("spawns without a shell and returns stdout",
                    async () => {
                        execaMock.mockReturnValue(subprocess(Promise.resolve({
                            stdout: "v20.0.0",
                            stderr: "",
                        })))

                        await expect(service.exec({
                            command: "node",
                            args: [
                                "-v",
                            ],
                        })).resolves.toBe("v20.0.0")

                        expect(execaMock).toHaveBeenCalledWith("node",
                            [
                                "-v",
                            ],
                            {
                                shell: false,
                                env: undefined,
                            })
                    })

                it("defaults args to an empty array and forwards the env map",
                    async () => {
                        execaMock.mockReturnValue(subprocess(Promise.resolve({
                            stdout: "ok",
                            stderr: "",
                        })))

                        await expect(service.exec({
                            command: "printenv",
                            env: {
                                TOKEN: "secret",
                            },
                        })).resolves.toBe("ok")

                        expect(execaMock).toHaveBeenCalledWith("printenv",
                            [],
                            {
                                shell: false,
                                env: {
                                    TOKEN: "secret",
                                },
                            })
                    })

                it("passes a positive timeoutMs through to execa as `timeout`",
                    async () => {
                        execaMock.mockReturnValue(subprocess(Promise.resolve({
                            stdout: "ok",
                            stderr: "",
                        })))

                        await service.exec({
                            command: "sleep",
                            args: [
                                "1",
                            ],
                            timeoutMs: 500,
                        })

                        expect(execaMock.mock.calls[0][2]).toMatchObject({
                            shell: false,
                            timeout: 500,
                        })
                    })

                it("omits `timeout` when timeoutMs is zero (boundary)",
                    async () => {
                        execaMock.mockReturnValue(subprocess(Promise.resolve({
                            stdout: "ok",
                            stderr: "",
                        })))

                        await service.exec({
                            command: "node",
                            args: [],
                            timeoutMs: 0,
                        })

                        expect(execaMock.mock.calls[0][2]).not.toHaveProperty("timeout")
                    })

                it("treats any stderr on a successful exit as a failure",
                    async () => {
                        execaMock.mockReturnValue(subprocess(Promise.resolve({
                            stdout: "partial",
                            stderr: "warning: deprecated",
                        })))

                        await expect(service.exec({
                            command: "node",
                            args: [],
                        })).rejects.toBeInstanceOf(ExecaExecutionFailedException)
                    })

                it("maps a timed-out subprocess to ExecaCommandTimedOutException carrying the configured budget",
                    async () => {
                        execaMock.mockReturnValue(subprocess(Promise.reject(execaFailure({
                            timedOut: true,
                            stdout: "so far",
                            stderr: "",
                        }))))

                        const error = await service.exec({
                            command: "sleep",
                            args: [
                                "10",
                            ],
                            timeoutMs: 250,
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(ExecaCommandTimedOutException)
                        expect((error as ExecaCommandTimedOutException).metadata).toMatchObject({
                            command: "sleep",
                            timeoutMs: 250,
                            stdout: "so far",
                        })
                    })

                it("reports a zero timeout budget when the process timed out without one configured",
                    async () => {
                        execaMock.mockReturnValue(subprocess(Promise.reject(execaFailure({
                            timedOut: true,
                            // non-string stdio (execa's buffered/transform shape) normalizes away
                            stdout: [
                                "chunk",
                            ],
                        }))))

                        const error = await service.exec({
                            command: "sleep",
                            args: [],
                        }).catch((thrown: unknown) => thrown)

                        expect((error as ExecaCommandTimedOutException).metadata).toMatchObject({
                            timeoutMs: 0,
                            stdout: undefined,
                        })
                    })

                it("maps a canceled subprocess to ExecaCommandCanceledException",
                    async () => {
                        execaMock.mockReturnValue(subprocess(Promise.reject(execaFailure({
                            isCanceled: true,
                            isGracefullyCanceled: true,
                            stderr: "aborted",
                        }))))

                        const error = await service.exec({
                            command: "git",
                            args: [
                                "clone",
                            ],
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(ExecaCommandCanceledException)
                        expect((error as ExecaCommandCanceledException).metadata).toMatchObject({
                            isGracefullyCanceled: true,
                            stderr: "aborted",
                        })
                    })

                it("maps ENOENT to ExecaCommandNotFoundException",
                    async () => {
                        execaMock.mockReturnValue(subprocess(Promise.reject(execaFailure({
                            code: "ENOENT",
                            exitCode: undefined,
                        }))))

                        const error = await service.exec({
                            command: "does-not-exist",
                            args: [],
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(ExecaCommandNotFoundException)
                        expect((error as ExecaCommandNotFoundException).metadata).toMatchObject({
                            nodeErrorCode: "ENOENT",
                        })
                    })

                it("maps exit code 127 to ExecaCommandNotFoundException",
                    async () => {
                        execaMock.mockReturnValue(subprocess(Promise.reject(execaFailure({
                            exitCode: 127,
                            stderr: "command not found",
                        }))))

                        const error = await service.exec({
                            command: "nope",
                            args: [],
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(ExecaCommandNotFoundException)
                        expect((error as ExecaCommandNotFoundException).metadata).toMatchObject({
                            exitCode: 127,
                        })
                    })

                it("falls back to ExecaExecutionFailedException for an unclassified execa error",
                    async () => {
                        execaMock.mockReturnValue(subprocess(Promise.reject(execaFailure({
                            exitCode: 3,
                            stdout: "out",
                            stderr: "boom",
                        }))))

                        const error = await service.exec({
                            command: "tsc",
                            args: [],
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(ExecaExecutionFailedException)
                        expect((error as ExecaExecutionFailedException).metadata).toMatchObject({
                            exitCode: 3,
                            stderr: "boom",
                            stdout: "out",
                        })
                    })

                it("stringifies a non-Error rejection into the failure metadata and drops originalError",
                    async () => {
                        execaMock.mockReturnValue(subprocess(Promise.reject("spawn blew up")))

                        const error = await service.exec({
                            command: "tsc",
                            args: [],
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(ExecaExecutionFailedException)
                        expect((error as ExecaExecutionFailedException).metadata).toMatchObject({
                            stderr: "spawn blew up",
                            originalError: undefined,
                        })
                    })

                it("rejects an empty command before spawning",
                    async () => {
                        await expect(service.exec({
                            command: "   ",
                            args: [],
                        })).rejects.toBeInstanceOf(ExecaInvalidParamsException)

                        expect(execaMock).not.toHaveBeenCalled()
                    })

                it("rejects a non-string command and reports it as an empty command",
                    async () => {
                        const error = await service.exec({
                            command: 42 as unknown as string,
                            args: [],
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(ExecaInvalidParamsException)
                        expect((error as ExecaInvalidParamsException).metadata).toMatchObject({
                            command: "",
                            reason: "Command must be a non-empty string.",
                        })
                        expect(execaMock).not.toHaveBeenCalled()
                    })

                it("rejects args that are not an array",
                    async () => {
                        const error = await service.exec({
                            command: "node",
                            args: "-v" as unknown as Array<string>,
                        }).catch((thrown: unknown) => thrown)

                        expect((error as ExecaInvalidParamsException).metadata).toMatchObject({
                            reason: "Args must be an array.",
                            args: [],
                        })
                    })

                it("rejects a non-string argument",
                    async () => {
                        const error = await service.exec({
                            command: "node",
                            args: [
                                1 as unknown as string,
                            ],
                        }).catch((thrown: unknown) => thrown)

                        expect((error as ExecaInvalidParamsException).metadata).toMatchObject({
                            reason: "Every argument must be a string.",
                        })
                    })

                it("rejects a negative timeout",
                    async () => {
                        const error = await service.exec({
                            command: "node",
                            args: [],
                            timeoutMs: -1,
                        }).catch((thrown: unknown) => thrown)

                        expect((error as ExecaInvalidParamsException).metadata).toMatchObject({
                            reason: "timeoutMs must be non-negative when provided.",
                        })
                        expect(execaMock).not.toHaveBeenCalled()
                    })
            })

        describe("execToFile",
            () => {
                it("streams stdout into the destination file and resolves when stderr stays empty",
                    async () => {
                        const stdoutStream = {
                            name: "stdout",
                        }
                        execaMock.mockReturnValue(subprocess(
                            Promise.resolve({
                                stdout: undefined,
                                stderr: "",
                            }),
                            {
                                stdout: stdoutStream,
                                stderr: {
                                    on: jest.fn(),
                                },
                            },
                        ))

                        await expect(service.execToFile({
                            command: "pg_dump",
                            args: [
                                "db",
                            ],
                            timeoutMs: 1000,
                            stdoutPath: "/tmp/dump.sql",
                        })).resolves.toBeUndefined()

                        expect(createWriteStreamMock).toHaveBeenCalledWith("/tmp/dump.sql")
                        expect(pipelineMock).toHaveBeenCalledWith(stdoutStream,
                            {
                                path: "/tmp/out",
                            })
                        expect(execaMock.mock.calls[0][2]).toMatchObject({
                            shell: false,
                            timeout: 1000,
                            stdout: "pipe",
                            stderr: "pipe",
                        })
                    })

                it("omits the execa timeout when none is configured and tolerates an absent stderr stream",
                    async () => {
                        execaMock.mockReturnValue(subprocess(
                            Promise.resolve({
                                stderr: "",
                            }),
                            {
                                stdout: {
                                },
                                stderr: undefined,
                            },
                        ))

                        await service.execToFile({
                            command: "pg_dump",
                            stdoutPath: "/tmp/dump.sql",
                        })

                        expect(execaMock.mock.calls[0][2]).not.toHaveProperty("timeout")
                        expect(execaMock.mock.calls[0][1]).toEqual([])
                    })

                it("fails when the awaited subprocess reports stderr",
                    async () => {
                        execaMock.mockReturnValue(subprocess(
                            Promise.resolve({
                                stderr: "  pg_dump: permission denied  ",
                            }),
                            {
                                stdout: {
                                },
                                stderr: {
                                    on: jest.fn(),
                                },
                            },
                        ))

                        const error = await service.execToFile({
                            command: "pg_dump",
                            stdoutPath: "/tmp/dump.sql",
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(ExecaExecutionFailedException)
                        expect((error as ExecaExecutionFailedException).metadata).toMatchObject({
                            stderr: "pg_dump: permission denied",
                            stdout: "",
                        })
                    })

                it("falls back to the buffered stderr chunks when the settled stderr is empty",
                    async () => {
                        execaMock.mockReturnValue(subprocess(
                            Promise.resolve({
                                stderr: "",
                            }),
                            {
                                stdout: {
                                },
                                stderr: {
                                    on: jest.fn((
                                        event: string,
                                        listener: (chunk: Buffer) => void,
                                    ) => {
                                        expect(event).toBe("data")
                                        listener(Buffer.from("disk full\n",
                                            "utf8"))
                                    }),
                                },
                            },
                        ))

                        const error = await service.execToFile({
                            command: "pg_dump",
                            stdoutPath: "/tmp/dump.sql",
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(ExecaExecutionFailedException)
                        expect((error as ExecaExecutionFailedException).metadata).toMatchObject({
                            stderr: "disk full",
                        })
                    })

                it("maps a timed-out stream run to ExecaCommandTimedOutException",
                    async () => {
                        execaMock.mockReturnValue(subprocess(
                            Promise.reject(execaFailure({
                                timedOut: true,
                                stderr: "killed",
                            })),
                            {
                                stdout: {
                                },
                                stderr: {
                                    on: jest.fn(),
                                },
                            },
                        ))

                        const error = await service.execToFile({
                            command: "pg_dump",
                            timeoutMs: 10,
                            stdoutPath: "/tmp/dump.sql",
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(ExecaCommandTimedOutException)
                        expect((error as ExecaCommandTimedOutException).metadata).toMatchObject({
                            timeoutMs: 10,
                            stderr: "killed",
                        })
                    })

                it("reports a zero timeout budget when the stream run timed out without one configured",
                    async () => {
                        execaMock.mockReturnValue(subprocess(
                            Promise.reject(execaFailure({
                                timedOut: true,
                            })),
                            {
                                stdout: {
                                },
                                stderr: {
                                    on: jest.fn(),
                                },
                            },
                        ))

                        const error = await service.execToFile({
                            command: "pg_dump",
                            stdoutPath: "/tmp/dump.sql",
                        }).catch((thrown: unknown) => thrown)

                        expect((error as ExecaCommandTimedOutException).metadata).toMatchObject({
                            timeoutMs: 0,
                        })
                    })

                it("maps a canceled stream run to ExecaCommandCanceledException",
                    async () => {
                        execaMock.mockReturnValue(subprocess(
                            Promise.reject(execaFailure({
                                isCanceled: true,
                                isGracefullyCanceled: false,
                            })),
                            {
                                stdout: {
                                },
                                stderr: {
                                    on: jest.fn(),
                                },
                            },
                        ))

                        const error = await service.execToFile({
                            command: "pg_dump",
                            stdoutPath: "/tmp/dump.sql",
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(ExecaCommandCanceledException)
                        expect((error as ExecaCommandCanceledException).metadata).toMatchObject({
                            isGracefullyCanceled: false,
                        })
                    })

                it("maps ENOENT on the stream run to ExecaCommandNotFoundException",
                    async () => {
                        execaMock.mockReturnValue(subprocess(
                            Promise.reject(execaFailure({
                                code: "ENOENT",
                            })),
                            {
                                stdout: {
                                },
                                stderr: {
                                    on: jest.fn(),
                                },
                            },
                        ))

                        await expect(service.execToFile({
                            command: "pg_dump",
                            stdoutPath: "/tmp/dump.sql",
                        })).rejects.toBeInstanceOf(ExecaCommandNotFoundException)
                    })

                it("maps exit code 127 on the stream run to ExecaCommandNotFoundException",
                    async () => {
                        execaMock.mockReturnValue(subprocess(
                            Promise.reject(execaFailure({
                                exitCode: 127,
                            })),
                            {
                                stdout: {
                                },
                                stderr: {
                                    on: jest.fn(),
                                },
                            },
                        ))

                        const error = await service.execToFile({
                            command: "pg_dump",
                            stdoutPath: "/tmp/dump.sql",
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(ExecaCommandNotFoundException)
                        expect((error as ExecaCommandNotFoundException).metadata).toMatchObject({
                            exitCode: 127,
                        })
                    })

                it("falls back to ExecaExecutionFailedException when the pipeline itself fails",
                    async () => {
                        execaMock.mockReturnValue(subprocess(
                            Promise.resolve({
                                stderr: "",
                            }),
                            {
                                stdout: {
                                },
                                stderr: {
                                    on: jest.fn(),
                                },
                            },
                        ))
                        // a plain stream error (not an ExecaError) reaches the generic path
                        pipelineMock.mockRejectedValue(Object.assign(new Error("EPIPE"),
                            {
                                originalError: undefined,
                            }))

                        const error = await service.execToFile({
                            command: "pg_dump",
                            stdoutPath: "/tmp/dump.sql",
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(ExecaExecutionFailedException)
                        expect((error as ExecaExecutionFailedException).metadata).toMatchObject({
                            stderr: "",
                        })
                    })

                it("keeps an unclassified execa error's stdio on the generic failure",
                    async () => {
                        execaMock.mockReturnValue(subprocess(
                            Promise.reject(execaFailure({
                                exitCode: 2,
                                stdout: "half a dump",
                                stderr: "fatal",
                            })),
                            {
                                stdout: {
                                },
                                stderr: {
                                    on: jest.fn(),
                                },
                            },
                        ))

                        const error = await service.execToFile({
                            command: "pg_dump",
                            stdoutPath: "/tmp/dump.sql",
                        }).catch((thrown: unknown) => thrown)

                        expect((error as ExecaExecutionFailedException).metadata).toMatchObject({
                            exitCode: 2,
                            stderr: "fatal",
                            stdout: "half a dump",
                        })
                    })
            })
    })
