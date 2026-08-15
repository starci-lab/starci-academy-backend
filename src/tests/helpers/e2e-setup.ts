import {
    E2eStackService,
} from "./e2e-stack.service"

/**
 * Jest globalSetup for the root integration project: boot the shared
 * {@link E2eStackService} (real Testcontainers infra) and seed it.
 *
 * The `test:e2e` lane uses `e2e-runner.ts` as its parent lifecycle owner.
 *
 * The instance is stashed on `globalThis` so {@link teardown} can stop it
 * after the suite.
 */
const setup = async (): Promise<void> => {
    const stack = new E2eStackService()
    await stack.up()
    await stack.seed()

    ;(globalThis as Record<string, unknown>).__E2E_STACK__ = stack
}

export default setup
