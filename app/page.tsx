import Link from "next/link";
import { listInstruments } from "@/lib/api";
export default async function Page(){
  const instruments=await listInstruments();
  return (<div className="space-y-4">
    <h2 className="text-xl font-semibold">Instruments</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {instruments.map(i => (
        <div key={i.id} className="card p-4">
          <div className="flex items-center justify-between">
            <div><div className="text-xs text-gray-500">{i.vendor}</div><div className="text-lg font-semibold">{i.name}</div></div>
            <span className={i.visibility==="restricted"?"badge badge-gray":"badge badge-green"}>{i.visibility==="restricted"?"Restricted":"Accessible"}</span>
          </div>
          <div className="mt-3 flex gap-2">
            <Link className="btn btn-primary" href={`/instruments/${i.id}/chat`}>Open Chat</Link>
            <Link className="btn border" href={`/instruments/${i.id}/store`}>Knowledge</Link>
            <Link className="btn border" href={`/instruments/${i.id}/access`}>Access</Link>
          </div>
        </div>
      ))}
    </div>
  </div>);
}
