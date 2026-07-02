import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    CvGenerationMode,
    Locale,
} from "@modules/databases"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    EnqueueGenerateCvJobService,
} from "@features/api/processors/ai/generate-cv"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    GenerateCvCommand,
} from "./generate-cv.command"
import {
    GenerateCvData,
} from "./graphql-types"

@CommandHandler(GenerateCvCommand)
@Injectable()
export class GenerateCvHandler
    extends ICQRSHandler<GenerateCvCommand, GenerateCvData>
    implements ICommandHandler<GenerateCvCommand, GenerateCvData> {
    constructor(
        private readonly enqueueGenerateCvJobService: EnqueueGenerateCvJobService,
    ) {
        super()
    }

    protected override async process(
        command: GenerateCvCommand,
    ): Promise<GenerateCvData> {
        const {
            request: {
                extraPrompts,
            },
            user,
            locale,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        // create the Pending cv_generations row + enqueue the build job.
        const cvGeneration = await this.enqueueGenerateCvJobService.enqueue({
            userId: user.id,
            mode: CvGenerationMode.Generate,
            extraPrompts: extraPrompts ?? undefined,
            locale: locale ?? Locale.En,
        })

        return {
            cvGenerationId: cvGeneration.id,
        }
    }
}
