# title
Hooks and API Calls

# description
Hands-on using useEffect to fetch APIs from React, managing loading/error state, and understanding hook lifecycle in function components.

# body

## 1. Opening

"Component needs to fetch users from backend on mount — where should I call the API?" — a **Senior Engineer** asks during data fetching review. A **Mid-level Developer** answers: "I'll call fetch() directly in the function body." The answer shows awareness of API calls, but misses depth on **side effect management**: calling fetch in render body → runs every re-render → infinite loop — **useEffect** hook controls side effects, running only when dependencies change.

This lesson runs through two tracks:
- **Part 2.1**: **hands-on**; **stack** is **React** + **Vite** + **TypeScript**, with the flow: useEffect fetch → loading → render data.
- **Part 2.2**: **theory** clarifying **useEffect lifecycle**, **dependency array**, and **edge cases**.

## 2. Core concepts

The lesson structure follows **practice-led theory**. First, learners clone the source, run the dev server via `npm run dev`, and open the browser to observe the component fetching data from an API, displaying loading state, then rendering data. Then the **theory** section analyzes useEffect lifecycle, cleanup functions, and **edge cases**.

### 2.1. Hands-on

#### 2.1.1. Prepare source code and environment

Source: [StarCi-Academy/fullstack-mastery-module-8-react-basic](https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic) on GitHub — lesson directory: [`2-hooks-and-api-calls`](https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic/tree/main/2-hooks-and-api-calls).

```bash
# Step 1: Clone the repository locally
git clone https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic.git

# Step 2: Navigate to the lesson directory
cd fullstack-mastery-module-8-react-basic/2-hooks-and-api-calls
```

#### 2.1.2. Architecture / components

| Component | File | Role |
| --- | --- | --- |
| **App** | `src/App.tsx` | Root component |
| **UserList** | `src/components/UserList.tsx` | useEffect + fetch API |
| **API** | Public API (JSONPlaceholder) | Data source |

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

##### 2.1.4.1. Flow 1 — Fetch and render data

  Open browser at **`http://localhost:5173`**. Component shows "Loading..." → fetches API → renders user list.

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:5173

  # macOS / Linux
  curl -s http://localhost:5173
  ```

*If the page renders:*

- *useEffect — side effect runs only after render, controlled by dependency array.*
- *Loading state — UX pattern: loading → success/error.*

#### 2.1.5. Cleanup

This lesson does not use Docker, no resource cleanup is needed.

#### 2.1.6. Further reading

- **useEffect:** Side effect management hook. ([React Docs](https://react.dev/reference/react/useEffect))
- **Fetching Data:** Patterns and best practices. ([React Docs](https://react.dev/learn/synchronizing-with-effects))

### 2.2. Theory — useEffect Lifecycle

#### 2.2.1. Dependency Array

| Syntax | When it runs |
| --- | --- |
| `useEffect(fn)` | Every render |
| `useEffect(fn, [])` | Mount only (once) |
| `useEffect(fn, [dep])` | When `dep` changes |

#### 2.2.2. Edge cases to internalize

- **Missing dependency:** Forgetting to add a variable to dependency array. **Fix:** use ESLint rule `exhaustive-deps`.
- **Race condition:** Component unmounts before fetch completes. **Fix:** cleanup function with AbortController.
- **Infinite loop:** setState in useEffect without dependencies. **Fix:** always declare dependency array.
- **Stale closure:** Callback reads old state. **Fix:** use functional update or useRef.

## 3. Wrap-up

### 3.1. Common interview questions

- **Question 1:** What does an empty dependency array [] mean in useEffect?
  - Sample answer: Effect runs only once on mount — equivalent to componentDidMount.

- **Question 2:** How to avoid race conditions when fetching in useEffect?
  - Sample answer: Return AbortController.abort() in cleanup function to cancel request on unmount.

- **Question 3:** Why not call fetch directly in the render body?
  - Sample answer: Render body runs every re-render → infinite fetch loop. useEffect controls when it runs.

# references
## 0
### alias
React useEffect
### url
https://react.dev/reference/react/useEffect
## 1
### alias
React Data Fetching
### url
https://react.dev/learn/synchronizing-with-effects

# minutesRead
15
