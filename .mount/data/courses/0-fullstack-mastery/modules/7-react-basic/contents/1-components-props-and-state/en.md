# title
Components, Props and State

# description
Hands-on building reusable React components, passing data via Props, and managing local state with useState.

# body

## 1. Opening

"The page has 20 identical product cards — should I copy-paste the HTML 20 times?" — a **Senior Engineer** asks during frontend review. A **Mid-level Developer** answers: "I'll use template strings." The answer shows awareness of code reuse, but misses depth on **component abstraction**: template strings have no lifecycle, no reactivity — **React components** are functions receiving **Props** (input) and managing **State** (local data), auto re-rendering when state changes.

This lesson runs through two tracks:
- **Part 2.1**: **hands-on**; **stack** is **React** + **Vite** + **TypeScript**, with the flow: create component → pass props → toggle state.
- **Part 2.2**: **theory** clarifying **Props vs State**, **component lifecycle**, and **edge cases**.

## 2. Core concepts

The lesson structure follows **practice-led theory**. First, learners clone the source, run the dev server via `npm run dev`, and open the browser to observe components receiving props and managing state via useState. Then the **theory** section analyzes Props vs State, re-render cycles, and **edge cases**.

### 2.1. Hands-on

#### 2.1.1. Prepare source code and environment

Source: [StarCi-Academy/fullstack-mastery-module-8-react-basic](https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic) on GitHub — lesson directory: [`1-components-props-and-state`](https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic/tree/main/1-components-props-and-state).

```bash
# Step 1: Clone the repository locally
git clone https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic.git

# Step 2: Navigate to the lesson directory
cd fullstack-mastery-module-8-react-basic/1-components-props-and-state
```

#### 2.1.2. Architecture / components

| Component | File | Role |
| --- | --- | --- |
| **App** | `src/App.tsx` | Root component, passes props |
| **ProductCard** | `src/components/ProductCard.tsx` | Receives props, displays product |
| **Counter** | `src/components/Counter.tsx` | useState manages count |

#### 2.1.3. Prerequisites and startup

##### 2.1.3.1. Prerequisites

- **Node.js** LTS, **npm**.

##### 2.1.3.2. Start

```bash
# Step 1: Install dependencies
npm install

# Step 2: Start dev server
npm run dev
```

This lesson does not use Docker, no resource cleanup is needed.

#### 2.1.4. Verification

##### 2.1.4.1. Flow 1 — Props passing data

  Open browser at **`http://localhost:5173`**. Page shows ProductCard list receiving props (name, price).

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:5173

  # macOS / Linux
  curl -s http://localhost:5173
  ```

##### 2.1.4.2. Flow 2 — State toggle

  Click Counter button → number increments. State changes → component re-renders.

*If the page renders:*

- *Props — data passed from parent to child, read-only.*
- *State — local data, mutable via useState, triggers re-render.*

#### 2.1.5. Cleanup

This lesson does not use Docker, no resource cleanup is needed.

#### 2.1.6. Further reading

- **React Components:** Function components and props. ([React Docs](https://react.dev/learn/your-first-component))
- **useState:** State management hook. ([React Docs](https://react.dev/reference/react/useState))

### 2.2. Theory — Props vs State

#### 2.2.1. Comparison

| Props | State |
| --- | --- |
| Passed from parent | Declared in component |
| Read-only | Mutable (via setter) |
| Changes → re-render child | Changes → re-render self |

#### 2.2.2. Edge cases to internalize

- **Direct state mutation:** `count++` instead of `setCount`. **Fix:** always use setter function.
- **Async state updates:** setState doesn't update immediately. **Fix:** use functional update `setCount(prev => prev + 1)`.
- **Props drilling:** Passing props through many levels. **Fix:** use Context API or state management.
- **Object/Array state:** Reference unchanged → no re-render. **Fix:** spread operator creates new object/array.

## 3. Wrap-up

### 3.1. Common interview questions

- **Question 1:** How do Props differ from State?
  - Sample answer: Props are input from parent (read-only); State is local data in a component (mutable).

- **Question 2:** Why not mutate state directly?
  - Sample answer: React uses reference comparison — direct mutation doesn't trigger re-render.

- **Question 3:** What is the key prop used for when rendering lists?
  - Sample answer: Helps React identify which elements changed/added/removed during reconciliation.

# references
## 0
### alias
React Components
### url
https://react.dev/learn/your-first-component
## 1
### alias
React useState
### url
https://react.dev/reference/react/useState

# minutesRead
15
