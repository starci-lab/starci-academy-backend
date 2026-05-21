/**
 * DTO tạo mèo — validate `name` và `age` cho endpoint POST `/cats`.
 * (EN: Create-cat DTO — validates `name` and `age` for POST `/cats`.)
 */
import {
    IsInt,
    IsNotEmpty,
} from "class-validator"

/**
 * Class `CreateCatDto` — thành phần lab (controller/service/module).
 * (EN: Class `CreateCatDto` — lesson lab component.)
 */
export class CreateCatDto {
    @IsNotEmpty({
        message: "name should not be empty",
    })
        name!: string

    @IsInt()
        age!: number
}
