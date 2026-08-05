import {
    Inject,
    Provider
} from "@nestjs/common"
import {
    Faker,
    faker
} from "@faker-js/faker"
import {
    FAKER,
} from "./constants/faker"

/**
 * Injects the shared Faker token so seed/test code does not import `@faker-js/faker`
 * directly and accidentally create a second RNG stream.
 */
export const InjectFaker = () => Inject(FAKER)

/**
 * Binds the FAKER token to the singleton faker instance for MixinModule DI.
 */
export const createFakerServiceProvider = (): Provider<Faker> => ({
    provide: FAKER,
    useFactory: () => {
        return faker
    },
})