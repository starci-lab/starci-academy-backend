import {
    sleep 
} from "@modules/common"
import {
    envConfig,
} from "@modules/env"

/**
 * Await a small delay before enqueueing work so UIs can render a stable loading state.
 */
export const sleepEnqueueUxDelay = async (): Promise<void> => {
    const ms = envConfig().bullmq.enqueueUxDelay
    if (ms <= 0) {
        return
    }
    await sleep(ms)
}
