import {
    RagAgentService
} from "./rag-agent.service"
import {
    EVENT
} from "@modules/playground-agent-core/constants"

describe("RagAgentService",
    () => {
        it("indexes valid sources and streams answers with citations",
            async () => {
                const handlers: Record<string, (payload: never) => void> = {
                }; const socket = {
                    on: jest.fn((event: string, cb: (payload: never) => void) => { handlers[event] = cb }), emit: jest.fn()
                }; const rag = {
                    index: jest.fn().mockResolvedValue({
                        chunkCount: 2, sourceLabel: "repo"
                    }), ask: jest.fn().mockImplementation(async (_q: string, emit: (text: string, done: boolean) => void) => { emit("answer",
                        true); return {
                        sources: ["doc"]
                    } }), probeOllama: jest.fn()
                }
                const service = new RagAgentService({
                    label: "rag"
                } as never,
{
} as never,
rag as never); (service as unknown as { socket: typeof socket; sendLog: jest.Mock }).socket = socket; (service as unknown as { socket: typeof socket; sendLog: jest.Mock }).sendLog = jest.fn(); (service as unknown as { onSetup: () => void }).onSetup()
                handlers[EVENT.ragIndex]({
                    sourceLabel: "repo"
                } as never); handlers[EVENT.ragAsk]({
                    runId: "1", question: "q"
                } as never); await new Promise((resolve) => setImmediate(resolve)); expect(rag.index).toHaveBeenCalled(); expect(rag.ask).toHaveBeenCalled(); expect(socket.emit).toHaveBeenCalledWith(EVENT.ragCitations,
                    {
                        runId: "1", sources: ["doc"]
                    })
            })
    })
