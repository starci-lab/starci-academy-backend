import type {
    ModuleMockMap, MockDefinition,
} from "./types"

/** Lesson 0 -- useForm + zodResolver: signup POSTs a new user; a couple of rows suffice. */
const useFormAndZodResolver: MockDefinition = {
    seedUsers: [
        {
            id: 1, name: "Alice", email: "alice@starci.dev",
        },
        {
            id: 2, name: "Bob", email: "bob@starci.dev",
        },
    ],
}

/**
 * Lesson 1 -- async validation: `admin` must read as TAKEN (the spec types `admin`
 * -> "taken" and `zora42` -> "available"), so seed users whose names collide.
 */
const asyncValidationWithDebounce: MockDefinition = {
    seedUsers: [
        {
            id: 1, name: "admin", email: "admin@starci.dev",
        },
        {
            id: 2, name: "alice", email: "alice@starci.dev",
        },
        {
            id: 3, name: "bob", email: "bob@starci.dev",
        },
    ],
}

/** Lesson 2 -- multi-step wizard: submit POSTs the wizard payload as a user. */
const multiStepWizardForm: MockDefinition = {
    seedUsers: [
        {
            id: 1, name: "Alice", email: "alice@starci.dev",
        },
    ],
}

/** Lesson 3 -- dynamic fields: submits invoices (not users); a single seed row is enough. */
const dynamicFieldsWithUseFieldArray: MockDefinition = {
    seedUsers: [
        {
            id: 1, name: "Alice", email: "alice@starci.dev",
        },
    ],
}

/**
 * Mock definitions for module `5-form-mastery-rhf-zod`, keyed by lesson display id.
 */
export const formMasteryMocks: ModuleMockMap = {
    "0-useform-and-zod-resolver": useFormAndZodResolver,
    "1-async-validation-with-debounce": asyncValidationWithDebounce,
    "2-multi-step-wizard-form": multiStepWizardForm,
    "3-dynamic-fields-with-usefieldarray": dynamicFieldsWithUseFieldArray,
}
