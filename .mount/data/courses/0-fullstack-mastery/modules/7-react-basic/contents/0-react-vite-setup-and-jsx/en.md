# title
React Vite Setup and JSX

# description
Set up a React project with Vite, understand directory structure, write first JSX, and render a component to the browser.

# body

## 1. Opening

"Frontend needs to display dynamic data — should I write plain HTML and use `innerHTML` to update?" — a **Senior Engineer** asks during frontend architecture review. A **Mid-level Developer** answers: "I'll use jQuery." The answer shows awareness of DOM manipulation, but misses depth on **declarative UI**: jQuery is imperative → code becomes hard to maintain at scale — **React** declares UI as a function of state, the framework auto-updates the DOM when state changes.

This lesson runs through two tracks:
- **Part 2.1**: **hands-on**; **stack** is **React** + **Vite** + **TypeScript**, with the flow: create project → write JSX → render.
- **Part 2.2**: **theory** clarifying **Virtual DOM**, **JSX transpilation**, and **edge cases**.

## 2. Core concepts

The lesson structure follows **practice-led theory**. First, learners clone the source, run the dev server via `npm run dev`, and open the browser to observe React component rendering. Then the **theory** section analyzes Virtual DOM, JSX transpilation, and **edge cases**.

### 2.1. Hands-on

#### 2.1.1. Prepare source code and environment

Source: [StarCi-Academy/fullstack-mastery-module-8-react-basic](https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic) on GitHub — lesson directory: [`0-react-vite-setup-and-jsx`](https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic/tree/main/0-react-vite-setup-and-jsx).

```bash
# Step 1: Clone the repository locally
git clone https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic.git

# Step 2: Navigate to the lesson directory
cd fullstack-mastery-module-8-react-basic/0-react-vite-setup-and-jsx
```

#### 2.1.2. Architecture / components

| Component | File | Role |
| --- | --- | --- |
| **Vite** | `vite.config.ts` | Dev server + HMR |
| **App** | `src/App.tsx` | Root component |
| **main** | `src/main.tsx` | Entry point → ReactDOM.render |
| **index.html** | `index.html` | HTML shell |

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

##### 2.1.4.1. Flow 1 — Render component in browser

  Open browser at **`http://localhost:5173`** (Vite default port).

  Page displays content from `App.tsx`. Edit text in `App.tsx` → browser auto-updates (HMR).

  ```bash
  # Windows (PowerShell) — verify dev server running
  Invoke-RestMethod -Uri http://localhost:5173

  # macOS / Linux
  curl -s http://localhost:5173
  ```

*If the page renders:*

- *Vite — dev server with HMR, no manual refresh needed.*
- *JSX — HTML-like syntax in TypeScript, transpiled to React.createElement().*

#### 2.1.5. Cleanup

This lesson does not use Docker, no resource cleanup is needed.

#### 2.1.6. Further reading

- **React:** Declarative UI framework. ([React Docs](https://react.dev/))
- **Vite:** Next-gen frontend tooling. ([Vite Docs](https://vitejs.dev/))
- **JSX:** Syntax extension for JavaScript. ([React JSX](https://react.dev/learn/writing-markup-with-jsx))

### 2.2. Theory — Virtual DOM and JSX

#### 2.2.1. Virtual DOM

- React creates a **Virtual DOM** (JS object tree) → diffs against old DOM → only updates changed parts (**reconciliation**).
- More efficient than `innerHTML` as it avoids full DOM reflow.

#### 2.2.2. JSX Transpilation

```
JSX: <h1>Hello</h1>
     ↓ Babel/SWC
JS:  React.createElement('h1', null, 'Hello')
```

#### 2.2.3. Edge cases to internalize

- **JSX returns multiple root elements:** React requires 1 root. **Fix:** wrap with `<>...</>` (Fragment).
- **className vs class:** JSX uses `className` instead of `class` (reserved keyword). **Fix:** always use `className`.
- **Expressions in JSX:** Only expressions, not statements. **Fix:** use ternary instead of `if/else`.
- **Key prop in lists:** Rendering lists without key → warning. **Fix:** use unique id, avoid index.

## 3. Wrap-up

### 3.1. Common interview questions

- **Question 1:** What is Virtual DOM and why is it needed?
  - Sample answer: JS object tree representing the DOM — React diffs then only updates changed parts, avoiding full reflow.

- **Question 2:** Is JSX actually HTML?
  - Sample answer: No. JSX is a syntax extension — transpiled to React.createElement() calls.

- **Question 3:** How does Vite differ from Create React App?
  - Sample answer: Vite uses native ES modules + esbuild/SWC, faster than CRA (Webpack).

# references
## 0
### alias
React Documentation
### url
https://react.dev/
## 1
### alias
Vite Documentation
### url
https://vitejs.dev/

# minutesRead
14
