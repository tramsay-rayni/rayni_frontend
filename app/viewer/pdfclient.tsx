"use client";
import React from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";

GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.min.js`;

export default function PDFViewer({ meta, source }:{ meta:any; source:string }){
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(()=>{
    let mounted=true;
    (async ()=>{
      const url=`/media/${source}.pdf`; // replace with signed URL in prod
      const pdf = await getDocument(url).promise;
      const page = await pdf.getPage(meta.page || 1);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      canvas.width = viewport.width; canvas.height = viewport.height;
      const renderTask = page.render({ canvasContext: ctx, viewport });
      await renderTask.promise;
      // draw bbox
      const b=meta.bbox; if (b){
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 3;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
      }
    })();
    return ()=>{ mounted=false };
  },[meta, source]);

  return (<div className="space-y-2">
    <div className="card p-2 inline-block"><canvas ref={canvasRef} /></div>
    <div className="text-sm text-gray-600">File: {meta.filename} · Version: {meta.version} · Checksum: {meta.checksum}</div>
  </div>);
}
