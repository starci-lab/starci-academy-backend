# sortIndex
<!-- @starci/seperator -->
0
<!-- @starci/seperator -->
# isPremium
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
# question
<!-- @starci/seperator -->
You need one service to depend on another. Why hand that dependency's creation over to a container instead of just constructing it yourself wherever you need it?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
junior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Dependency Injection
<!-- @starci/seperator -->
## 1
<!-- @starci/seperator -->
Architecture
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
TL;DR
:::
Constructing it yourself hard-wires you to one concrete implementation, spins up a private copy every time you do it (no sharing), and locks your tests to the real object. Handing creation to a {{c1::container::factory function,service locator}} buys testability (swap in a mock), loose coupling (swap implementations without touching consumers), and centralized lifecycle management.

:::muted
How it works
:::
A component declares what it needs via its constructor's parameters; the container reads those, builds the dependency graph in the right order, creates each instance once, and injects it. You never instantiate a dependency yourself — you only declare intent.

:::muted
Common pitfall
:::
A hand-built dependency inside a class makes that class impossible to unit-test without spinning up the real thing. And if two different places each construct the "same" dependency themselves, you silently lose the one-shared-instance guarantee entirely.

:::muted
Go deeper
:::
if the same service gets constructed in two different places by mistake, what observable bug does that cause for something that's supposed to hold shared state?
<!-- @starci/seperator -->
