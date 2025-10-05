"use client";
import React from "react";
import Link from "next/link";
import { listInstruments, getAuthMe, type Instrument } from "@/lib/api";

export default function Page(){
  const [instruments, setInstruments] = React.useState<Instrument[]>([]);
  const [allowedIds, setAllowedIds] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      listInstruments(),
      getAuthMe()
    ]).then(([instrumentsData, authData]) => {
      setInstruments(instrumentsData);
      setAllowedIds(authData.allowed);
      setLoading(false);
    }).catch(() => {
      // If auth fails, still show instruments but assume no access
      listInstruments().then(data => {
        setInstruments(data);
        setLoading(false);
      });
    });
  }, []);

  const filtered = instruments.filter(i => {
    const q = search.toLowerCase();
    return (
      i.name.toLowerCase().includes(q) ||
      i.vendor.toLowerCase().includes(q) ||
      (i.description && i.description.toLowerCase().includes(q)) ||
      i.models_arr.some(m => m.toLowerCase().includes(q))
    );
  });

  return (<div className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h2 className="text-xl font-semibold">Instruments</h2>
      </div>
      <div className="text-sm text-gray-600">
        {filtered.length} of {instruments.length} instruments
      </div>
    </div>

    <div className="card p-3">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          className="input pl-10"
          placeholder="Search instruments by name, vendor, model..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
    </div>

    {loading ? (
      <div className="text-center py-8 text-gray-500">Loading instruments...</div>
    ) : filtered.length === 0 ? (
      <div className="text-center py-8 text-gray-500">
        {search ? `No instruments found matching "${search}"` : "No instruments available"}
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(i => {
          const hasAccess = allowedIds.includes(i.id);
          return (
          <div key={i.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">{i.vendor}</div>
                <div className="text-lg font-semibold">{i.name}</div>
                {i.models_arr.length > 0 && (
                  <div className="text-xs text-gray-600 mt-1">
                    {i.models_arr.slice(0, 3).join(", ")}
                    {i.models_arr.length > 3 && ` +${i.models_arr.length - 3} more`}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 items-end">
                <span className={i.visibility==="restricted"?"badge badge-gray":"badge badge-green"}>
                  {i.visibility==="restricted"?"Restricted":"Accessible"}
                </span>
                {hasAccess ? (
                  <span className="badge badge-green text-xs">✓ Access Granted</span>
                ) : (
                  <span className="badge badge-amber text-xs">⚠️ No Access</span>
                )}
              </div>
            </div>

            {!hasAccess && (
              <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                Request access to use this instrument
              </div>
            )}

            <div className="mt-3 flex gap-2">
              {hasAccess ? (
                <>
                  <Link className="btn btn-primary" href={`/instruments/${i.id}/chat`}>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Open Chat
                  </Link>
                  <Link className="btn-secondary" href={`/instruments/${i.id}/store`}>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Knowledge
                  </Link>
                </>
              ) : (
                <>
                  <button className="btn btn-primary opacity-50 cursor-not-allowed" disabled>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Open Chat
                  </button>
                  <button className="btn-secondary opacity-50 cursor-not-allowed" disabled>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Knowledge
                  </button>
                </>
              )}
              <Link className="btn-secondary" href={`/instruments/${i.id}/access`}>
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {hasAccess ? "Access" : "Request Access"}
              </Link>
            </div>
          </div>
        )})}
      </div>
    )}
  </div>);
}
