"use client";
import React from "react";
import { useParams } from "next/navigation";
import { getAuthMe, requestAccess, API } from "@/lib/api";

type ViewMode = "loading" | "no-access" | "request-sent" | "has-access" | "manager";

export default function AccessPage(){
  const { id } = useParams<{id:string}>();
  const [mode, setMode] = React.useState<ViewMode>("loading");
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  // Manager view state
  const [pending, setPending] = React.useState<any[]>([]);
  const [grants, setGrants] = React.useState<any[]>([]);

  React.useEffect(() => {
    checkAccess();
  }, [id]);

  async function checkAccess() {
    try {
      const auth = await getAuthMe();
      const hasAccess = auth.allowed.includes(id as string);

      if (!hasAccess) {
        setMode("no-access");
      } else if (auth.is_admin) {
        setMode("manager");
        loadManagerData();
      } else {
        setMode("has-access");
      }
    } catch (err) {
      console.error("Failed to check access:", err);
      setMode("no-access");
    }
  }

  async function loadManagerData() {
    const p = await fetch(`${API}/instruments/${id}/access/requests`).then(r => r.json());
    const g = await fetch(`${API}/instruments/${id}/access/grants`).then(r => r.json());
    setPending(p.items || []);
    setGrants(g.items || []);
  }

  async function handleRequestAccess() {
    if (!reason.trim()) {
      setError("Please provide a reason for requesting access");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await requestAccess(id as string, reason);
      setMode("request-sent");
    } catch (err: any) {
      setError(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAction(reqId: string, action: "approve" | "deny") {
    await fetch(`${API}/instruments/${id}/access/requests/${reqId}/${action}`, { method: "POST" });
    await loadManagerData();
  }

  if (mode === "loading") {
    return (
      <div className="card p-8 text-center text-gray-500">
        Loading access information...
      </div>
    );
  }

  if (mode === "no-access") {
    return (
      <div className="space-y-4">
        <div className="card p-6 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-amber-900">Access Required</h3>
              <p className="text-sm text-amber-800 mt-1">
                You need to request access from your Lab Manager to use this instrument.
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-4">Request Access</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Reason for access <span className="text-red-500">*</span>
              </label>
              <textarea
                className="input min-h-[100px]"
                placeholder="Please explain why you need access to this instrument..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                disabled={submitting}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                {error}
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleRequestAccess}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "request-sent") {
    return (
      <div className="card p-8 text-center">
        <div className="text-4xl mb-4">✓</div>
        <h3 className="text-xl font-semibold mb-2">Request Submitted</h3>
        <p className="text-gray-600">
          Your access request has been sent to your Lab Manager for approval.
          You'll be notified once it's been reviewed.
        </p>
      </div>
    );
  }

  if (mode === "has-access") {
    return (
      <div className="card p-8 text-center">
        <div className="text-4xl mb-4">✓</div>
        <h3 className="text-xl font-semibold mb-2">Access Granted</h3>
        <p className="text-gray-600">
          You have access to this instrument. You can now use the chat and knowledge store features.
        </p>
      </div>
    );
  }

  // Manager view
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card p-4">
        <h3 className="font-semibold mb-3">Pending Requests</h3>
        {pending.length === 0 ? (
          <div className="text-sm text-gray-500 py-4 text-center">No pending requests</div>
        ) : (
          <ul className="space-y-2">
            {pending.map((r: any) => (
              <li key={r.id} className="border rounded p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{r.user || "user@example.com"}</div>
                    <div className="text-xs text-gray-600 mt-1">{r.reason || "No reason provided"}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-primary text-xs px-2 py-1"
                      onClick={() => handleAction(r.id, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      className="btn border text-xs px-2 py-1"
                      onClick={() => handleAction(r.id, "deny")}
                    >
                      Deny
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card p-4">
        <h3 className="font-semibold mb-3">Current Access</h3>
        {grants.length === 0 ? (
          <div className="text-sm text-gray-500 py-4 text-center">No users have access yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-2">User</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {grants.map((g: any) => (
                  <tr key={g.id} className="border-t">
                    <td className="p-2">{g.user}</td>
                    <td className="p-2">
                      <span className="badge badge-gray">{g.role}</span>
                    </td>
                    <td className="p-2">
                      <span className={g.status === "active" ? "badge badge-green" : "badge badge-gray"}>
                        {g.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
