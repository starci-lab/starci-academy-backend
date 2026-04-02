import {
    ChallengePromptEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    In,
} from "typeorm"
import type {
    UpdateParams,
} from "./types"
import {
    sanitizePrimitiveFields,
} from "./utils"
import _ from "lodash"

@Injectable()
export class ChallengePromptService {
    async updateChallengePrompt(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<ChallengePromptEntity>,
    ) {
        await entityManager.update(
            ChallengePromptEntity,
            {
                id: previous.id,
            },
            sanitizePrimitiveFields(updated),
        )
    }

    async updateChallengePrompts(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<Array<ChallengePromptEntity>>,
    ) {
        const deleted = _.differenceBy(
            previous,
            updated,
            "id",
        )
        const created = _.differenceBy(
            updated,
            previous,
            "id",
        )
        const toUpdate = _.intersectionBy(
            previous,
            updated,
            "id",
        )
        await entityManager.delete(
            ChallengePromptEntity,
            {
                id: In(deleted.map((row) => row.id)),
            },
        )
        await entityManager.save(
            ChallengePromptEntity,
            created,
        )
        for (const prevRow of toUpdate) {
            await this.updateChallengePrompt(
                {
                    previous: prevRow,
                    updated: updated.find((candidate) => candidate.id === prevRow.id)!,
                    entityManager,
                },
            )
        }
    }
}
