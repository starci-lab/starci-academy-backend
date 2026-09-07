# Import and state review

The migration separates four questions that the previous long task chain mixed together:

1. What the business must do.
2. Which architecture and ownership boundaries implement it.
3. Which exact backend/frontend commits contain the implementation.
4. Which user-visible behavior was actually observed under a named environment, identity alias, and fixture.

Imported evidence is reviewed leaf by leaf. A non-UI leaf may be promoted only when its assertion is supported by concrete source, code references, or a preserved behavioral result. UI remains suspended because the available visual-direction files are drafts and the user explicitly has not approved an art direction. Historical screenshots demonstrate observations, not design approval.

Known behavioral gaps remain visible rather than being converted to completion: Chatbot channel/isolation gaps and Accounting upload/self-approval/setup-finalization gaps require their own later evidence where represented by leaves.
