# Tracko

Project-wise expense and budget tracking. **Admins** create and manage projects,
set budgets, and share each project with a unique key. **Team members** open a
project with that key — no account needed — and log expenses against the budget.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS v4 + Firebase
(Auth + Firestore)**, in a clean orange theme.

---

## Features

- **Admin dashboard** — create, edit and delete projects; set budget & currency;
  see total budget vs. spend at a glance. Protected by Firebase email/password.
- **Unique share keys** — every project gets a key like `TRK-9K4M-PQ7Z`. Copy the
  key or a one-click join link; regenerate to revoke access.
- **Team view** — key-holders open a project and add/edit/delete expense entries
  (amount, category, date, note). No sign-up.
- **Live budgets** — a denormalized `spent` total (kept via atomic Firestore
  increments) drives real-time budget bars, category breakdowns and over-budget
  warnings across both views.

## Roles & routes

| Route                  | Who         | Purpose                                  |
| ---------------------- | ----------- | ---------------------------------------- |
| `/`                    | Everyone    | Marketing landing page                   |
| `/admin`               | Admin       | Sign in (email/password)                 |
| `/admin/signup`        | Admin       | Create an admin account                  |
| `/admin/dashboard`     | Admin       | Manage all projects                      |
| `/admin/projects/[id]` | Admin       | One project: entries, budget, share key  |
| `/join`                | Team member | Enter a share key (`?key=` is prefilled) |
| `/p/[key]`             | Team member | Shared project — manage expenses         |

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Firebase web config
npm run dev                  # http://localhost:3000
```

`.env.local` is already populated for the `tracko-30ee9` Firebase project.

### Firebase setup

1. In the [Firebase console](https://console.firebase.google.com/), open the
   **tracko-30ee9** project (or your own).
2. **Authentication → Sign-in method →** enable **Email/Password**.
3. **Firestore Database →** create a database (production mode is fine; the rules
   below control access).
4. Deploy the security rules:
   ```bash
   npx firebase login
   npx firebase deploy --only firestore:rules
   ```

Create your first admin from `/admin/signup`, then start adding projects.

## Data model (Firestore)

```
projects/{projectId}
  name, description, budget, currency
  ownerId        // admin uid
  shareKey       // e.g. TRK-9K4M-PQ7Z
  spent          // denormalized running total
  createdAt

projects/{projectId}/entries/{entryId}
  amount, category, date (yyyy-mm-dd), note
  source         // "admin" | "user"
  createdAt
```

No composite indexes are required — lists are sorted client-side.

## Security note

Team members are **unauthenticated**, so `projects` documents are world-readable
(the client resolves a key with `where('shareKey','==', key)`, and Firestore
rules can't restrict reads to "only if you know the key"). Entry writes are open
for the same reason; project documents otherwise only accept owner edits, plus a
narrow rule that lets key-holders update only the `spent` total.

For a hardened production deployment, resolve keys through a **Cloud Function**
(so the collection isn't publicly listable) and/or require **anonymous auth** +
a membership record. See `firestore.rules` for details.

## Tech

- Next.js 16 (App Router, `src/` dir)
- React 19, TypeScript
- Tailwind CSS v4 (CSS-based `@theme`), Plus Jakarta Sans
- Firebase Auth + Firestore
- lucide-react icons, nanoid for keys
