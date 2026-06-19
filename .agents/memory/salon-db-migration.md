---
name: DB-backed salon store
description: Migration of bw-salon from localStorage to PostgreSQL — architecture decisions and gotchas.
---

## What changed
All data previously in `localStorage` (siteContent, appointments, messages, adisyonlar, transactions, inventory, staffUsers, workEntries, siteUsers, reviews) is now in PostgreSQL via the API server.

## Architecture
- `store.tsx` loads all data from API on mount via `Promise.all`, then uses **optimistic updates** (update local state immediately, fire-and-forget API call in background).
- **Exception: siteContent** — synced via `useEffect` watcher that calls `PUT /api/site-content` whenever `siteContent` state changes. Uses two refs (`siteContentLoaded`, `siteContentDirty`) to skip the initial mount sync.
- **Exception: appointments/reviews** — these have DB-generated serial IDs, so `addAppointment` is `async` and awaits the API response to get the real ID. All other mutations use client-generated text IDs (`uid()`).
- Cart, theme, language stay in `localStorage` (user-device-specific).
- Sessions (currentUser, currentStaffUser) stay in `sessionStorage`.

## Tables added
`salon_site_content`, `salon_contact_messages`, `salon_adisyonlar`, `salon_transactions`, `salon_inventory`, `salon_stock_movements`, `salon_staff_users`, `salon_work_entries`, `salon_site_users`

## Async function signature changes
These store functions changed from sync to async — update call sites accordingly:
- `addAppointment` → `Promise<void>`
- `loginUser` / `registerUser` → `Promise<boolean>`
- `updateUser` → `Promise<boolean>`
- `loginStaffUser` → `Promise<StaffUser | null>`
- `addStaffUser` → `Promise<boolean>`

## API base path
All API calls use `/api/...` (relative URL, works via shared proxy both dev and prod).

**Why:** The previous localStorage approach meant admin changes on one device were invisible to other IPs/browsers. DB persistence makes the site consistent for all users.
