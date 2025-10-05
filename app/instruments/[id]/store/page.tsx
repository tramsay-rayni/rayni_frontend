"use client";
import React from "react";
import { listSources, listFolders, createFolder, deleteFolder, archiveSource, getAuthMe, type Source, type Folder } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";

export default function Store(){
  const { id } = useParams<{id:string}>();
  const router = useRouter();
  const [hasAccess, setHasAccess] = React.useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [q,setQ]=React.useState("");
  const [typ,setTyp]=React.useState("");
  const [category,setCategory]=React.useState("");
  const [folder,setFolder]=React.useState("");
  const [status,setStatus]=React.useState("");
  const [sources,setSources]=React.useState<Source[]>([]);
  const [folders,setFolders]=React.useState<Folder[]>([]);
  const [showFolderModal,setShowFolderModal]=React.useState(false);
  const [newFolderName,setNewFolderName]=React.useState("");
  const [newFolderParent,setNewFolderParent]=React.useState<string>("");

  React.useEffect(() => {
    getAuthMe().then(auth => {
      const allowed = auth.allowed.includes(id as string);
      setHasAccess(allowed);
      setIsAdmin(auth.is_admin || false);
      if (!allowed) {
        setTimeout(() => router.push(`/instruments/${id}/access`), 2000);
      }
    }).catch(() => {
      setHasAccess(false);
      setTimeout(() => router.push(`/instruments/${id}/access`), 2000);
    });
  }, [id, router]);

  React.useEffect(() => {
    if (hasAccess) {
      listFolders(id as string).then(setFolders).catch(() => setFolders([]));
    }
  }, [id, hasAccess]);

  async function load(){
    const data = await listSources({
      instrument: id as string,
      q,
      type: typ || undefined,
      status: status || undefined
    });
    // Client-side filter for category and folder (backend doesn't support these yet)
    let filtered = data;
    if (category) filtered = filtered.filter(s => s.category === category);
    if (folder) filtered = filtered.filter(s => s.folder === folder);
    setSources(filtered);
  }

  React.useEffect(()=>{ if (hasAccess) load(); }, [id,q,typ,category,folder,status,hasAccess]);

  async function handleArchive(sourceId: string) {
    if (!confirm("Archive this document? It will be hidden from search but not deleted.")) return;
    try {
      await archiveSource(sourceId);
      load(); // Reload
    } catch (e) {
      alert("Failed to archive document");
    }
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    try {
      await createFolder({
        instrument: id as string,
        name: newFolderName.trim(),
        parent: newFolderParent || null
      });
      setNewFolderName("");
      setNewFolderParent("");
      setShowFolderModal(false);
      // Reload folders
      const updated = await listFolders(id as string);
      setFolders(updated);
    } catch (e) {
      alert("Failed to create folder: " + e);
    }
  }

  async function handleDeleteFolder(folderId: string, folderName: string) {
    if (!confirm(`Delete folder "${folderName}"? Documents inside will not be deleted.`)) return;
    try {
      await deleteFolder(folderId);
      // Reload folders
      const updated = await listFolders(id as string);
      setFolders(updated);
    } catch (e) {
      alert("Failed to delete folder: " + e);
    }
  }

  function getCategoryBadge(cat?: string | null) {
    const colors: Record<string, string> = {
      manual: "bg-blue-50 text-blue-700 border-blue-600",
      protocol: "bg-green-50 text-green-700 border-green-600",
      sop: "bg-purple-50 text-purple-700 border-purple-600",
      troubleshooting: "bg-amber-50 text-amber-700 border-amber-600",
      training: "bg-pink-50 text-pink-700 border-pink-600",
      maintenance: "bg-gray-50 text-gray-700 border-gray-600",
    };
    const labels: Record<string, string> = {
      manual: "Manual",
      protocol: "Protocol",
      sop: "SOP",
      troubleshooting: "Troubleshooting",
      training: "Training",
      maintenance: "Maintenance",
    };
    if (!cat) return null;
    return (
      <span className={`badge ${colors[cat] || "badge-gray"}`}>
        {labels[cat] || cat}
      </span>
    );
  }

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
          <p className="text-sm text-gray-500">{sources.length} documents across {folders.length} folders</p>
        </div>
      </div>
      <div className="flex gap-2">
        {isAdmin && (
          <button onClick={() => setShowFolderModal(true)} className="btn-secondary text-sm">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Manage Folders
          </button>
        )}
        <a className="btn btn-primary" href={`/instruments/${id}/store/upload`}>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload
        </a>
      </div>
    </div>
    <div className="card p-3 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input className="input pl-10" placeholder="Search title/version/tags..." value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <select className="input" value={category} onChange={e=>setCategory(e.target.value)}>
          <option value="">All categories</option>
          <option value="manual">Manual</option>
          <option value="protocol">Protocol</option>
          <option value="sop">SOP</option>
          <option value="troubleshooting">Troubleshooting</option>
          <option value="training">Training</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <select className="input" value={folder} onChange={e=>setFolder(e.target.value)}>
          <option value="">All folders</option>
          {folders.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <select className="input" value={typ} onChange={e=>setTyp(e.target.value)}>
          <option value="">All types</option>
          <option value="pdf">PDF</option>
          <option value="video">Video</option>
          <option value="image">Image</option>
          <option value="note">Note</option>
          <option value="url">URL</option>
        </select>
        <select className="input" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">Any status</option>
          <option value="approved">Approved</option>
          <option value="embedded">Embedded</option>
          <option value="parsed">Parsed</option>
          <option value="uploaded">Uploaded</option>
          <option value="rejected">Rejected</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button className="btn-secondary text-xs" onClick={load}>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
        <div className="text-xs text-gray-600 flex items-center">
          {sources.length} document{sources.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3 whitespace-nowrap">Title</th>
              <th className="p-3 whitespace-nowrap">Category</th>
              <th className="p-3 whitespace-nowrap">Folder</th>
              <th className="p-3 whitespace-nowrap">Type</th>
              <th className="p-3 whitespace-nowrap">Models</th>
              <th className="p-3 whitespace-nowrap">Version</th>
              <th className="p-3 whitespace-nowrap">Uploaded</th>
              {isAdmin && <th className="p-3 whitespace-nowrap">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sources.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="p-8 text-center text-gray-500">
                  No documents found. Try adjusting your filters or upload a new document.
                </td>
              </tr>
            ) : (
              sources.map(s => {
                const folderObj = folders.find(f => f.id === s.folder);
                return (
                  <tr key={s.id} className={`border-t hover:bg-gray-50 ${s.archived ? 'opacity-50' : ''}`}>
                    <td className="p-3">
                      <a className="link font-medium" href={`/viewer?source=${s.id}`}>
                        {s.title}
                      </a>
                      {s.archived && (
                        <span className="ml-2 text-xs text-gray-500">(archived)</span>
                      )}
                    </td>
                    <td className="p-3">
                      {getCategoryBadge(s.category)}
                    </td>
                    <td className="p-3 text-gray-600">
                      {folderObj?.name || "—"}
                    </td>
                    <td className="p-3">
                      <span className="badge badge-gray">{s.type}</span>
                    </td>
                    <td className="p-3">
                      {s.model_tags && s.model_tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {s.model_tags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                          {s.model_tags.length > 2 && (
                            <span className="text-xs text-gray-500">+{s.model_tags.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-600">
                      {s.version || "—"}
                    </td>
                    <td className="p-3 text-gray-600 text-xs">
                      {new Date(s.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    {isAdmin && (
                      <td className="p-3">
                        {!s.archived ? (
                          <button
                            onClick={() => handleArchive(s.id)}
                            className="text-xs text-gray-600 hover:text-red-600 underline"
                          >
                            Archive
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Archived</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Folder Management Modal */}
    {showFolderModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Manage Folders</h3>
              <button
                onClick={() => setShowFolderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Create New Folder */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm">Create New Folder</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Folder name..."
                  className="input text-sm"
                />
                <select
                  value={newFolderParent}
                  onChange={e => setNewFolderParent(e.target.value)}
                  className="input text-sm"
                >
                  <option value="">Root level (no parent)</option>
                  {folders.filter(f => !f.parent).map(f => (
                    <option key={f.id} value={f.id}>Inside "{f.name}"</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="btn btn-primary text-sm disabled:opacity-50"
              >
                Create Folder
              </button>
            </div>

            {/* Existing Folders */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Existing Folders ({folders.length})</h4>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {folders.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No folders yet. Create one above.
                  </div>
                ) : (
                  folders.map(folder => {
                    const isParent = folders.some(f => f.parent === folder.id);
                    const parentFolder = folder.parent ? folders.find(f => f.id === folder.parent) : null;
                    return (
                      <div
                        key={folder.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          <span className="font-medium">{folder.name}</span>
                          {parentFolder && (
                            <span className="text-xs text-gray-500">in "{parentFolder.name}"</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteFolder(folder.id, folder.name)}
                          disabled={isParent}
                          className="text-xs text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {isParent ? "Has subfolders" : "Delete"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>);
}
