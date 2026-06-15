import {
    BabyDucklingBadge,
} from "./baby-duckling.badge"
import {
    BlazingFoxBadge,
} from "./blazing-fox.badge"
import {
    SwordSharkBadge,
} from "./sword-shark.badge"
import {
    CrownedOwlBadge,
} from "./crowned-owl.badge"
import {
    PolyglotParrotBadge,
} from "./polyglot-parrot.badge"
import {
    BugHuntingChameleonBadge,
} from "./bug-hunting-chameleon.badge"
import {
    BrainyOctopusBadge,
} from "./brainy-octopus.badge"
import {
    GuidingElephantBadge,
} from "./guiding-elephant.badge"
import {
    BusyBeeBadge,
} from "./busy-bee.badge"
import {
    ChampionLionBadge,
} from "./champion-lion.badge"

export * from "./abstract-badge"
export * from "./baby-duckling.badge"
export * from "./blazing-fox.badge"
export * from "./sword-shark.badge"
export * from "./crowned-owl.badge"
export * from "./polyglot-parrot.badge"
export * from "./bug-hunting-chameleon.badge"
export * from "./brainy-octopus.badge"
export * from "./guiding-elephant.badge"
export * from "./busy-bee.badge"
export * from "./champion-lion.badge"

/** DI token resolving to every {@link AbstractBadge} as an array. */
export const ACHIEVEMENT_BADGES = "ACHIEVEMENT_BADGES"

/** Every badge service class — registered as providers + folded into the token. */
export const ACHIEVEMENT_BADGE_PROVIDERS = [
    BabyDucklingBadge,
    BlazingFoxBadge,
    SwordSharkBadge,
    CrownedOwlBadge,
    PolyglotParrotBadge,
    BugHuntingChameleonBadge,
    BrainyOctopusBadge,
    GuidingElephantBadge,
    BusyBeeBadge,
    ChampionLionBadge,
]
