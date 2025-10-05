"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { listFolders, listInstruments, type Folder, type Instrument } from "@/lib/api";

type UploadStep = 1 | 2 | 3 | 4;

type Category = "manual" | "protocol" | "sop" | "troubleshooting" | "training" | "maintenance";

export default function Upload() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [step, setStep] = React.useState<UploadStep>(1);
  const [instrument, setInstrument] = React.useState<Instrument | null>(null);
  const [folders, setFolders] = React.useState<Folder[]>([]);

  // Step 1: File
  const [file, setFile] = React.useState<File | null>(null);

  // Step 2: Category (auto-suggested)
  const [category, setCategory] = React.useState<Category | "">("");
  const [suggestedCategory, setSuggestedCategory] = React.useState<Category | null>(null);

  // Step 3: Metadata
  const [folderId, setFolderId] = React.useState("");
  const [modelTags, setModelTags] = React.useState<string[]>([]);
  const [version, setVersion] = React.useState("");
  const [description, setDescription] = React.useState("");

  // Step 4: Upload state
  const [uploading, setUploading] = React.useState(false);
  const [uploadComplete, setUploadComplete] = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      listInstruments().then(instruments => instruments.find(i => i.id === id)),
      listFolders(id as string)
    ]).then(([inst, folds]) => {
      if (inst) setInstrument(inst);
      setFolders(folds);
    });
  }, [id]);

  // Auto-suggest category based on filename
  function detectCategory(filename: string): Category | null {
    const lower = filename.toLowerCase();
    if (lower.includes("manual") || lower.includes("guide") || lower.includes("handbook")) return "manual";
    if (lower.includes("protocol") || lower.includes("procedure")) return "protocol";
    if (lower.includes("sop") || lower.includes("standard operating")) return "sop";
    if (lower.includes("troubleshoot") || lower.includes("faq") || lower.includes("error")) return "troubleshooting";
    if (lower.includes("train") || lower.includes("tutorial") || lower.includes(".mp4") || lower.includes(".mov")) return "training";
    if (lower.includes("maintenance") || lower.includes("calibration") || lower.includes("service")) return "maintenance";
    return null;
  }

  // Auto-suggest model tags based on filename
  function detectModelTags(filename: string): string[] {
    if (!instrument) return [];
    const lower = filename.toLowerCase();
    return instrument.models_arr.filter(model => lower.includes(model.toLowerCase()));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    // Auto-suggest category and model tags
    const suggested = detectCategory(f.name);
    setSuggestedCategory(suggested);
    setCategory(suggested || "");

    const detectedTags = detectModelTags(f.name);
    setModelTags(detectedTags);

    // Auto-select folder based on category
    if (suggested) {
      const categoryFolderMap: Record<Category, string> = {
        manual: "Manuals",
        protocol: "Protocols",
        sop: "SOPs",
        troubleshooting: "Troubleshooting",
        training: "Training",
        maintenance: "Maintenance"
      };
      const folderName = categoryFolderMap[suggested];
      const folder = folders.find(f => f.name === folderName);
      if (folder) setFolderId(folder.id);
    }

    setStep(2);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setFile(f);

    const suggested = detectCategory(f.name);
    setSuggestedCategory(suggested);
    setCategory(suggested || "");

    const detectedTags = detectModelTags(f.name);
    setModelTags(detectedTags);

    if (suggested) {
      const categoryFolderMap: Record<Category, string> = {
        manual: "Manuals",
        protocol: "Protocols",
        sop: "SOPs",
        troubleshooting: "Troubleshooting",
        training: "Training",
        maintenance: "Maintenance"
      };
      const folderName = categoryFolderMap[suggested];
      const folder = folders.find(f => f.name === folderName);
      if (folder) setFolderId(folder.id);
    }

    setStep(2);
  }

  function toggleModelTag(tag: string) {
    setModelTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  async function handleUpload() {
    if (!file || !category) return;
    setUploading(true);

    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

      // Step 1: Initiate upload
      const init = await fetch(`${base}/uploads/initiate`, { method: "POST" }).then(r => r.json());

      // Step 2: Upload to MinIO
      await fetch(init.signed_url, {
        method: "PUT",
        body: file,
        headers: init.headers || {}
      });

      // Step 3: Complete upload with metadata
      await fetch(`${base}/uploads/${init.upload_id}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instrument_id: id,
          type: file.type.includes("pdf") ? "pdf" : file.type.includes("video") ? "video" : file.type.includes("image") ? "image" : "note",
          title: file.name,
          category,
          description,
          version: version || null,
          model_tags: modelTags,
          folder_id: folderId || null
        })
      });

      setUploadComplete(true);
    } catch (e) {
      alert("Upload failed: " + e);
      setUploading(false);
    }
  }

  if (uploadComplete) {
    return (
      <div className="card p-8 text-center space-y-4">
        <div className="text-4xl">✅</div>
        <h3 className="text-xl font-semibold">Upload Complete!</h3>
        <p className="text-gray-600">Your document has been added to the Knowledge Store.</p>
        <button
          onClick={() => router.push(`/instruments/${id}/store`)}
          className="btn btn-primary"
        >
          Return to Knowledge Store
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="card p-4">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map(s => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                s < step ? "bg-green-600 text-white" :
                s === step ? "bg-gray-900 text-white" :
                "bg-gray-200 text-gray-500"
              }`}>
                {s < step ? "✓" : s}
              </div>
              {s < 4 && <div className={`flex-1 h-0.5 ${s < step ? "bg-green-600" : "bg-gray-200"}`} />}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-gray-600">
          <div className={step === 1 ? "font-medium" : ""}>Select File</div>
          <div className={step === 2 ? "font-medium" : ""}>Categorize</div>
          <div className={step === 3 ? "font-medium" : ""}>Metadata</div>
          <div className={step === 4 ? "font-medium" : ""}>Preview</div>
        </div>
      </div>

      {/* Step 1: File Selection */}
      {step === 1 && (
        <div className="card p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Select Document</h3>
            <p className="text-sm text-gray-600">Upload a PDF, video, image, or other file to the Knowledge Store</p>
          </div>

          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-gray-400 transition-colors"
          >
            <svg className="mx-auto w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium mb-2">Drag and drop your file here</p>
            <p className="text-sm text-gray-500 mb-4">or</p>
            <label className="btn btn-primary cursor-pointer">
              <input type="file" className="hidden" onChange={handleFileSelect} />
              Browse Files
            </label>
          </div>
        </div>
      )}

      {/* Step 2: Category Selection */}
      {step === 2 && (
        <div className="card p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Categorize Document</h3>
            <p className="text-sm text-gray-600">
              File: <span className="font-medium">{file?.name}</span>
            </p>
          </div>

          {suggestedCategory && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-blue-800">
                  Auto-detected category: <span className="font-semibold capitalize">{suggestedCategory}</span>
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Document Category *</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(["manual", "protocol", "sop", "troubleshooting", "training", "maintenance"] as Category[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    category === cat
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium capitalize">{cat}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {cat === "manual" && "User guides, reference docs"}
                    {cat === "protocol" && "Experimental procedures"}
                    {cat === "sop" && "Standard operating procedures"}
                    {cat === "troubleshooting" && "Error guides, FAQs"}
                    {cat === "training" && "Tutorials, onboarding"}
                    {cat === "maintenance" && "Calibration, service logs"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
            <button
              onClick={() => setStep(3)}
              disabled={!category}
              className="btn btn-primary disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Metadata */}
      {step === 3 && (
        <div className="card p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Add Metadata</h3>
            <p className="text-sm text-gray-600">Help users find this document with tags and descriptions</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Folder</label>
              <select
                value={folderId}
                onChange={e => setFolderId(e.target.value)}
                className="input"
              >
                <option value="">Root / No folder</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {instrument && instrument.models_arr.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Applicable Models
                  <span className="text-gray-500 font-normal ml-1">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {instrument.models_arr.map(model => (
                    <button
                      key={model}
                      onClick={() => toggleModelTag(model)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        modelTags.includes(model)
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {model}
                    </button>
                  ))}
                </div>
                {modelTags.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {modelTags.length} model{modelTags.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Version
                <span className="text-gray-500 font-normal ml-1">(optional)</span>
              </label>
              <input
                type="text"
                value={version}
                onChange={e => setVersion(e.target.value)}
                placeholder="e.g., v8.2, Rev 2024"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
                <span className="text-gray-500 font-normal ml-1">(optional, but helps AI retrieval)</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description of what this document covers..."
                rows={3}
                className="input"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="btn-secondary">Back</button>
            <button onClick={() => setStep(4)} className="btn btn-primary">
              Preview
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Preview & Submit */}
      {step === 4 && (
        <div className="card p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Review & Submit</h3>
            <p className="text-sm text-gray-600">Verify your document details before uploading</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">File:</span>
              <span className="font-medium">{file?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Size:</span>
              <span className="font-medium">{file ? (file.size / 1024 / 1024).toFixed(2) : 0} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Category:</span>
              <span className="font-medium capitalize">{category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Folder:</span>
              <span className="font-medium">{folders.find(f => f.id === folderId)?.name || "Root"}</span>
            </div>
            {modelTags.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Models:</span>
                <span className="font-medium">{modelTags.join(", ")}</span>
              </div>
            )}
            {version && (
              <div className="flex justify-between">
                <span className="text-gray-600">Version:</span>
                <span className="font-medium">{version}</span>
              </div>
            )}
            {description && (
              <div className="pt-2 border-t">
                <span className="text-gray-600 block mb-1">Description:</span>
                <span className="text-gray-800">{description}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(3)} className="btn-secondary" disabled={uploading}>
              Back
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn btn-primary disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
