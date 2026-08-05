import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    DeviceEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import type {
    RecordDeviceParams,
    RecordDeviceResult,
} from "./types"

@Injectable()
/**
 * Records the devices a user authenticates / submits from, keyed by the
 * client-generated fingerprint. Used for audit and anti-cheat correlation
 * (e.g. many accounts sharing one device, or one account spread across many).
 *
 * @example
 * await deviceService.recordDevice({ userId, fingerprint, ipAddress, userAgent })
 */
export class DeviceService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Upserts the (user, fingerprint) device row and bumps its last-seen
     * metadata. No-ops when the client supplied no fingerprint.
     *
     * @param params - userId + fingerprint + ip/user-agent.
     * @returns void
     *
     * @example
     * await deviceService.recordDevice({ userId, fingerprint, ipAddress, userAgent })
     */
    async recordDevice({
        userId,
        fingerprint,
        ipAddress,
        userAgent,
    }: RecordDeviceParams): Promise<RecordDeviceResult> {
        // without a fingerprint we cannot identify the device → skip silently
        if (!fingerprint) {
            return
        }
        // find an existing row for this user+device (the unique pair)
        const existing = await this.entityManager.findOne(DeviceEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                    fingerprint,
                },
            })
        // first sighting → create a fresh (untrusted) device row
        if (!existing) {
            await this.entityManager.save(DeviceEntity,
                {
                    user: {
                        id: userId,
                    },
                    fingerprint,
                    ipAddress,
                    userAgent,
                    // stamped explicitly so the value is set even before the next save
                    lastSeenAt: new Date(),
                })
            return
        }
        // returning device → refresh the latest IP/UA and bump last-seen
        existing.ipAddress = ipAddress
        existing.userAgent = userAgent
        existing.lastSeenAt = new Date()
        await this.entityManager.save(DeviceEntity,
            existing)
    }
}
