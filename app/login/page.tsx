"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await login(email);
      console.log("Logged in as:", user);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Rayni Login</h1>
          <p className="text-sm text-gray-600 mt-2">Demo Authentication</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t">
          <p className="text-xs text-gray-600 mb-3 font-semibold">Demo Accounts:</p>
          <div className="space-y-2 text-xs">
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="font-medium text-blue-900">Admin Account</div>
              <div className="text-blue-700 mt-1">admin@rayni.com</div>
              <div className="text-blue-600 text-xs mt-1">
                ✓ Access to all instruments<br />
                ✓ Can manage access requests<br />
                ✓ Can view all grants
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded p-3">
              <div className="font-medium text-gray-900">Regular User</div>
              <div className="text-gray-700 mt-1">user@rayni.com</div>
              <div className="text-gray-600 text-xs mt-1">
                ✓ Limited instrument access<br />
                ✓ Must request access<br />
                ✓ Can use granted instruments
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            💡 <strong>Tip:</strong> Click on an email above or type it manually to login.
            No password required for demo.
          </p>
        </div>
      </div>
    </div>
  );
}
