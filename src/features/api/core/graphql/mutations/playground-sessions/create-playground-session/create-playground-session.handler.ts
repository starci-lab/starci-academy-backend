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
    randomBytes,
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

/**
 * Creates a fresh {@link PlaygroundSessionEntity} for the learner: gates on
 * having at least one active enrollment (reuses
 * {@link AiEntitlementService.hasAnyActiveEnrollment} — the "enroll OR pay
 * unlocks higher tiers" rule, applied here as "enroll unlocks playgrounds"),
 * then mints a short pairing code the CLI agent uses to join over the
 * `/playground_byom` Socket.IO namespace.
 */
@CommandHandler(CreatePlaygroundSessionCommand)
@Injectable()
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
        const pairingCode = await this.uniquePairingCode()
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

    /**
     * Generates a 6-char uppercase alphanumeric pairing code, retrying on the
     * (astronomically unlikely) chance of a collision with an existing row.
     */
    private async uniquePairingCode(): Promise<string> {
        for (;;) {
            const code = this.generateCode()
            const existing = await this.entityManager.findOne(
                PlaygroundSessionEntity,
                {
                    where: {
                        pairingCode: code,
                    },
                },
            )
            if (!existing) {
                return code
            }
        }
    }

    /** A short, unambiguous (no 0/O/1/I) uppercase pairing code, e.g. "7K4PQX". */
    private generateCode(): string {
        const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
        const bytes = randomBytes(6)
        let code = ""
        for (const byte of bytes) {
            code += alphabet[byte % alphabet.length]
        }
        return code
    }
}
