# Rayni — Frontend README

Welcome! This document explains how to run, develop, and extend the **Rayni** frontend.

> **Tech stack**: Next.js (App Router) · TypeScript · React · (utility CSS classes e.g., `card`, `btn`, `badge`) · Native **SSE** (Server‑Sent Events) for streaming chat.

---

## 1) Getting started

### Prerequisites
- Node.js **≥ 18** (LTS recommended)
- PNPM, Yarn, or NPM (examples use **npm**)
- A running Rayni backend (Django) on `http://localhost:8000` or a deployed URL
  - 📚 Backend API docs available at: **http://localhost:8000/api/docs/**

### Install & run
```bash
# from the frontend project root
npm install

# set the backend URL used by the browser
# e.g. if the backend runs on localhost:8000
printf "NEXT_PUBLIC_API=http://localhost:8000/api\n" > .env.local

# start dev server
npm run dev
# open http://localhost:3001
```

### Login & Authentication

The app uses session-based authentication. On first visit, you'll be redirected to `/login`.

**Demo Accounts:**

1. **Admin User** - `admin@rayni.com`
   - Full access to all instruments
   - Can manage access requests
   - Can approve/deny user requests

2. **Regular User** - `user@rayni.com`
   - Limited access
   - Must request access to instruments
   - Can only use approved instruments

See the backend's `TESTING-AUTH.md` for complete testing scenarios.

### Build & production run
```bash
npm run build
npm run start
```

---

## 2) Configuration

All browser‑side API calls use **`NEXT_PUBLIC_API`** (must be public to expose in the client bundle).

`.env.local` example:
```ini
NEXT_PUBLIC_API=http://localhost:8000/api
```
> Do **not** add a trailing slash; the code appends paths like `/chat/ask`.

---

## 3) Project layout (key files)

```
frontend/
├─ app/
│  └─ instruments/
│     └─ [id]/
│        └─ chat/page.tsx     # Chat UI page
├─ lib/
│  └─ api.ts                  # Frontend API wrapper (fetch + SSE)
├─ public/
├─ styles/
│  └─ globals.css
├─ next.config.js
└─ package.json
```

- **`app/instruments/[id]/chat/page.tsx`** – the chat experience (Ask + Stream, messages, citations, Proofs panel)
- **`lib/api.ts`** – strongly‑typed functions for all backend calls (see below)

---

## 4) API wrapper (`lib/api.ts`)

> **📚 For complete API documentation, see http://localhost:8000/api/docs/**

### Config
```ts
export const API = (process.env.NEXT_PUBLIC_API?.replace(/\/$/, "")) || "http://localhost:8000/api";
```

### Chat
```ts
// non‑streaming request/response
export async function askChat(instrument: string, question: string)
  : Promise<{ answer: string; citations: any[]; turn_id?: string }> {
  const res = await fetch(`${API}/chat/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instrument_id: instrument, question }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Server‑Sent Events stream
// Note: /stream/chat is outside /api/ to avoid DRF content negotiation
export function streamChat(instrument: string, q: string): EventSource {
  const baseUrl = API.replace('/api', '');
  const url = `${baseUrl}/stream/chat?instrument_id=${encodeURIComponent(instrument)}&q=${encodeURIComponent(q)}`;
  return new EventSource(url);
}
```

### Knowledge Store & Folders
```ts
// List sources with filtering
export async function listSources(opts: {
  instrument: string;
  q?: string;           // Search query
  type?: string;        // pdf, video, image, note, url
  status?: string;      // uploaded, parsed, embedded, approved, archived
}): Promise<Source[]>

// List folders for an instrument
export async function listFolders(instrumentId: string): Promise<Folder[]>

// Create a new folder
export async function createFolder(data: {
  instrument: string;
  name: string;
  parent?: string | null;  // For nested folders
}): Promise<Folder>

// Delete a folder (documents are preserved)
export async function deleteFolder(folderId: string): Promise<void>

// Archive a document (admin-only)
export async function archiveSource(sourceId: string): Promise<Source>
```

### Other helpers
- `listInstruments()` – list visible instruments
- `getFaq()` – fetch FAQ (falls back to defaults if backend route missing)
- `submitFeedback({...})` – submit support/bug/idea feedback

---

## 5) Chat page behavior (`/instruments/[id]/chat`)

**Controls**
- **Ask** – single request/response using `askChat()`
- **Stream** – incremental tokens using `streamChat()` with **SSE**

**UI state**
- `messages: { role: "user" | "assistant"; text: string; citations? }[]`
- `proofs: Cite[] | null` – last turn’s citations displayed in the side panel
- During streaming, the page inserts a **placeholder assistant bubble** and only updates that bubble as tokens arrive. This prevents the “empty bubble” issue.

**SSE Event shapes** (from backend):
- `start` → `{ "turn_id": "<uuid>" }`
- `token` → `{ "t": "<token text>" }`
- `done`  → `{ "turn_id": "<assistant-turn-uuid>", "citations": [...] }`

---

## 6) Knowledge Store (`/instruments/[id]/store`)

The Knowledge Store provides document management with categorization, tagging, and folder organization.

### Features

**Document Table**
- **Category badges** - Color-coded labels: Manual (blue), Protocol (green), SOP (purple), Troubleshooting (amber), Training (pink), Maintenance (gray)
- **Folder paths** - Shows document organization
- **Model tags** - Equipment variant chips (e.g., "FACSAria III", "LSM 980")
- **Version tracking** - Document revision numbers
- **Upload dates** - When documents were added
- **Archive action** - Admin-only soft delete

**Filters** (5 total)
- **Search** - Title, version, tags
- **Category** - Manual, Protocol, SOP, Troubleshooting, Training, Maintenance
- **Folder** - Dynamically populated from instrument folders
- **Type** - PDF, video, image, note, URL
- **Status** - Uploaded, parsed, embedded, approved, rejected, archived

**Folder Management** (Admin-only)
- Click "Manage Folders" button to open modal
- Create nested folder hierarchies (e.g., "Safety Documentation" inside "Manuals")
- Delete folders (documents are preserved)
- View all folders with parent relationships

### Upload Wizard (`/instruments/[id]/store/upload`)

**4-step upload flow with auto-detection:**

**Step 1: File Selection**
- Drag-and-drop or file picker
- Supports PDF, video, image formats

**Step 2: Categorization** (auto-suggested!)
- Filename detection:
  - Contains "manual" → suggests Manual
  - Contains "SOP" → suggests SOP
  - Contains ".mp4" → suggests Training
  - Contains "troubleshoot" → suggests Troubleshooting
- 6 category cards to choose from
- Override auto-detection if needed

**Step 3: Metadata**
- **Folder** - Auto-selects based on category (e.g., SOP → SOPs folder)
- **Model tags** - Checkboxes for equipment variants, auto-checked if found in filename
- **Version** - Optional (e.g., "v8.2", "Rev 2024")
- **Description** - Optional, helps AI retrieval

**Step 4: Preview & Submit**
- Review all metadata
- Shows file size and summary
- Upload button sends to backend

**Example:** Upload `BD_FACSAria_Manual_v8.2.pdf`:
1. Auto-detects category: **Manual** ✅
2. Auto-selects folder: **Manuals** ✅
3. Auto-checks model tag: **FACSAria III** (if instrument has it) ✅
4. User adds description, clicks Upload

---

## 7) CORS & streaming notes

- The backend sends: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `X-Accel-Buffering: no`, and `Access-Control-Allow-Origin: *` (dev).
- EventSource automatically sets the `Accept: text/event-stream` header; **don’t** add custom headers unless you also handle them server‑side.
- If you test with `curl`, include: `-H 'Accept: text/event-stream'`.

---

## 7) Common pitfalls & fixes

- **Empty assistant bubble** during streaming  
  Ensure the page **pushes a placeholder assistant message** before starting the stream and updates **only the last message** on each `token` event. (This repo’s page does that.)

- **`TypeError: streamChat is not a function`**  
  Make sure `lib/api.ts` **exports** `streamChat` and the import path is `import { askChat, streamChat } from "@/lib/api"`.

- **406 Not Acceptable from streaming endpoint**
  The streaming endpoint is at `/stream/chat` (not `/api/chat/stream`) to avoid DRF content negotiation. Use `curl -N "http://localhost:8000/stream/chat?..."` to test.

- **CORS errors** (blocked by browser)  
  Confirm backend sets `Access-Control-Allow-Origin: *` (dev) or your frontend origin in production.

- **Trailing slashes**  
  The non‑stream route is **`/api/chat/ask`** (no trailing slash). Use exactly this path.

- **Instrument ID key mismatch**  
  `askChat` expects **`instrument_id`** in the payload; avoid sending legacy `instrument` only.

---

## 8) Adding features

- **Attachment ingest toggle**  
  The UI includes a checkbox to control ingest behavior but you’ll need a backend endpoint (e.g., `POST /api/chat/attach`) to persist attachment mode per turn/session.

- **Citations list & deep viewer**  
  The assistant bubble shows citation badges. The side panel (“Proofs”) lists source & fragment and links to `/viewer?source=...&fragment=...`.

- **Error toasts**  
  Wrap `askChat`/`streamChat` with a toast system for surfaced backend errors.

---

## 9) Quality & conventions

- TypeScript strict where possible
- Keep network code in `lib/api.ts`
- Prefer functional React updates (`setState(prev => ...)`)
- Small, composable UI components (cards, inputs, buttons)

---

## 10) Deployment

### Vercel (or any Node host)
1. Create project and set env var:
   - `NEXT_PUBLIC_API=https://your-backend-host/api`
2. Build command: `npm run build`  
3. Start command: `npm run start` (or as per platform defaults)

If your backend is private, add CORS for the frontend origin and ensure HTTPS on both ends to avoid mixed content.

---

## 11) Testing the chat endpoints

### Non‑streaming (Ask)
```bash
curl -sS -X POST "$NEXT_PUBLIC_API/chat/ask" \
  -H 'Content-Type: application/json' \
  -d '{"instrument_id":"<uuid>","question":"hello"}' | jq
```

### Streaming (SSE)
```bash
# Note: /stream/chat is outside the /api path
curl -N "http://localhost:8000/stream/chat?instrument_id=<uuid>&q=hello"
```
You should see `event: start`, many `event: token`, then `event: done`.

---

## 12) Support & feedback

Use the in‑app feedback (wired to `submitFeedback`) or open an issue/PR.  
For backend compatibility questions, see the **Backend README** and the API contracts described in this document.
