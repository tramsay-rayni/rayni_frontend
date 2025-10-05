"use client";
import React from "react";
import { useParams } from "next/navigation";
export default function AccessPage(){
  const { id } = useParams<{id:string}>();
  const base=process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:8000/api";
  const [pending,setPending]=React.useState<any[]>([]);
  const [grants,setGrants]=React.useState<any[]>([]);
  async function load(){
    const p=await fetch(`${base}/instruments/${id}/access/requests`).then(r=>r.json());
    const g=await fetch(`${base}/instruments/${id}/access/grants`).then(r=>r.json());
    setPending(p.items||[]); setGrants(g.items||[]);
  }
  React.useEffect(()=>{ load(); },[id]);
  async function act(reqId:string, action:"approve"|"deny"){ await fetch(`${base}/instruments/${id}/access/requests/${reqId}/${action}`, { method:"POST" }); await load(); }
  return (<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div className="card p-4"><h3 className="font-semibold">Pending requests</h3>
      <ul className="mt-2 space-y-2">{pending.map((r:any)=>(<li key={r.id} className="border rounded p-2 flex items-center justify-between">
        <div className="text-sm"><div className="font-medium">{r.user||"user@example.com"}</div><div className="text-xs text-gray-500">{r.reason||"No reason"}</div></div>
        <div className="flex gap-2"><button className="btn btn-primary" onClick={()=>act(r.id,"approve")}>Approve</button><button className="btn border" onClick={()=>act(r.id,"deny")}>Deny</button></div>
      </li>))}</ul>
    </div>
    <div className="card p-4"><h3 className="font-semibold">Current access</h3>
      <table className="w-full text-sm mt-2"><thead className="bg-gray-50 text-left"><tr><th className="p-2">User</th><th className="p-2">Role</th><th className="p-2">Status</th></tr></thead>
      <tbody>{grants.map((g:any)=>(<tr key={g.id} className="border-t"><td className="p-2">{g.user}</td><td className="p-2">{g.role}</td><td className="p-2">{g.status}</td></tr>))}</tbody></table>
    </div>
  </div>);
}
