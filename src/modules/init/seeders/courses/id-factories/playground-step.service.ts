import {
    Injectable,
} from "@nestjs/common"
import {
    Sha256Service,
} from "@modules/crypto/sha256.service"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    PlaygroundIdFactoryService,
} from "./playground.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GeneratePlaygroundStepIdParams,
} from "./types"

@Injectable()
/**
 * Playground step UUIDs nest under the owning {@link PlaygroundIdFactoryService} id.
 */
export class PlaygroundStepIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly playgroundIdFactoryService: PlaygroundIdFactoryService,
    ) { }

    /**
     * @param params - Playground-locating ordinals plus the step index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            playgroundIndex,
            playgroundStepIndex,
        }: GeneratePlaygroundStepIdParams,
    ): string {
        // anchor the step id on its parent playground id so reordering playgrounds
        // never collides step ids across playgrounds
        return uuidv5(
            this.sha256Service.hash(
                "playground-step",
                this.playgroundIdFactoryService.generate(
                    {
                        courseIndex,
                        playgroundIndex,
                    },
                ),
                playgroundStepIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
