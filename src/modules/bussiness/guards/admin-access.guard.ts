import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common"
import {
    MountStorageService,
} from "@modules/filesystem"

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
            throw new UnauthorizedException("Admin API key is empty")
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
            throw new UnauthorizedException("x-admin-api-key header is required")
        }
        if (apiKey !== this.readAdminApiKey()) {
            throw new ForbiddenException("Invalid admin API key")
        }
        return true
    }
}
