"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import { viewerPdfMeta, viewerVideoMeta, viewerImageMeta } from "@/lib/api";
import dynamic from "next/dynamic";

export default function Viewer(){
  const sp=useSearchParams();
  const source=sp.get("source")!;
  const type=sp.get("type"); // optional
  const [meta,setMeta]=React.useState<any>(null);

  React.useEffect(()=>{
    async function run(){
      if(type==="video") setMeta(await viewerVideoMeta(source));
      else if(type==="image") setMeta(await viewerImageMeta(source));
      else setMeta(await viewerPdfMeta(source));
    }
    run();
  },[source,type]);

  if(!meta) return <div className="card p-4">Loading viewer…</div>;

  if(meta.type==="video"){
    const t=meta.t_start || 0;
    return (<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <video className="w-full card" src={`/media/${source}.mp4#t=${t}`} controls autoPlay />
      <div className="card p-3 lg:col-span-2">
        <h3 className="font-semibold">Transcript</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {meta.transcript.map((row:any, i:number)=> (
            <li key={i} className={Math.abs(row.t - meta.t_start) < 0.2 ? "bg-yellow-50 p-1 rounded" : ""}>
              <span className="text-xs text-gray-500 pr-2">{row.t.toFixed(1)}s</span>{row.text}
            </li>
          ))}
        </ul>
      </div>
    </div>);
  }

  if(meta.type==="image"){
    const r=meta.region;
    return (<div className="card p-4">
      <div className="relative inline-block">
        <img src={`/media/${source}.jpg`} alt={meta.alt_text} className="max-w-full" />
        <div className="absolute border-2 border-yellow-500" style={{left:r.x, top:r.y, width:r.w, height:r.h}} />
      </div>
      <div className="text-sm text-gray-600 mt-2">{meta.alt_text}</div>
    </div>);
  }

  // pdf
  return <PDFViewer meta={meta} source={source} />;
}

const PDFViewer = dynamic(() => import("./pdfclient"), { ssr:false });
