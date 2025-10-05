"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { askChat, streamChat, getAuthMe } from "@/lib/api";

type Cite={ source_id:string; fragment_id:string; score:number };

export default function ChatPage(){
  const { id } = useParams<{id:string}>();
  const router = useRouter();
  const [hasAccess, setHasAccess] = React.useState<boolean | null>(null);
  const [q,setQ]=React.useState("");
  const [streaming,setStreaming]=React.useState(false);
  const [lastTurn,setLastTurn]=React.useState<string|undefined>();
  const [messages,setMessages]=React.useState<{role:"user"|"assistant"; text:string; citations?:Cite[]}[]>([]);
  const [proofs,setProofs]=React.useState<Cite[]|null>(null);
  const [attachIngest,setAttachIngest]=React.useState(false);

  React.useEffect(() => {
    getAuthMe().then(auth => {
      const allowed = auth.allowed.includes(id as string);
      setHasAccess(allowed);
      if (!allowed) {
        // Redirect to access page after a short delay
        setTimeout(() => router.push(`/instruments/${id}/access`), 2000);
      }
    }).catch(() => {
      setHasAccess(false);
      setTimeout(() => router.push(`/instruments/${id}/access`), 2000);
    });
  }, [id, router]);

 function onStream(){
  if(!q.trim()) return;
  const asked = q;
  setQ("");
  setStreaming(true);

  // push user + empty assistant placeholder
  setMessages(m => [...m, {role:"user", text: asked}, {role:"assistant", text:""}]);

  const es = streamChat(id as string, asked);
  let acc = "";

  es.addEventListener("token", (e: any) => {
    const d = JSON.parse(e.data);
    acc += d.t;
    // update ONLY the last message (assistant placeholder)
    setMessages(m => {
      const copy = [...m];
      const last = copy[copy.length - 1];
      if (last?.role === "assistant") {
        copy[copy.length - 1] = { ...last, text: acc };
      }
      return copy;
    });
  });

  es.addEventListener("done", (e: any) => {
    const d = JSON.parse(e.data);
    setLastTurn(d.turn_id);
    setProofs(d.citations);
    setStreaming(false);
    es.close();
  });

  es.addEventListener("error", (_e:any) => {
    setStreaming(false);
    es.close();
  });
}

  async function onAsk(){
    if(!q.trim()) return;
    const asked = q;
    setQ("");
    setMessages(m=>[...m,{role:"user",text:asked}]);
    const res=await askChat(id as string, asked);
    setMessages(m=>[...m,{role:"assistant",text:res.answer,citations:res.citations}]);
    setProofs(res.citations);
    setLastTurn(res.turn_id);
  }

  if (hasAccess === null) {
    return (
      <div className="card p-8 text-center text-gray-500">
        Checking access permissions...
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="card p-8 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h3 className="text-xl font-semibold mb-2">Access Required</h3>
        <p className="text-gray-600 mb-4">
          You don't have access to this instrument's chat feature.
        </p>
        <p className="text-sm text-gray-500">
          Redirecting to access request page...
        </p>
      </div>
    );
  }

  return (<div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
    <div className="space-y-4">
      <div className="card p-3 space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <input className="input pl-10" value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask a question grounded to this instrument..." />
          </div>
          <button onClick={onStream} className="btn btn-primary" disabled={streaming}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Stream
          </button>
          <button onClick={onAsk} className="btn-secondary" disabled={streaming}>
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Ask
          </button>
        </div>
        <label className="text-xs flex items-center gap-2">
          <input type="checkbox" checked={attachIngest} onChange={e=>setAttachIngest(e.target.checked)} />
          Ingest attachments to Knowledge Store (unchecked = attach only to this turn)
        </label>
      </div>
      <div className="space-y-3">
        {messages.map((m,i)=> (
          <div key={i} className={m.role==="user"?"flex justify-end":"flex justify-start"}>
            <div className={m.role==="user"
              ? "max-w-[70%] bg-gray-900 text-white border rounded-xl shadow-sm p-3"
              : "max-w-[70%] card p-3"}>
              <div className="whitespace-pre-wrap">{m.text}</div>
              {m.role==="assistant" && (m.citations || proofs)?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {(m.citations || proofs)!.map((c,idx)=> (
                    <a key={idx} className="badge badge-amber" href={`/viewer?source=${c.source_id}&fragment=${c.fragment_id}`}>citation {idx+1}</a>
                  ))}
                </div>
              ):null}
            </div>
          </div>
        ))}
      </div>
    </div>
    <aside className="hidden lg:block">
      <div className="card p-4 sticky top-6">
        <h3 className="font-semibold mb-2">Proofs</h3>
        {!proofs ? <div className="text-xs text-gray-500">Click a citation to open full viewer.</div> : (
          <ul className="space-y-2 text-sm">
            {proofs.map((c,i)=>(<li key={i} className="border rounded p-2">
              <div>Source: <span className="font-mono">{c.source_id}</span></div>
              <div>Fragment: <span className="font-mono">{c.fragment_id}</span></div>
              <a className="link text-xs" href={`/viewer?source=${c.source_id}&fragment=${c.fragment_id}`}>Open</a>
            </li>))}
          </ul>
        )}
      </div>
    </aside>
  </div>);
}
