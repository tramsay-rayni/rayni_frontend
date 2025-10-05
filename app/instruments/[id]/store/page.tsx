"use client";
import React from "react";
import { listSources, getAuthMe } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";

export default function Store(){
  const { id } = useParams<{id:string}>();
  const router = useRouter();
  const [hasAccess, setHasAccess] = React.useState<boolean | null>(null);
  const [q,setQ]=React.useState(""); const [typ,setTyp]=React.useState(""); const [status,setStatus]=React.useState(""); const [sources,setSources]=React.useState<any[]>([]);

  React.useEffect(() => {
    getAuthMe().then(auth => {
      const allowed = auth.allowed.includes(id as string);
      setHasAccess(allowed);
      if (!allowed) {
        setTimeout(() => router.push(`/instruments/${id}/access`), 2000);
      }
    }).catch(() => {
      setHasAccess(false);
      setTimeout(() => router.push(`/instruments/${id}/access`), 2000);
    });
  }, [id, router]);

  async function load(){ const data=await listSources({ instrument: id as string, q, type: typ||undefined, status: status||undefined }); setSources(data); }
  React.useEffect(()=>{ if (hasAccess) load(); }, [id,q,typ,status,hasAccess]);

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
          You don't have access to this instrument's knowledge store.
        </p>
        <p className="text-sm text-gray-500">
          Redirecting to access request page...
        </p>
      </div>
    );
  }

  return (<div className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <div>
          <h3 className="text-lg font-semibold">Knowledge Store</h3>
          <p className="text-sm text-gray-500">Search, filter, folders, versioning (scaffold).</p>
        </div>
      </div>
      <a className="btn btn-primary" href={`/instruments/${id}/store/upload`}>
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Upload
      </a>
    </div>
    <div className="card p-3 grid grid-cols-1 md:grid-cols-4 gap-3">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input className="input pl-10" placeholder="Search title/version/tags..." value={q} onChange={e=>setQ(e.target.value)} />
      </div>
      <select className="input" value={typ} onChange={e=>setTyp(e.target.value)}>
        <option value="">All types</option><option value="pdf">PDF</option><option value="video">Video</option><option value="image">Image</option><option value="note">Note</option><option value="url">URL</option>
      </select>
      <select className="input" value={status} onChange={e=>setStatus(e.target.value)}>
        <option value="">Any status</option><option value="approved">Approved</option><option value="embedded">Embedded</option><option value="parsed">Parsed</option><option value="uploaded">Uploaded</option><option value="rejected">Rejected</option>
      </select>
      <button className="btn-secondary" onClick={load}>
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </button>
    </div>
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left"><tr><th className="p-3">Title</th><th className="p-3">Type</th><th className="p-3">Version</th><th className="p-3">Status</th><th className="p-3">Storage</th></tr></thead>
        <tbody>{sources.map(s=> (<tr key={s.id} className="border-t">
          <td className="p-3"><a className="link" href={`/viewer?source=${s.id}`}>{s.title}</a></td>
          <td className="p-3">{s.type}</td>
          <td className="p-3">{s.version || "—"}</td>
          <td className="p-3">{s.status}</td>
          <td className="p-3 text-xs text-gray-500">{s.storage_uri}</td>
        </tr>))}</tbody>
      </table>
    </div>
  </div>);
}
