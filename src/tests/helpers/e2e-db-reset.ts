import {
    E2eDbResetService,
} from "./e2e-db-reset.service"

/**
 * Jest `setupFilesAfterEnv` entry for the e2e lane: hand every spec file a clean
 * database when it finishes.
 *
 * A setup file's hooks are the outermost in the file, so this `afterAll` runs
 * last -- after the suite has closed its own Nest app. All the reasoning about
 * WHY this is central rather than per-suite lives on {@link E2eDbResetService};
 * this file is only the wiring Jest can load by path.
 */
afterAll(async () => {
    await new E2eDbResetService().reset()
})
