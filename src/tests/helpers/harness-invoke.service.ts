import type {
    BaseMessage,
} from "@langchain/core/messages"
import {
    Injectable,
} from "@nestjs/common"
import {
    AiInvokeService,
} from "@modules/ai/ai-invoke.service"
import {
    createHarnessInvoke,
    messagesToPrompt,
} from "./harness-invoke"
import type {
    HarnessModel,
} from "./harness-invoke"

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
     * Build a harness-backed {@link AiInvokeService} stand-in for the current model closure.
     *
     * @param getModel - resolves the model for the current `run` call
     * @returns an object with the one `run` method every flow uses
     */
    public create(
        getModel: () => HarnessModel,
    ): Pick<AiInvokeService, "run"> {
        return createHarnessInvoke(getModel)
    }
}
