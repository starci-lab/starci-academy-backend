# Contracts · AgentOS module management

## Module shell

Owns module identity, lifecycle, shared chat and the selected `kind` reference.

## Kind registry

Each registered kind declares one workbench contract and its required configuration schema. New kinds do not redefine the module shell or shared chat.

## Readiness

Readiness joins required common settings, shared-chat settings and kind-owned workbench settings. Activation is legal only when the joined result is ready.
