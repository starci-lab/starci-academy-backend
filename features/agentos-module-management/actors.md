# Actors · AgentOS module management

## AgentOS user

- Creates a module after AgentOS is ready.
- Chooses one registered kind.
- Configures Overview, Shared chat and the kind-specific workbench.
- Validates readiness and activates the module.

## AgentOS platform

- Lists registered kinds and creates draft modules.
- Mounts shared chat for every module.
- Resolves exactly one workbench from the selected kind.
- Gates activation on actionable readiness validation.
