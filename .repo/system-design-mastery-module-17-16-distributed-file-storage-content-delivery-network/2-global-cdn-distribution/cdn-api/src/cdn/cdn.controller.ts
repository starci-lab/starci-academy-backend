import {
    Controller,
    Get,
    Query,
} from "@nestjs/common"
import {
    CdnService,
} from "./cdn.service"

/**
 * REST controller phoi bay cac endpoint kiem thu luong cua bai hoc.
 * (EN: REST controller exposing lesson verification endpoints.)
 */
@Controller("api/cdn")
export class CdnController {
    constructor(
        private readonly service: CdnService,
    ) {}

    /**
     * Tra ve edge CDN phu hop cho object.
     * (EN: Returns the CDN edge selected for an object.)
     */
    @Get("route")
    route(
        @Query("objectKey") objectKey = "videos/intro.mp4",
        @Query("region") region = "sin",
    ) {
        return this.service.routeObject(objectKey, region)
    }

}
