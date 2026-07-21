import {
    E2eStackService,
} from "../stack/e2e-stack.service"

/**
 * Jest globalSetup for the `test:e2e:docker` lane: boot the shared
 * {@link E2eStackService} (real Testcontainers infra) and seed it, mirroring
 * {@link setup-e2e} but packaged as a reusable stack instance rather than a
 * one-off container boot.
 *
 * The instance is stashed on `globalThis` so {@link teardown} can stop it
 * after the suite (same handoff pattern `setup-e2e`/`teardown-e2e` use).
 */
const setup = async (): Promise<void> => {
    const stack = new E2eStackService()
    await stack.up()
    await stack.seed()

    ;(globalThis as Record<string, unknown>).__E2E_STACK__ = stack
}

export default setup
