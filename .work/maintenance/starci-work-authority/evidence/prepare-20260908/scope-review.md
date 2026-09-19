# StarCi Work authority scope review

## Approved rule

Canonical `.work` is the source of trust. Only a node whose effective state is `done`, with current evidence and explicit acceptance, can authorize a downstream workflow. Inspected source code is legacy/current-state observation and gap evidence only.

## Prepared scope

- Work node: `nivo.maintenance.starci-work-authority`
- State after preparation: `todo`
- Runtime source remains unchanged during `prepare-work`.
- Later source effects are limited to the approved StarCi instruction, operator, specification contract, validator regression tests and generated `.dist` files.
- Publication is limited to one verified commit pushed to `origin/main`.

## Denied authority

`todo`, `uninvestigate`, stale or suspended Work, source comments, test names and observed implementation behavior grant no requirement authority. Product Work cannot be rewritten to fit legacy code.

## Validation

The complete existing workspace validated successfully after adding this leaf. The existing `OPTIONAL_UNMET` warning is expected because this optional maintenance leaf remains `todo` until the approved runtime repair and publication are accepted.
