import {
    CanActivate,
    ExecutionContext,
    Injectable,
} from "@nestjs/common"
import {
    MountStorageService,
} from "@modules/filesystem"
import {
    AdminApiKeyNotConfiguredException,
    AdminApiKeyRequiredException,
    InvalidAdminApiKeyException,
} from "@modules/exceptions"

/**
 * Guard that grants access only when admin API key matches mounted secret.
 */
@Injectable()
export class AdminAccessGuard implements CanActivate {
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
