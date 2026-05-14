import {
    sleep 
} from "@modules/common"
import {
    envConfig,
} from "@modules/env"

/**
 * Short delay used immediately before `Queue.add` so DB/requeue work is not stalled;
 * pairs with `void sleepEnqueueUxDelay().then(() => queue.add(...))` (no await — return job immediately).
 */
export const sleepEnqueueUxDelay = async (): Promise<void> => {
    const ms = envConfig().bullmq.enqueueUxDelay
    if (ms <= 0) {
        return
    }
    await sleep(ms)
}
