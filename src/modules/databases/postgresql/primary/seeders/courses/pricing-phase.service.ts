import {
    PricingPhaseEntity,
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
import _ from "lodash"
import {
    sanitizePrimitiveFields,
} from "./utils"

/**
 * The service for Pricing Phases.
 */
@Injectable()
export class PricingPhaseService {
    constructor(
    ) {}

    /**
     * Update the pricing phase.
     * @param params - The parameters for updating the pricing phase.
     * @param params.previous - The previous pricing phase.
     * @param params.updated - The updated pricing phase.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updatePricingPhase(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<PricingPhaseEntity>,
    ) {
        await entityManager.update(
            PricingPhaseEntity,
            {
                id: previous.id,
            },
            sanitizePrimitiveFields(updated),
        )
    }

    /**
     * Update the pricing phases.
     * @param params - The parameters for updating the pricing phases.
     * @param params.previous - The previous pricing phases.
     * @param params.updated - The updated pricing phases.
     * @param params.entityManager - The entity manager.
     * @returns void.
     */
    async updatePricingPhases(
        {
            previous,
            updated,
            entityManager,
        }: UpdateParams<Array<PricingPhaseEntity>>,
    ) {
        // we get the deleted pricing phases
        const deletedPricingPhases = _.differenceBy(
            previous,
            updated,
            "id",
        )
        // we get the new pricing phases
        const createdPricingPhases = _.differenceBy(
            updated,
            previous,
            "id",
        )
        // we get the updated pricing phases
        const updatedPricingPhases = _.intersectionBy(
            previous,
            updated,
            "id",
        )

        // we delete the deleted pricing phases
        await entityManager.delete(
            PricingPhaseEntity,
            {
                id: In(deletedPricingPhases.map((row) => row.id)),
            },
        )

        // we save the new pricing phases
        await entityManager.save(
            PricingPhaseEntity,
            createdPricingPhases,
        )

        // we update the updated pricing phases
        for (const updatedPricingPhase of updatedPricingPhases) {
            await this.updatePricingPhase(
                {
                    previous: updatedPricingPhase,
                    updated: updated.find((updatedPricingPhase) => updatedPricingPhase.id === updatedPricingPhase.id)!,
                    entityManager,
                },
            )
        }
    }
}

