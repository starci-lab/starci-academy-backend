import {
    E2eStackService,
} from "./e2e-stack.service"

/**
 * Jest globalSetup for the `harness` lane: boot the shared
 * {@link E2eStackService} (real Testcontainers infra) and seed it, mirroring
 * `./e2e-setup.ts` so LLM-eval flows run against the same
 * infra shape as the e2e lane.
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
