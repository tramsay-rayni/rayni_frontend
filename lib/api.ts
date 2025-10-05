// lib/api.ts

// ---------- Types ----------
export type Instrument = {
  id: string
  name: string
  vendor: string
  models_arr: string[]
  visibility: "public" | "private"
  description: string
  updated_at: string
}

export type Folder = {
  id: string
  instrument: string
  name: string
  parent?: string | null
}

export type Source = {
  id: string
  instrument: string
  folder?: string | null
  type: string         // "pdf" | "image" | "video" | "url" | etc.
  category?: string | null  // "manual" | "protocol" | "sop" | "troubleshooting" | "training" | "maintenance"
  description?: string | null
  version?: string | null
  model_tags: string[]
  status: string       // "uploaded" | "parsed" | "embedded" | "approved" | "archived"
  title: string
  storage_uri?: string | null
  archived: boolean
  archived_at?: string | null
  created_at: string
}

export type FaqItem = { q: string; a: string; tags?: string[] }
export type FaqResponse = { items: FaqItem[] }

export type AuthMe = {
  userId: string
  email: string
  name: string
  allowed: string[]  // instrument IDs user has access to
  is_admin: boolean
  role?: string
  isGuest?: boolean
}

// ---------- Config ----------
export const API =
  (process.env.NEXT_PUBLIC_API?.replace(/\/$/, "")) || "http://localhost:8000/api"

// ---------- Internal fetch wrapper ----------
async function j<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`API ${res.status} ${res.statusText} ${text}`)
  }
  return res.json() as Promise<T>
}

// ---------- Chat ----------
export async function askChat(
  instrument: string,
  question: string
): Promise<{ answer: string; citations: any[]; turn_id?: string }> {
  // Backend route is /api/chat/ask (no trailing slash) and expects instrument_id
  const res = await fetch(`${API}/chat/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instrument_id: instrument, question }),
  })
  return j(res)
}

// Server-Sent Events stream for incremental tokens
export function streamChat(instrument: string, q: string): EventSource {
  // Note: /stream/chat is outside /api/ to avoid DRF content negotiation
  const baseUrl = API.replace('/api', '');
  const url = `${baseUrl}/stream/chat?instrument_id=${encodeURIComponent(instrument)}&q=${encodeURIComponent(q)}`;
  return new EventSource(url);
}

// Chat with file attachments
export async function chatWithAttachments(
  instrument: string,
  question: string,
  files: File[]
): Promise<{ answer: string; citations: any[]; turn_id?: string }> {
  const formData = new FormData();
  formData.append("instrument_id", instrument);
  formData.append("question", question);

  files.forEach((file) => {
    formData.append("files", file);
  });

  const res = await fetch(`${API}/chat/attach`, {
    method: "POST",
    body: formData,
  });
  return j(res);
}


// ---------- Auth ----------
export async function login(email: string): Promise<AuthMe> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    credentials: "include",  // Important: include cookies for session
  })
  return j<AuthMe>(res)
}

export async function logout(): Promise<void> {
  await fetch(`${API}/auth/logout`, {
    method: "POST",
    credentials: "include",
  })
}

export async function getAuthMe(): Promise<AuthMe> {
  const res = await fetch(`${API}/auth/me`, {
    cache: "no-store",
    credentials: "include",  // Important: include cookies for session
  })
  return j<AuthMe>(res)
}

// ---------- Instruments ----------
export async function listInstruments(): Promise<Instrument[]> {
  const res = await fetch(`${API}/instruments/`, { cache: "no-store" })
  return j<Instrument[]>(res)
}

export async function getInstrument(id: string): Promise<Instrument> {
  const res = await fetch(`${API}/instruments/${id}/`, { cache: "no-store" })
  return j<Instrument>(res)
}

// ---------- Access Control ----------
export async function requestAccess(instrumentId: string, reason: string): Promise<{ id: string; status: string }> {
  const res = await fetch(`${API}/instruments/${instrumentId}/request-access`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  })
  return j(res)
}

// ---------- Sources ----------
export async function listSources(opts: {
  instrument: string
  q?: string
  type?: string
  status?: string
  page?: number
  page_size?: number
}): Promise<Source[]> {
  const p = new URLSearchParams()
  p.set("instrument", opts.instrument)
  if (opts.q) p.set("q", opts.q)
  if (opts.type) p.set("type", opts.type)
  if (opts.status) p.set("status", opts.status)
  if (opts.page) p.set("page", String(opts.page))
  if (opts.page_size) p.set("page_size", String(opts.page_size))

  const url = `${API}/sources/?${p.toString()}`
  const res = await fetch(url, { cache: "no-store" })
  if (res.status === 404) {
    const alt = `${API}/instruments/${encodeURIComponent(opts.instrument)}/sources/`
    const res2 = await fetch(alt, { cache: "no-store" })
    return j<Source[]>(res2)
  }
  return j<Source[]>(res)
}

// ---------- Folders ----------
export async function listFolders(instrumentId: string): Promise<Folder[]> {
  const res = await fetch(`${API}/folders/?instrument=${instrumentId}`, { cache: "no-store" })
  return j<Folder[]>(res)
}

export async function createFolder(data: { instrument: string; name: string; parent?: string | null }): Promise<Folder> {
  const res = await fetch(`${API}/folders/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  return j<Folder>(res)
}

export async function deleteFolder(folderId: string): Promise<void> {
  await fetch(`${API}/folders/${folderId}/`, {
    method: "DELETE"
  })
}

// ---------- Archive ----------
export async function archiveSource(sourceId: string): Promise<Source> {
  const res = await fetch(`${API}/sources/${sourceId}/archive`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  })
  return j<Source>(res)
}

// ---------- FAQ ----------
const DEFAULT_FAQ: FaqResponse = {
  items: [
    { q: "How do I upload a PDF?", a: "Go to Knowledge Store → Upload. After it parses, you’ll see a preview and can approve it for use." },
    { q: "How do I add a data source?", a: "Use Connectors in Knowledge Store. Choose Drive/SharePoint/S3, authorize, then select folders." },
    { q: "How do citations work?", a: "Each LLM answer includes citations; click to open the exact page/region in the Source Viewer." }
  ]
}

export async function getFaq(): Promise<FaqResponse> {
  try {
    // Your backend exposes /api/support/faq
    const res = await fetch(`${API}/support/faq`, { cache: "no-store" })
    if (res.ok) return j<FaqResponse>(res)
  } catch {}
  return DEFAULT_FAQ
}

// ---------- Feedback ----------
export async function submitFeedback(payload: {
  email?: string
  category: string   // "support" | "bug" | "idea" | etc.
  body: string
  route?: string
  meta?: Record<string, unknown>
}): Promise<{ id?: string; ok?: boolean }> {
  const tryPost = async (path: string) => {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    return res
  }

  let res = await tryPost(`/feedback/`)
  if (res.status === 404 || res.status === 405) {
    res = await tryPost(`/support/feedback`)
  }
  return j(res)
}
