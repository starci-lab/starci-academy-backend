# Projects and career

> Business head: `fbdd3a27f504677664c5457af29d396bdd8e7d2de882e0e520a84a2ed02f6429`
>
> Approved owner revision: `2ae6be3fcc3222442c8e2c6b15bf5fbb6e18946e183e6a546ee15e48f3edd2ec`

## Personal Project outcome

An enrolled learner moves from roadmap to one task, configures repository and AI-grading intent, submits once, observes asynchronous grading, understands immutable evidence, revises after failure and continues after pass.

## Surfaces

- `personal-project-roadmap` — resume, repository summary, progress and milestones.
- `personal-project-task` — task brief plus persistent repository/grading action area.
- `personal-project-grading-settings` — adaptive overlay for language, model, branch and write-only token.
- `personal-project-result` — selected attempt, score, verdict, served model and structured findings.
- `personal-project-attempt-history` — adaptive newest-first attempt selector.

## Non-negotiable behavior

- A concrete learner-selected model sends both model and provider. Auto delegates to backend selection.
- The task brief survives ancillary failures.
- Repository token reads expose last four only.
- An in-flight review cannot be duplicated accidentally.
- Failed results return to revision with settings preserved; passed results use backend progress truth for the next task.
- Challenge remains a separate authority and joins only the final UAT run.

See [CONTEXT.md](CONTEXT.md) for routed modules and [model.json](model.json) for machine authority.
