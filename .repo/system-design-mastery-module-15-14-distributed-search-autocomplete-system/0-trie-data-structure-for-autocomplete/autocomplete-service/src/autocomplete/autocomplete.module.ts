import {
    Module,
} from "@nestjs/common"
import {
    AutocompleteController,
} from "./autocomplete.controller"
import {
    AutocompleteService,
} from "./autocomplete.service"

/**
 * Feature module cho bài học Cấu trúc Trie cho autocomplete.
 * (EN: Feature module for Trie Data Structure for Autocomplete.)
 */
@Module({
    controllers: [
        AutocompleteController,
    ],
    providers: [
        AutocompleteService,
    ],
    exports: [
        AutocompleteService,
    ],
})
export class AutocompleteModule {}
