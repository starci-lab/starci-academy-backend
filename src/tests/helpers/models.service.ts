import {
    Injectable,
} from "@nestjs/common"
import Anthropic from "@anthropic-ai/sdk"
import {
    client,
    generate,
} from "./models"
import type {
    HarnessTierName,
} from "./models"

@Injectable()
/**
 * Nest facade over the harness model client and {@link generate}.
 *
 * Wrapping these as a provider buys a uniform `moduleRef.get(ModelsService)`
 * call site, not new capability -- the implementation is still the plain
 * functions in `./models`. Specs that already boot a testing module import
 * {@link TestHelpersModule} and resolve this; import-time callers keep using
 * the functions directly.
 */
export class ModelsService {
    /**
     * The shared Anthropic client the harness authenticates once and reuses.
     *
     * @returns the module-level {@link client}
     */
    public getClient(): Anthropic {
        return client
    }

    /**
     * Run one generation through a named harness tier.
     *
     * @param tier - which cost/quality tier to dispatch to
     * @param input - the user prompt and an optional system prompt
     * @returns the model's text response
     */
    public generate(
        tier: HarnessTierName,
        input: {
            prompt: string
            system?: string
        },
    ): Promise<string> {
        return generate(tier,
            input)
    }
}
