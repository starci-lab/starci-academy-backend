/**
 * Create-cat DTO — validates `name` and `age` for POST `/cats`.
 */
import {
    IsInt,
    IsNotEmpty,
} from "class-validator"

/**
 * Class `CreateCatDto` — lesson lab component.
 */
export class CreateCatDto {
    @IsNotEmpty({
        message: "name should not be empty",
    })
        name!: string

    @IsInt()
        age!: number
}
