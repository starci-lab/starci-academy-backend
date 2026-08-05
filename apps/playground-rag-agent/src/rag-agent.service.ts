import {
    Inject, Injectable 
} from "@nestjs/common"
import {
    AGENT_META, type AgentMeta, BaseAgentService, DeviceService, EVENT 
} from "@modules/playground-agent-core"
import {
    OLLAMA_STATUS_INTERVAL_MS 
} from "./rag-constants"
import {
    RagService 
} from "./rag.service"
import type {
    IndexSource 
} from "./rag-types"

@Injectable()
/**
 * The RAG capability: probes local Ollama, indexes browser-supplied code, and
 * answers questions grounded ONLY in that code — all on-device. It reports no
 * docker/k8s resources (there is nothing to verify), so it skips the resource loop.
 */
export class RagAgentService extends BaseAgentService {
    private ollamaTimer?: NodeJS.Timeout

    constructor(
        @Inject(AGENT_META) meta: AgentMeta,
            deviceService: DeviceService,
        private readonly rag: RagService,
    ) {
        super(meta,
            deviceService)
    }

    /** Probe local Ollama once and push its status to the browser. */
    private pollOllama(): void {
        void this.rag.probeOllama().then((status) => this.socket.emit(EVENT.ollamaStatus,
            status))
    }

    protected onSetup(): void {
        this.socket.on(EVENT.ragIndex,
            (payload: IndexSource) => {
                if (!payload) {
                    return
                }
                this.enqueue(async () => {
                    const { chunkCount, sourceLabel } = await this.rag.index(payload)
                    this.sendLog(`rag: indexed ${sourceLabel} → ${chunkCount} chunk(s)`)
                    this.socket.emit(EVENT.ragEvent,
                        {
                            kind: "imported" 
                        })
                })
            })

        this.socket.on(EVENT.ragAsk,
            (payload: { runId?: string, question?: string }) => {
                const runId = payload?.runId
                const question = payload?.question
                if (!runId || !question) {
                    return
                }
                this.enqueue(async () => {
                    this.sendLog("rag: asked")
                    this.socket.emit(EVENT.ragEvent,
                        {
                            kind: "asked" 
                        })
                    const { sources } = await this.rag.ask(question,
                        (text, done) => {
                            this.socket.emit(EVENT.ragAnswer,
                                {
                                    runId, text, done 
                                })
                        })
                    this.socket.emit(EVENT.ragCitations,
                        {
                            runId, sources 
                        })
                    this.socket.emit(EVENT.ragEvent,
                        {
                            kind: "answered" 
                        })
                })
            })
    }

    protected onPaired(): void {
        this.pollOllama()
        if (!this.ollamaTimer) {
            this.ollamaTimer = setInterval(() => this.pollOllama(),
                OLLAMA_STATUS_INTERVAL_MS)
        }
    }

    protected onShutdown(): void {
        if (this.ollamaTimer) {
            clearInterval(this.ollamaTimer)
        }
    }
}
