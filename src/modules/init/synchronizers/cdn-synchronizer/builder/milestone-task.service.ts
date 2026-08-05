import {
    Locale,
    MilestoneTaskEntity,
    MilestoneTaskHydrationService,
    MilestoneTaskResolverService,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    LocalizedCdnEntity,
} from "./types"
import {
    S3NameResolverService,
} from "@modules/s3"
import {
    MaterializeAndUploadService,
} from "./materialize-and-upload.service"
import _ from "lodash"

@Injectable()
/**
 * Loads a milestone task (with briefs, criteria, code implementations) from PostgreSQL and
 * materializes **per-locale** plain objects (after `MilestoneTaskResolverService`) for CDN JSON.
 */
export class CdnMilestoneTaskBuildService {
    constructor(
        private readonly milestoneTaskHydration: MilestoneTaskHydrationService,
        private readonly milestoneTaskResolver: MilestoneTaskResolverService,
        private readonly s3NameResolverService: S3NameResolverService,
        private readonly materializeAndUploadService: MaterializeAndUploadService,
    ) {}

    /**
     * @returns One entry per [[Locale]] with the transformed milestone task tree.
     */
    async buildMultilingualByMilestoneTaskId(
        milestoneTaskId: string,
    ): Promise<Array<LocalizedCdnEntity<MilestoneTaskEntity>>> {
        const hydratedTask = await this.milestoneTaskHydration.loadById(
            milestoneTaskId,
        )
        const defaultLocale = hydratedTask.defaultLocale ?? Locale.En
        return Object.values(Locale).map(
            (
                locale,
            ) => {
                const localizedTask = _.cloneDeep(hydratedTask)
                this.milestoneTaskResolver.transform(
                    localizedTask,
                    locale,
                    defaultLocale,
                )
                return {
                    locale,
                    entity: localizedTask,
                }
            },
        )
    }

    /**
     * Materialize and upload the milestone task to the CDN.
     * @param milestoneTaskId - The milestone task id to materialize and upload.
     */
    async materializeAndUpload(
        milestoneTaskId: string,
    ): Promise<void> {
        const tasks = await this.buildMultilingualByMilestoneTaskId(
            milestoneTaskId,
        )
        await this.materializeAndUploadService.process(
            tasks,
            (
                id,
                locale,
            ) => this.s3NameResolverService.milestoneTask(
                id,
                locale,
            ),
        )
    }
}
