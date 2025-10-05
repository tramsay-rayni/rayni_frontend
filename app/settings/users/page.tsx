"use client";
import React from "react";
export default function UsersPage(){
  const [items,setItems]=React.useState<any[]>([]);
  React.useEffect(()=>{ fetch((process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:8000/api")+"/users").then(r=>r.json()).then(d=>setItems(d.items)); },[]);
  return (<div className="card p-4">
    <h3 className="font-semibold">Users & Roles</h3>
    <table className="w-full text-sm mt-3"><thead className="bg-gray-50 text-left"><tr><th className="p-2">Email</th><th className="p-2">Admin</th></tr></thead>
    <tbody>{items.map((u:any)=>(<tr key={u.id} className="border-t"><td className="p-2">{u.email}</td><td className="p-2">{u.is_admin?"Yes":"No"}</td></tr>))}</tbody></table>
  </div>);
}
