"use client";
import React from "react";
export default function Upload(){
  const [done,setDone]=React.useState(false);
  async function onChange(e:React.ChangeEvent<HTMLInputElement>){
    const f=e.target.files?.[0]; if(!f) return;
    const base=process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
    const init=await fetch(`${base}/uploads/initiate`, { method:"POST" }).then(r=>r.json());
    await fetch(init.signed_url, { method:"PUT", body: f, headers: init.headers||{} });
    await fetch(`${base}/uploads/${init.upload_id}/complete`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ instrument_id: "00000000-0000-0000-0000-000000000000", type:"pdf", title:f.name }) });
    setDone(true);
  }
  return (<div className="card p-6 space-y-3">
    <h3 className="font-semibold">Upload to Knowledge Store</h3>
    <input type="file" onChange={onChange} />
    {done && <div className="text-sm text-green-700">Uploaded. Return to store to see it.</div>}
  </div>);
}
