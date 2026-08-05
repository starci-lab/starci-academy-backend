import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    type EntityManager,
} from "typeorm"
import {
    randomUUID,
} from "crypto"
import {
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    PlaygroundEntity,
    PlaygroundResolverService,
    PlaygroundSessionEntity,
    PlaygroundSessionMode,
    PlaygroundStepEntity,
} from "@modules/databases"
import {
    AiEntitlementService,
} from "@modules/ai"
import {
    PlaygroundNotEntitledException,
    PlaygroundNotFoundException,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    CreatePlaygroundSessionCommand,
} from "./create-playground-session.command"
import type {
    CreatePlaygroundSessionResponseData,
} from "./graphql-types"

@CommandHandler(CreatePlaygroundSessionCommand)
@Injectable()
/**
 * Creates a fresh {@link PlaygroundSessionEntity} for the learner: gates on
 * having at least one active enrollment (reuses
 * {@link AiEntitlementService.hasAnyActiveEnrollment} — the "enroll OR pay
 * unlocks higher tiers" rule, applied here as "enroll unlocks playgrounds"),
 * then mints a short pairing code the CLI agent uses to join over the
 * `/playground_byom` Socket.IO namespace.
 */
export class CreatePlaygroundSessionHandler
    extends ICQRSHandler<CreatePlaygroundSessionCommand, CreatePlaygroundSessionResponseData>
    implements ICommandHandler<CreatePlaygroundSessionCommand, CreatePlaygroundSessionResponseData>
{
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly playgroundResolver: PlaygroundResolverService,
    ) {
        super()
    }

    protected override async process(
        command: CreatePlaygroundSessionCommand,
    ): Promise<CreatePlaygroundSessionResponseData> {
        const {
            request: {
                playgroundId,
                mode,
            },
            user,
            locale,
        } = command.params
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        const playground = await this.entityManager.findOne(
            PlaygroundEntity,
            {
                where: {
                    id: playgroundId,
                },
                relations: {
                    steps: {
                        translations: true,
                    },
                },
                order: {
                    steps: {
                        sortIndex: "ASC",
                    },
                },
            },
        )
        if (!playground) {
            throw new PlaygroundNotFoundException({
                id: playgroundId,
            })
        }
        const entitled = await this.aiEntitlementService.hasAnyActiveEnrollment(user.id)
        if (!entitled) {
            throw new PlaygroundNotEntitledException({
                userId: user.id,
                playgroundId,
            })
        }
        const resolvedMode = mode ?? PlaygroundSessionMode.Guided
        // UUID pairing code: 122 bits of entropy → unguessable (no brute-force), and
        // collision-free (the `@Unique` constraint is a belt-and-braces safety). The
        // learner copies the whole `npx … <code>` command, so length/typeability is a
        // non-issue. Server-side hardening (rate-limit, 30-min expiry, single-agent,
        // owner-only command:run) still applies in the gateway.
        const pairingCode = randomUUID()
        const created = this.entityManager.create(
            PlaygroundSessionEntity,
            {
                user,
                playground,
                pairingCode,
                mode: resolvedMode,
                connected: false,
                currentStepIndex: 0,
                passedStepIndexes: [],
            },
        )
        await this.entityManager.save(
            PlaygroundSessionEntity,
            created,
        )
        // project each returned step's title/body to the request locale (and
        // strip its raw translation rows) so a freshly-created session carries
        // localized steps, not raw-English — mirrors the live `playground`
        // query. Done after `save` (the session→playground relation has no
        // TypeORM cascade) so the mutated steps never round-trip to Postgres.
        const resolvedLocale = locale ?? Locale.En
        for (const step of playground.steps ?? []) {
            this.playgroundResolver.transformStep(
                step,
                resolvedLocale,
                Locale.En,
            )
        }
        return {
            id: created.id,
            pairingCode: created.pairingCode,
            mode: resolvedMode,
            steps: this.redactStepsForMode(
                playground.steps ?? [],
                resolvedMode,
            ),
        }
    }

    /**
     * Server-side redaction: when `mode` is
     * {@link PlaygroundSessionMode.Free}, every step's `commandHint` is
     * nulled out here so the GraphQL response never carries the hint value —
     * NOT merely hidden by the FE.
     */
    private redactStepsForMode(
        steps: Array<PlaygroundStepEntity>,
        mode: PlaygroundSessionMode,
    ): Array<PlaygroundStepEntity> {
        if (mode !== PlaygroundSessionMode.Free) {
            return steps
        }
        for (const step of steps) {
            step.commandHint = null
        }
        return steps
    }
}
