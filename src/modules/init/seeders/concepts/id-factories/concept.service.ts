import {
    Injectable,
} from "@nestjs/common"
import {
    v5 as uuidv5,
} from "uuid"

/** Stable private namespace for course-independent concept rows. */
export const CONCEPT_UUID_NAMESPACE = uuidv5(
    "starci-academy:concepts:v1",
    uuidv5.URL,
)

@Injectable()
/** Generates a stable concept UUID from its canonical mount slug. */
export class ConceptIdFactoryService {
    generate(displayId: string): string {
        return uuidv5(`concept:${displayId}`,
            CONCEPT_UUID_NAMESPACE)
    }
}
