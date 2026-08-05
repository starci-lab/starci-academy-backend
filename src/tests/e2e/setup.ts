import {
    E2eStackService,
} from "../helpers/e2e-stack.service"

/**
 * Jest globalSetup for the `test:e2e` lane: boot the shared
 * {@link E2eStackService} (real Testcontainers infra) and seed it.
 *
 * This is the ONLY e2e lane. It used to sit beside a second, container-per-run
 * lane that booted Postgres inline; both booted the same image with the same
 * env wiring, so the duplicate was retired in favour of the stack -- which is
 * the extensible one (it can add Redis/NATS via `startGenericContainer`).
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
