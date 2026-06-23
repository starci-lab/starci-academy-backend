import {
    Injectable,
} from "@nestjs/common"
import {
    UserEntity,
} from "@modules/databases"
import {
    MyGithubTeamStatusHandler,
} from "./my-github-team-status.handler"
import type {
    MyGithubTeamStatusData,
} from "./graphql-types"

@Injectable()
export class MyGithubTeamStatusService {
    constructor(
        private readonly handler: MyGithubTeamStatusHandler,
    ) {}

    async execute(user: UserEntity): Promise<MyGithubTeamStatusData> {
        return this.handler.execute(user)
    }
}
