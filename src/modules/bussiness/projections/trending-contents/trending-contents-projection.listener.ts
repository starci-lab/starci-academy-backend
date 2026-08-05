import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/env"
import {
    KafkaService,
} from "@modules/kafka"
import {
    WinstonService,
} from "@modules/winston"
import {
    AbstractProjectionListener,
} from "@modules/projection"
import {
    TrendingContentsProjectionService,
} from "./trending-contents-projection.service"

/** The single global key every `user_contents` change funnels into. */
const GLOBAL_KEY = "global"

@Injectable()
/**
 * CDC consumer that keeps `trending_contents_projections` fresh -- any lesson-read
 * change funnels into the one global trending row. Because trending is a global
 * rolling-window aggregate, every source change maps to the SAME key, so the TTL
 * lazy-refresh remains the primary throttle and the recompute is naturally
 * coalesced to one global row. Connection + per-message safety are owned by
 * {@link AbstractProjectionListener}.
 */
export class TrendingContentsProjectionListener extends AbstractProjectionListener<string> {
    /** Stable group -> restarts resume from the committed offset. */
    protected readonly groupId = "trending-contents-projection"

    /** Lesson-read changes move the global trending board. */
    protected readonly topics = [
        `${envConfig().kafka.cdcTopicPrefix}user_contents`,
    ]

    constructor(
        kafkaService: KafkaService,
        winstonService: WinstonService,
        private readonly trendingContentsProjectionService: TrendingContentsProjectionService,
    ) {
        // base owns the Kafka wiring
        super(kafkaService,
            winstonService)
    }

    /**
     * Every lesson-read change affects the one global trending row.
     *
     * @returns the single global key.
     */
    protected deriveTargets(): Array<string> {
        return [
            GLOBAL_KEY,
        ]
    }

    /**
     * Recompute the global trending board.
     */
    protected async recomputeTarget(): Promise<void> {
        await this.trendingContentsProjectionService.recompute()
    }
}
