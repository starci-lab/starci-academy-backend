import {
    Inject,
} from "@nestjs/common"
import {
    QDRANT_CLIENT,
} from "./constants/client"

/** Injects initialized shared Qdrant client into a provider. */
export const InjectQdrantClient = () => Inject(QDRANT_CLIENT)
