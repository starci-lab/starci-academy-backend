import {
    Injectable,
} from "@nestjs/common"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    MyGithubTeamStatusHandler,
} from "./my-github-team-status.handler"
import type {
    MyGithubTeamStatusData,
} from "./graphql-types/response"

@Injectable()
/** Thin bridge from the `myGithubTeamStatus` resolver to its handler. */
export class MyGithubTeamStatusService {
    constructor(
        private readonly handler: MyGithubTeamStatusHandler,
    ) {}

    async execute(user: UserEntity): Promise<MyGithubTeamStatusData> {
        return this.handler.execute(user)
    }
}
