import type {
    BaseMessage,
} from "@langchain/core/messages"
import {
    Injectable,
} from "@nestjs/common"
import {
    AiInvokeService,
} from "@modules/ai"
import {
    createHarnessInvoke,
    messagesToPrompt,
} from "./harness-invoke"
import type {
    HarnessTierName,
} from "./models"

@Injectable()
/**
 * Nest facade over {@link createHarnessInvoke} and {@link messagesToPrompt}.
 *
 * This is the helper that is genuinely DI-shaped: it produces the
 * `AiInvokeService` stand-in a spec feeds to `overrideProvider` / `useValue`
 * (or a `useFactory` that injects this service). The other facades wrap
 * dependency-free functions for uniformity; this one is the reason a
 * testing-module import earns its keep.
 */
export class HarnessInvokeService {
    /**
     * Flatten LangChain messages into a `{ system, prompt }` pair.
     *
     * @param messages - the flow's prompt-builder output
     * @returns system text and the remaining prompt
     */
    public messagesToPrompt(
        messages: Array<BaseMessage>,
    ): {
        system: string
        prompt: string
    } {
        return messagesToPrompt(messages)
    }

    /**
     * Build a harness-backed {@link AiInvokeService} stand-in for the current
     * tier closure.
     *
     * @param getTier - resolves the tier for the current `run` call
     * @returns an object with the one `run` method every flow uses
     */
    public create(
        getTier: () => HarnessTierName,
    ): Pick<AiInvokeService, "run"> {
        return createHarnessInvoke(getTier)
    }
}
