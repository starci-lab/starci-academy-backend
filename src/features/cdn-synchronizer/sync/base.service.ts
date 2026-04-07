import {
    EntityManager,
    ObjectLiteral,
} from "typeorm"
import {
    S3BuildService,
    S3UploadService,
    S3ReadService,
} from "@modules/s3"
import {
    WinstonService,
} from "@modules/winston"
import {
    InjectSuperJson
} from "@modules/mixin"
import SuperJSON from "superjson"
import _ from "lodash"
import {
    sleep
} from "@modules/common"

/**
 * Base class for synchronizing entities to the CDN.
 */
export abstract class BaseSyncService<T extends ObjectLiteral & { id: string; toPlain?: () => any }> {
    protected isSyncing = false

    constructor(
        protected readonly s3UploadService: S3UploadService,
        protected readonly s3BuildService: S3BuildService,
        protected readonly s3ReadService: S3ReadService,
        @InjectSuperJson()
        protected readonly superJson: SuperJSON,
        protected readonly entityManager: EntityManager,
        protected readonly winstonService: WinstonService,
    ) {}

    /** The entity type (e.g., CourseEntity). */
    protected abstract get entityType(): { new (): T }

    /** The prefix for S3 keys (e.g., "courses"). */
    protected abstract get keyPrefix(): string

    /** The relations to fetch during sync. */
    protected abstract get relations(): string[] | any

    /**
     * Run the full sync cycle for all entities and the collection manifest.
     */
    protected async runSyncCycle() {
        if (this.isSyncing) return
        this.isSyncing = true
        try {
            await this.syncIndividualEntities()
            await this.syncCollection()
        } finally {
            this.isSyncing = false
        }
    }

    /**
     * Sync each entity individually.
     */
    private async syncIndividualEntities() {
        const entities = await this.entityManager.find(this.entityType, {
            select: ["id" as any],
        })

        for (const entity of entities) {
            await this.syncOneWithRetry(entity.id)
        }
    }

    /**
     * Sync one entity to S3 and update the database with retry.
     * @param id - The ID of the entity to sync.
     * @returns True if the entity was synced successfully, false otherwise.
     */
    protected async syncOneWithRetry(id: string): Promise<boolean> {
        const maxRetries = this.retryOptions.maxRetries
        const retryDelayMs = this.retryOptions.retryDelayMs

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const cdnUrl = await this.syncOne(id)

            if (cdnUrl) {
                return true
            }

            this.logAttemptFailed(id, attempt, maxRetries)

            if (attempt < maxRetries) {
                await sleep(retryDelayMs)
            }
        }

        this.logMaxRetriesReached(id, maxRetries)
        return false
    }

    /** Retry configuration (max attempts and delay). */
    protected abstract get retryOptions(): { maxRetries: number; retryDelayMs: number }

    /** Log a failed sync attempt. */
    protected abstract logAttemptFailed(id: string, attempt: number, maxRetries: number): void

    /** Log when maximum retries are reached. */
    protected abstract logMaxRetriesReached(id: string, maxRetries: number): void

    /**
     * Sync a single entity.
     */
    protected async syncOne(id: string): Promise<string | null> {
        try {
            const entity = await this.entityManager.findOne(this.entityType, {
                where: { id: id as any },
                relations: this.relations,
            })

            if (!entity) return null

            const plain = entity.toPlain ? entity.toPlain() : entity
            const json = this.superJson.stringify(plain)
            const s3Key = `${this.keyPrefix}-${id}.json`

            // Check for changes
            const existing = await this.s3ReadService.json<any>(s3Key)
            if (existing && _.isEqual(existing, plain)) {
                return this.s3BuildService.buildPublicObjectUrl(s3Key)
            }

            // Upload new version
            await this.s3UploadService.json({
                name: s3Key,
                json,
                acl: "private",
            })

            const cdnUrl = s3Key // Store the key instead of the full public URL
            
            // Update database with CDN URL (the key)
            const metadata = this.entityManager.getRepository(this.entityType).metadata
            if (metadata.findColumnWithPropertyName("cdnUrl")) {
                await this.entityManager.update(this.entityType, { id: id as any }, { cdnUrl } as any)
            }

            return cdnUrl
        } catch (error) {
            this.handleError(id, error)
            return null
        }
    }

    /**
     * Sync the entire collection into a single manifest file.
     */
    protected async syncCollection(): Promise<string | null> {
        try {
            const allEntities = await this.entityManager.find(this.entityType, {
                relations: this.relations,
                order: { id: "ASC" } as any,
            })

            const plains = allEntities.map(e => (e.toPlain ? e.toPlain() : e))
            const json = this.superJson.stringify(plains)
            const s3Key = `${this.keyPrefix}.json`

            // Check for changes
            const existing = await this.s3ReadService.json<any[]>(s3Key)
            if (existing && _.isEqual(existing, plains)) {
                return this.s3BuildService.buildPublicObjectUrl(s3Key)
            }

            // Upload collection manifest
            await this.s3UploadService.json({
                name: s3Key,
                json,
                acl: "private",
            })

            return this.s3BuildService.buildPublicObjectUrl(s3Key)
        } catch (error) {
            this.handleError("collection", error)
            return null
        }
    }

    protected abstract handleError(id: string, error: any): void
}
