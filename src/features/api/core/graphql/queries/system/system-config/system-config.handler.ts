import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    AiAutoQuotaConfigService,
    MountFilesystemService,
} from "@modules/filesystem"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    SystemConfigQuery,
} from "./system-config.query"
import {
    SystemConfigData,
} from "./graphql-types"

@QueryHandler(SystemConfigQuery)
@Injectable()
/**
 * Reads challenge/task thresholds from mounted `app.json` and Auto-lane caps
 * from the AI quota config service into the public `systemConfig` shape.
 */
export class SystemConfigHandler
    extends ICQRSHandler<SystemConfigQuery, SystemConfigData>
    implements IQueryHandler<SystemConfigQuery, SystemConfigData>
{
    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
        private readonly aiAutoQuotaConfigService: AiAutoQuotaConfigService,
    ) {
        super()
    }

    protected override async process(
    ): Promise<SystemConfigData> {
        const {
            challenge,
            task,
        } = this.mountFilesystemService.appConfig().systemConfig
        const auto = this.aiAutoQuotaConfigService.getAutoQuota()
        return {
            challenge,
            task,
            ai: {
                auto,
            },
        }
    }
}
