# title
React Router Navigation

# description
Hands-on configuring client-side routing with React Router, including nested routes, dynamic params, and protected routes.

# body

## 1. Opening

"App has 5 pages but every navigation reloads the entire page — how do we keep state?" — a **Senior Engineer** asks during SPA architecture review. A **Mid-level Developer** answers: "I'll use window.location.href." The answer shows awareness of navigation, but misses depth on **client-side routing**: `location.href` reloads the page → loses state — **React Router** intercepts URL changes, renders the corresponding component without reload, preserving app state.

This lesson runs through two tracks:
- **Part 2.1**: **hands-on**; **stack** is **React** + **Vite** + **React Router**, with the flow: navigate between pages, dynamic params, nested routes.
- **Part 2.2**: **theory** clarifying **client-side routing**, **History API**, and **edge cases**.

## 2. Core concepts

The lesson structure follows **practice-led theory**. First, learners clone the source, run the dev server via `npm run dev`, and open the browser to navigate between pages, observing URLs change without reload. Then the **theory** section analyzes client-side routing, the History API, and **edge cases**.

### 2.1. Hands-on

#### 2.1.1. Prepare source code and environment

Source: [StarCi-Academy/fullstack-mastery-module-8-react-basic](https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic) on GitHub — lesson directory: [`3-react-router-navigation`](https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic/tree/main/3-react-router-navigation).

```bash
# Step 1: Clone the repository locally
git clone https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic.git

# Step 2: Navigate to the lesson directory
cd fullstack-mastery-module-8-react-basic/3-react-router-navigation
```

#### 2.1.2. Architecture / components

| Component | File | Role |
| --- | --- | --- |
| **BrowserRouter** | `src/main.tsx` | Router provider |
| **Routes** | `src/App.tsx` | Route definitions |
| **Home/About/UserDetail** | `src/pages/` | Page components |
| **Navbar** | `src/components/Navbar.tsx` | Navigation links |

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

##### 2.1.4.1. Flow 1 — Navigate between pages

  Open browser at **`http://localhost:5173`**. Click "About" link → URL changes to `/about` → About component renders **without page reload**.

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:5173

  # macOS / Linux
  curl -s http://localhost:5173
  ```

##### 2.1.4.2. Flow 2 — Dynamic params

  Navigate to **`http://localhost:5173/users/1`** → UserDetail component receives `id=1` from URL params.

*If the page renders:*

- *Client-side routing — URL changes without reload, state preserved.*
- *useParams — reads dynamic params from URL.*

#### 2.1.5. Cleanup

This lesson does not use Docker, no resource cleanup is needed.

#### 2.1.6. Further reading

- **React Router:** Declarative routing for React. ([React Router Docs](https://reactrouter.com/))
- **History API:** Browser history management. ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/History_API))

### 2.2. Theory — Client-Side Routing

#### 2.2.1. Server-Side vs Client-Side Routing

| Server-Side | Client-Side |
| --- | --- |
| Server returns new HTML per request | JS intercepts URL, renders component |
| Full page reload | No reload, preserves state |
| Good SEO (SSR) | Needs SSR framework for SEO |

#### 2.2.2. Edge cases to internalize

- **Direct URL access:** Refresh `/about` → 404 in production. **Fix:** configure server fallback to `index.html`.
- **Nested routes:** Shared layout for page groups. **Fix:** use `<Outlet>` component.
- **Protected routes:** Pages requiring login. **Fix:** wrapper component checks auth → redirects.
- **404 Not Found:** No matching route. **Fix:** add catch-all route `path="*"`.

## 3. Wrap-up

### 3.1. Common interview questions

- **Question 1:** How does client-side routing differ from server-side routing?
  - Sample answer: Client-side JS intercepts URL, renders component without reload. Server-side returns new HTML per request.

- **Question 2:** Refreshing `/about` returns 404 — why?
  - Sample answer: Server doesn't know the `/about` route → needs fallback configuration to index.html.

- **Question 3:** What is useParams used for?
  - Sample answer: Reads dynamic params from URL (e.g., `/users/:id` → `{ id: "1" }`).

# references
## 0
### alias
React Router
### url
https://reactrouter.com/
## 1
### alias
MDN History API
### url
https://developer.mozilla.org/en-US/docs/Web/API/History_API

# minutesRead
15
