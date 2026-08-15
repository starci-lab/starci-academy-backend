import {
    spawn,
} from "node:child_process"
import type {
    ChildProcess,
    SpawnOptions,
} from "node:child_process"
import {
    E2eStackService,
} from "./e2e-stack.service"

type ShutdownSignal = "SIGINT" | "SIGTERM"

interface E2eStack {
    up: () => Promise<void>
    seed: () => Promise<void>
    down: () => Promise<void>
}

interface RunnerProcess {
    execPath: string
    env: NodeJS.ProcessEnv
    cwd: () => string
    on: (signal: ShutdownSignal, listener: () => void) => unknown
    off: (signal: ShutdownSignal, listener: () => void) => unknown
}

/** Injectable process boundaries used to prove the runner without real containers. */
export interface E2eRunnerDependencies {
    createStack: () => E2eStack
    resolveJest: () => string
    spawnChild: (
        command: string,
        args: Array<string>,
        options: SpawnOptions,
    ) => ChildProcess
    process: RunnerProcess
}

const defaultDependencies: E2eRunnerDependencies = {
    createStack: () => new E2eStackService(),
    resolveJest: () => require.resolve("jest/bin/jest"),
    spawnChild: spawn,
    process,
}

const signalExitCodes: Record<ShutdownSignal, number> = {
    SIGINT: 130,
    SIGTERM: 143,
}

/**
 * Own the disposable E2E world outside Jest so infrastructure environment is
 * inherited by the child and cleanup always runs in this process.
 */
export const runE2e = async (
    argv: Array<string>,
    dependencies: E2eRunnerDependencies = defaultDependencies,
): Promise<number> => {
    const stack = dependencies.createStack()
    let child: ChildProcess | undefined
    let receivedSignal: ShutdownSignal | undefined

    const forwardSignal = (signal: ShutdownSignal): void => {
        receivedSignal ??= signal
        child?.kill(signal)
    }
    const onSigint = (): void => forwardSignal("SIGINT")
    const onSigterm = (): void => forwardSignal("SIGTERM")

    try {
        await stack.up()
        await stack.seed()

        child = dependencies.spawnChild(
            dependencies.process.execPath,
            [
                dependencies.resolveJest(),
                ...argv,
                "--config",
                "./src/tests/e2e/jest-e2e.json",
                "--runInBand",
            ],
            {
                cwd: dependencies.process.cwd(),
                env: {
                    ...dependencies.process.env,
                },
                shell: false,
                stdio: "inherit",
            },
        )

        dependencies.process.on("SIGINT",
            onSigint)
        dependencies.process.on("SIGTERM",
            onSigterm)

        const childExitCode = await new Promise<number>((resolve, reject) => {
            child?.once("error",
                reject)
            child?.once("close",
                (code) => resolve(code ?? 1))
        })

        return receivedSignal
            ? signalExitCodes[receivedSignal]
            : childExitCode
    } finally {
        dependencies.process.off("SIGINT",
            onSigint)
        dependencies.process.off("SIGTERM",
            onSigterm)
        await stack.down()
    }
}

if (require.main === module) {
    void runE2e(process.argv.slice(2))
        .then((exitCode) => {
            process.exitCode = exitCode
        })
        .catch((error: unknown) => {
            process.stderr.write(`${error instanceof Error
                ? error.stack ?? error.message
                : String(error)}\n`)
            process.exitCode = 1
        })
}
