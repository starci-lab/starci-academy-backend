import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MilestoneTaskHydrationService,
} from "@modules/databases/postgresql/primary/hydration/milestone-task-hydration.service"
import {
    MilestoneTaskResolverService,
} from "@modules/databases/postgresql/primary/resolvers/milestone-task-resolver.service"
import {
    Injectable,
} from "@nestjs/common"
import type {
    LocalizedCdnEntity,
} from "./types"
import {
    S3NameResolverService,
} from "@modules/integrations/s3/s3-name-resolver.service"
import {
    MaterializeAndUploadService,
} from "./materialize-and-upload.service"

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
                const localizedTask = structuredClone(hydratedTask)
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
