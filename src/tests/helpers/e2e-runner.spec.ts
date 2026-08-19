import {
    EventEmitter,
} from "node:events"
import type {
    ChildProcess,
    SpawnOptions,
} from "node:child_process"
import {
    runE2e,
} from "./e2e-runner"
import type {
    E2eRunnerDependencies,
} from "./e2e-runner"

type ShutdownSignal = "SIGINT" | "SIGTERM"

/** A jest-backed stand-in for the {@link E2eRunnerDependencies} `createStack()` result. */
interface E2eStackMock {
    up: jest.Mock<Promise<void>, []>
    seed: jest.Mock<Promise<void>, []>
    down: jest.Mock<Promise<void>, []>
}

interface RunnerFixture {
    child: ChildProcess
    childEvents: EventEmitter
    dependencies: E2eRunnerDependencies
    order: Array<string>
    processEvents: EventEmitter
    spawnChild: jest.MockedFunction<E2eRunnerDependencies["spawnChild"]>
    stack: E2eStackMock
}

const createFixture = (): RunnerFixture => {
    const order: Array<string> = []
    const childEvents = new EventEmitter()
    const child = childEvents as unknown as ChildProcess
    child.kill = jest.fn(() => true) as ChildProcess["kill"]
    const processEvents = new EventEmitter()
    const stack = {
        up: jest.fn(async () => {
            order.push("up")
        }),
        seed: jest.fn(async () => {
            order.push("seed")
        }),
        down: jest.fn(async () => {
            order.push("down")
        }),
    }
    const spawnChild = jest.fn((
        command: string,
        args: Array<string>,
        options: SpawnOptions,
    ) => {
        void command
        void args
        void options
        order.push("spawn")
        return child
    })
    const dependencies: E2eRunnerDependencies = {
        createStack: () => stack,
        resolveJest: () => "C:/repo/node_modules/jest/bin/jest.js",
        spawnChild,
        process: {
            execPath: "C:/node/node.exe",
            env: {
                E2E_STACK_PROFILE: "core",
                POSTGRESQL_PRIMARY_HOST: "127.0.0.1",
            },
            cwd: () => "C:/repo",
            on: (signal, listener) => processEvents.on(signal,
                listener),
            off: (signal, listener) => processEvents.off(signal,
                listener),
        },
    }

    return {
        child,
        childEvents,
        dependencies,
        order,
        processEvents,
        spawnChild,
        stack,
    }
}

const closeChild = (
    fixture: RunnerFixture,
    code: number | null,
): void => {
    fixture.spawnChild.mockImplementation(() => {
        fixture.order.push("spawn")
        queueMicrotask(() => fixture.childEvents.emit("close",
            code,
            null))
        return fixture.child
    })
}

describe("runE2e",
    () => {
        it("boots, seeds, forwards arguments and environment, then tears down",
            async () => {
                const fixture = createFixture()
                fixture.spawnChild.mockImplementation((command, args, options) => {
                    fixture.order.push("spawn")
                    expect(command).toBe("C:/node/node.exe")
                    expect(args).toEqual([
                        "C:/repo/node_modules/jest/bin/jest.js",
                        "--runTestsByPath",
                        "src/tests/e2e/content-ai-session.e2e-spec.ts",
                        "--detectOpenHandles",
                        "--config",
                        "./src/tests/e2e/jest-e2e.json",
                        "--runInBand",
                    ])
                    expect(options).toMatchObject({
                        cwd: "C:/repo",
                        env: {
                            E2E_STACK_PROFILE: "core",
                            POSTGRESQL_PRIMARY_HOST: "127.0.0.1",
                        },
                        shell: false,
                        stdio: "inherit",
                    })
                    queueMicrotask(() => fixture.childEvents.emit("close",
                        0,
                        null))
                    return fixture.child
                })

                await expect(runE2e([
                    "--runTestsByPath",
                    "src/tests/e2e/content-ai-session.e2e-spec.ts",
                    "--detectOpenHandles",
                ],
                fixture.dependencies)).resolves.toBe(0)

                expect(fixture.order).toEqual([
                    "up",
                    "seed",
                    "spawn",
                    "down",
                ])
                expect(fixture.stack.down).toHaveBeenCalledTimes(1)
            })

        it("preserves a non-zero Jest exit code after cleanup",
            async () => {
                const fixture = createFixture()
                closeChild(fixture,
                    7)

                await expect(runE2e([],
                    fixture.dependencies)).resolves.toBe(7)
                expect(fixture.order).toEqual([
                    "up",
                    "seed",
                    "spawn",
                    "down",
                ])
            })

        it("maps a child close without an exit code to failure",
            async () => {
                const fixture = createFixture()
                closeChild(fixture,
                    null)

                await expect(runE2e([],
                    fixture.dependencies)).resolves.toBe(1)
                expect(fixture.stack.down).toHaveBeenCalledTimes(1)
            })

        it("surfaces an asynchronous spawn error after cleanup",
            async () => {
                const fixture = createFixture()
                const spawnError = new Error("spawn failed")
                fixture.spawnChild.mockImplementation(() => {
                    fixture.order.push("spawn")
                    queueMicrotask(() => fixture.childEvents.emit("error",
                        spawnError))
                    return fixture.child
                })

                await expect(runE2e([],
                    fixture.dependencies)).rejects.toBe(spawnError)
                expect(fixture.stack.down).toHaveBeenCalledTimes(1)
            })

        it("surfaces a synchronous spawn error after cleanup",
            async () => {
                const fixture = createFixture()
                const spawnError = new Error("spawn threw")
                fixture.spawnChild.mockImplementation(() => {
                    throw spawnError
                })

                await expect(runE2e([],
                    fixture.dependencies)).rejects.toBe(spawnError)
                expect(fixture.stack.down).toHaveBeenCalledTimes(1)
            })

        it("cleans a partially started stack without spawning Jest",
            async () => {
                const fixture = createFixture()
                const startupError = new Error("postgres failed")
                fixture.stack.up.mockRejectedValue(startupError)

                await expect(runE2e([],
                    fixture.dependencies)).rejects.toBe(startupError)
                expect(fixture.stack.seed).not.toHaveBeenCalled()
                expect(fixture.spawnChild).not.toHaveBeenCalled()
                expect(fixture.stack.down).toHaveBeenCalledTimes(1)
            })

        it("cleans after seed failure without spawning Jest",
            async () => {
                const fixture = createFixture()
                const seedError = new Error("seed failed")
                fixture.stack.seed.mockRejectedValue(seedError)

                await expect(runE2e([],
                    fixture.dependencies)).rejects.toBe(seedError)
                expect(fixture.spawnChild).not.toHaveBeenCalled()
                expect(fixture.stack.down).toHaveBeenCalledTimes(1)
            })

        it.each([
            [
                "SIGINT",
                130,
            ],
            [
                "SIGTERM",
                143,
            ],
        ] as const)("forwards %s and reports conventional exit code %i after cleanup",
            async (signal: ShutdownSignal, expectedExitCode: number) => {
                const fixture = createFixture()
                const kill = jest.fn((receivedSignal: NodeJS.Signals) => {
                    queueMicrotask(() => fixture.childEvents.emit("close",
                        null,
                        receivedSignal))
                    return true
                })
                fixture.child.kill = kill as ChildProcess["kill"]
                fixture.spawnChild.mockImplementation(() => {
                    fixture.order.push("spawn")
                    queueMicrotask(() => fixture.processEvents.emit(signal))
                    return fixture.child
                })

                await expect(runE2e([],
                    fixture.dependencies))
                    .resolves.toBe(expectedExitCode)
                expect(kill).toHaveBeenCalledWith(signal)
                expect(fixture.stack.down).toHaveBeenCalledTimes(1)
                expect(fixture.processEvents.listenerCount(signal)).toBe(0)
            })
    })
