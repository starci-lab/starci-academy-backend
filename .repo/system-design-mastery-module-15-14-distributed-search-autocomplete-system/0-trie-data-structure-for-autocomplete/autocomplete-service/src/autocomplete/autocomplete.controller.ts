import {
    Body,
    Controller,
    Get,
    Post,
    Query,
} from "@nestjs/common"
import {
    AutocompleteService,
} from "./autocomplete.service"
import {
    TrackSearchDto,
} from "./dto"

/**
 * REST controller phơi bày các endpoint kiểm thử luồng của bài học.
 * (EN: REST controller exposing lesson verification endpoints.)
 */
@Controller("api/autocomplete")
export class AutocompleteController {
    constructor(
        private readonly service: AutocompleteService,
    ) {}

    /**
     * Trả về gợi ý autocomplete theo prefix.
     * (EN: Returns autocomplete suggestions for a prefix.)
     */
    @Get("suggest")
    suggest(@Query("prefix") prefix = "app") {
        return this.service.suggest(prefix)
    }

    /**
     * Ghi nhận truy vấn để cập nhật tần suất.
     * (EN: Tracks a query to update frequency.)
     */
    @Post("search")
    search(@Body() body: TrackSearchDto) {
        return this.service.search(body.query)
    }

}
