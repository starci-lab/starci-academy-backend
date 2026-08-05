import {
    BabyDucklingBadge,
} from "./badges/baby-duckling.badge"
import {
    BlazingFoxBadge,
} from "./badges/blazing-fox.badge"
import {
    SwordSharkBadge,
} from "./badges/sword-shark.badge"
import {
    CrownedOwlBadge,
} from "./badges/crowned-owl.badge"
import {
    PolyglotParrotBadge,
} from "./badges/polyglot-parrot.badge"
import {
    BugHuntingChameleonBadge,
} from "./badges/bug-hunting-chameleon.badge"
import {
    BrainyOctopusBadge,
} from "./badges/brainy-octopus.badge"
import {
    GuidingElephantBadge,
} from "./badges/guiding-elephant.badge"
import {
    BusyBeeBadge,
} from "./badges/busy-bee.badge"
import {
    ChampionLionBadge,
} from "./badges/champion-lion.badge"
import {
    ArchitectRhinoBadge,
} from "./badges/architect-rhino.badge"
import {
    FullstackMonkeyBadge,
} from "./badges/fullstack-monkey.badge"
import {
    DevopsWolfBadge,
} from "./badges/devops-wolf.badge"

export * from "./badges/abstract-badge"
export * from "./badges/baby-duckling.badge"
export * from "./badges/blazing-fox.badge"
export * from "./badges/sword-shark.badge"
export * from "./badges/crowned-owl.badge"
export * from "./badges/polyglot-parrot.badge"
export * from "./badges/bug-hunting-chameleon.badge"
export * from "./badges/brainy-octopus.badge"
export * from "./badges/guiding-elephant.badge"
export * from "./badges/busy-bee.badge"
export * from "./badges/champion-lion.badge"
export * from "./badges/architect-rhino.badge"
export * from "./badges/fullstack-monkey.badge"
export * from "./badges/devops-wolf.badge"

/** DI token resolving to every {@link AbstractBadge} as an array. */
export const ACHIEVEMENT_BADGES = "ACHIEVEMENT_BADGES"

/** Every badge service class -- registered as providers + folded into the token. */
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
    ArchitectRhinoBadge,
    FullstackMonkeyBadge,
    DevopsWolfBadge,
]
