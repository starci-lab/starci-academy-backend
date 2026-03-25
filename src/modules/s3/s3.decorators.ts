import {
    Inject 
} from "@nestjs/common"
import {
    S3 
} from "./constants"

export const InjectS3 = () => Inject(S3)