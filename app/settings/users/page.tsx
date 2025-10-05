"use client";
import React from "react";
export default function UsersPage(){
  const [items,setItems]=React.useState<any[]>([]);
  React.useEffect(()=>{ fetch((process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:8000/api")+"/users").then(r=>r.json()).then(d=>setItems(d.items)); },[]);
  return (<div className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <h2 className="text-xl font-semibold">Users & Roles</h2>
      </div>
      <button className="btn btn-primary">
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        Invite User
      </button>
    </div>
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="p-3">Email</th>
            <th className="p-3">Role</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((u:any)=>(
            <tr key={u.id} className="border-t">
              <td className="p-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {u.email}
              </td>
              <td className="p-3">
                {u.is_admin ? (
                  <span className="badge badge-green">Admin</span>
                ) : (
                  <span className="badge badge-gray">User</span>
                )}
              </td>
              <td className="p-3">
                <span className="badge badge-green">Active</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>);
}
