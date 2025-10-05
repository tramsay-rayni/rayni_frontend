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
  return (<div className="space-y-4">
    <div className="flex items-center gap-3">
      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <h2 className="text-xl font-semibold">Help & Support</h2>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold">FAQ</h3>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input className="input pl-10" placeholder="Search FAQs..." value={query} onChange={e=>setQuery(e.target.value)} />
        </div>
        <ul className="mt-3 divide-y">{filtered.map((it:any)=>(
          <li key={it.id} className="py-2"><details><summary className="cursor-pointer font-medium">{it.q}</summary><p className="text-sm text-gray-600 mt-1">{it.a}</p></details></li>
        ))}</ul>
      </div>
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="font-semibold">Contact support</h3>
        </div>
        {sent? (
          <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Thanks! We received your message.</span>
          </div>
        ) : (
          <div className="space-y-2">
            <input className="input" placeholder="Your email (optional)" value={email} onChange={e=>setEmail(e.target.value)} />
            <textarea className="input h-32" placeholder="Describe your issue or idea..." value={body} onChange={e=>setBody(e.target.value)} />
            <button className="btn btn-primary" onClick={send}>
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  </div>);
}
