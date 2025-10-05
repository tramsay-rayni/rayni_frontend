"use client";
import React from "react";
import { getFaq, submitFeedback } from "@/lib/api";
export default function Support(){
  const [items,setItems]=React.useState<any[]>([]);
  const [query,setQuery]=React.useState("");
  const [email,setEmail]=React.useState(""); const [body,setBody]=React.useState(""); const [sent,setSent]=React.useState(false);
  React.useEffect(()=>{ getFaq().then(d=> setItems(d.items)); },[]);
  const filtered=items.filter((i:any)=> (i.q+i.a).toLowerCase().includes(query.toLowerCase()));
  async function send(){ await submitFeedback({ email, category:"support", body, route:"/support" }); setSent(true); }
  return (<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div className="card p-4">
      <h3 className="font-semibold">FAQ</h3>
      <input className="input mt-2" placeholder="Search FAQs..." value={query} onChange={e=>setQuery(e.target.value)} />
      <ul className="mt-3 divide-y">{filtered.map((it:any)=>(
        <li key={it.id} className="py-2"><details><summary className="cursor-pointer font-medium">{it.q}</summary><p className="text-sm text-gray-600 mt-1">{it.a}</p></details></li>
      ))}</ul>
    </div>
    <div className="card p-4">
      <h3 className="font-semibold">Contact support</h3>
      {sent? <div className="text-green-700 text-sm mt-2">Thanks! We received your message.</div> : (
        <div className="space-y-2 mt-2">
          <input className="input" placeholder="Your email (optional)" value={email} onChange={e=>setEmail(e.target.value)} />
          <textarea className="input h-32" placeholder="Describe your issue or idea..." value={body} onChange={e=>setBody(e.target.value)} />
          <button className="btn btn-primary" onClick={send}>Send</button>
        </div>
      )}
    </div>
  </div>);
}
