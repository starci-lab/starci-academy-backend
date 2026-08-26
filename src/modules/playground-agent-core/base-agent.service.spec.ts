import {
    BaseAgentService
} from "./base-agent.service"

class TestAgent extends BaseAgentService {
    constructor() {
        super({
            label: "test", readyMessage: "ready"
        } as never,
{
} as never)
    }
    runQueue(work: () => Promise<void>): void { this.enqueue(work) }
}

describe("BaseAgentService",
    () => {
        it("serializes queued work and continues after a rejected task",
            async () => {
                const agent = new TestAgent()
                const calls: Array<string> = []
                agent.runQueue(async () => { calls.push("first"); throw new Error("expected") })
                agent.runQueue(async () => { calls.push("second") })
                await new Promise((resolve) => setImmediate(resolve))
                await new Promise((resolve) => setImmediate(resolve))
                expect(calls).toEqual(["first",
                    "second"])
            })
    })
