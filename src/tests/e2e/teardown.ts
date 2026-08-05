import type {
    E2eStackService,
} from "../helpers/e2e-stack.service"

/**
 * Jest globalTeardown for the `test:e2e` lane: stop the
 * {@link E2eStackService} stashed on `globalThis` by {@link setup}.
 */
const teardown = async (): Promise<void> => {
    const stack = (globalThis as Record<string, unknown>)
        .__E2E_STACK__ as E2eStackService | undefined

    if (stack) {
        await stack.down()
    }
}

export default teardown
