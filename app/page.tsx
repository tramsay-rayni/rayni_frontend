"use client";
import React from "react";
import Link from "next/link";
import { listInstruments, type Instrument } from "@/lib/api";

export default function Page(){
  const [instruments, setInstruments] = React.useState<Instrument[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    listInstruments().then(data => {
      setInstruments(data);
      setLoading(false);
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
      <h2 className="text-xl font-semibold">Instruments</h2>
      <div className="text-sm text-gray-600">
        {filtered.length} of {instruments.length} instruments
      </div>
    </div>

    <div className="card p-3">
      <input
        type="text"
        className="input"
        placeholder="Search instruments by name, vendor, model..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
    </div>

    {loading ? (
      <div className="text-center py-8 text-gray-500">Loading instruments...</div>
    ) : filtered.length === 0 ? (
      <div className="text-center py-8 text-gray-500">
        {search ? `No instruments found matching "${search}"` : "No instruments available"}
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(i => (
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
              <span className={i.visibility==="restricted"?"badge badge-gray":"badge badge-green"}>
                {i.visibility==="restricted"?"Restricted":"Accessible"}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <Link className="btn btn-primary" href={`/instruments/${i.id}/chat`}>Open Chat</Link>
              <Link className="btn border" href={`/instruments/${i.id}/store`}>Knowledge</Link>
              <Link className="btn border" href={`/instruments/${i.id}/access`}>Access</Link>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>);
}
