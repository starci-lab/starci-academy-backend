import {
    CanActivate,
    ExecutionContext,
    Injectable,
} from "@nestjs/common"
import {
    MountStorageService,
} from "@modules/filesystem/mount-storage.service"
import {
    AdminApiKeyNotConfiguredException,
} from "@modules/platform/exceptions/errors/guards/admin-api-key-not-configured"
import {
    AdminApiKeyRequiredException,
} from "@modules/platform/exceptions/errors/guards/admin-api-key-required"
import {
    InvalidAdminApiKeyException,
} from "@modules/platform/exceptions/errors/guards/invalid-admin-api-key"

@Injectable()
/**
 * Service-token guard: grants access only when the caller presents the
 * `x-admin-api-key` header and it matches the mounted secret. The subject
 * here is a bearer of a shared secret, not a product user session.
 */
export class AdminServiceTokenGuard implements CanActivate {
    constructor(
        private readonly mountStorageService: MountStorageService,
    ) { }

    /**
     * Read admin API key from terraform mount path.
     */
    private readAdminApiKey(): string {
        const key = this.mountStorageService.adminApiKey
        if (!key) {
            throw new AdminApiKeyNotConfiguredException({
            })
        }
        return key
    }

    /**
     * Validate x-admin-api-key header against mounted admin API key.
     */
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest()
        const headerValue = request.headers["x-admin-api-key"]
        const apiKey = Array.isArray(headerValue)
            ? headerValue[0]
            : headerValue
        if (!apiKey) {
            throw new AdminApiKeyRequiredException({
            })
        }
        if (apiKey !== this.readAdminApiKey()) {
            throw new InvalidAdminApiKeyException({
            })
        }
        return true
    }
}
