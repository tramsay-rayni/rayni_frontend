"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { askChat, streamChat, chatWithAttachments, getAuthMe, getInstrument, type Instrument } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

type Cite = {
  source_id: string;
  source_title?: string;
  source_type?: string;
  fragment_id: string;
  score: number;
};

type Message = {
  role: "user" | "assistant";
  text: string;
  citations?: Cite[];
};

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [hasAccess, setHasAccess] = React.useState<boolean | null>(null);
  const [instrument, setInstrument] = React.useState<Instrument | null>(null);
  const [q, setQ] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [selectedCitation, setSelectedCitation] = React.useState<Cite | null>(null);
  const [attachedFiles, setAttachedFiles] = React.useState<File[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check access and load instrument on mount
  React.useEffect(() => {
    Promise.all([
      getAuthMe(),
      getInstrument(id as string)
    ])
      .then(([auth, instrumentData]) => {
        const allowed = auth.allowed.includes(id as string);
        setHasAccess(allowed);
        setInstrument(instrumentData);
        if (!allowed) {
          setTimeout(() => router.push(`/instruments/${id}/access`), 2000);
        }
      })
      .catch(() => {
        setHasAccess(false);
        setTimeout(() => router.push(`/instruments/${id}/access`), 2000);
      });
  }, [id, router]);

  // Handle Enter key to send
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onStream();
    }
  }

  async function onStream() {
    if (!q.trim() && attachedFiles.length === 0) return;
    const asked = q;
    const files = attachedFiles;
    setQ("");
    setStreaming(true);

    // Build user message text with attachment info
    let userText = asked;
    if (files.length > 0) {
      const fileNames = files.map(f => f.name).join(", ");
      userText = `${asked}\n\n📎 Attached: ${fileNames}`;
    }

    // Push user message
    setMessages((m) => [...m, { role: "user", text: userText }]);

    // If there are attachments, use non-streaming endpoint
    if (files.length > 0) {
      try {
        setMessages((m) => [...m, { role: "assistant", text: "*Processing attachments and searching documentation...*" }]);
        const res = await chatWithAttachments(id as string, asked, files);
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", text: res.answer, citations: res.citations };
          return copy;
        });
      } catch (e: any) {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", text: `❌ Error: ${e.message || e}` };
          return copy;
        });
      }
      setStreaming(false);
      setAttachedFiles([]);
      return;
    }

    // Otherwise use streaming
    setMessages((m) => [...m, { role: "assistant", text: "" }]);

    const es = streamChat(id as string, asked);
    let acc = "";

    es.addEventListener("token", (e: any) => {
      const d = JSON.parse(e.data);
      acc += d.t;
      // Update only the last message (assistant placeholder)
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant") {
          copy[copy.length - 1] = { ...last, text: acc };
        }
        return copy;
      });
    });

    es.addEventListener("done", (e: any) => {
      const d = JSON.parse(e.data);
      // Attach citations to last assistant message
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant") {
          copy[copy.length - 1] = { ...last, citations: d.citations };
        }
        return copy;
      });
      setStreaming(false);
      es.close();
      // Clear attachments after send
      setAttachedFiles([]);
    });

    es.addEventListener("error", (_e: any) => {
      setStreaming(false);
      es.close();
    });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setAttachedFiles(Array.from(e.target.files));
    }
  }

  function removeFile(index: number) {
    setAttachedFiles((files) => files.filter((_, i) => i !== index));
  }

  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Checking access permissions...</div>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold mb-2">Access Required</h3>
          <p className="text-gray-600 mb-4">
            You don't have access to this instrument's chat feature.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to access request page...
          </p>
        </div>
      </div>
    );
  }

  const showWelcome = messages.length === 0;

  return (
    <>
      {/* Main Chat Container - ChatGPT style */}
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4">
            {showWelcome && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="mb-8">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  {instrument && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
                      <div className="text-sm text-blue-600 font-medium mb-1">Now chatting about:</div>
                      <div className="text-lg font-semibold text-blue-900">{instrument.name}</div>
                      <div className="text-sm text-blue-700">{instrument.vendor}</div>
                      {instrument.models_arr && instrument.models_arr.length > 0 && (
                        <div className="text-xs text-blue-600 mt-2">
                          Models: {instrument.models_arr.join(", ")}
                        </div>
                      )}
                    </div>
                  )}
                  <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                    Ask about this instrument
                  </h2>
                  <p className="text-gray-500 max-w-md mx-auto">
                    I'll provide answers grounded in the documentation you've uploaded.
                    Start by asking a question below.
                  </p>
                </div>

                {/* Example prompts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                  <button
                    onClick={() => setQ("How do I calibrate this instrument?")}
                    className="p-4 text-left bg-white rounded-lg border hover:border-gray-400 transition"
                  >
                    <div className="font-medium text-sm mb-1">Calibration</div>
                    <div className="text-xs text-gray-500">
                      How do I calibrate this instrument?
                    </div>
                  </button>
                  <button
                    onClick={() => setQ("What maintenance is required?")}
                    className="p-4 text-left bg-white rounded-lg border hover:border-gray-400 transition"
                  >
                    <div className="font-medium text-sm mb-1">Maintenance</div>
                    <div className="text-xs text-gray-500">
                      What maintenance is required?
                    </div>
                  </button>
                  <button
                    onClick={() => setQ("How do I troubleshoot error codes?")}
                    className="p-4 text-left bg-white rounded-lg border hover:border-gray-400 transition"
                  >
                    <div className="font-medium text-sm mb-1">Troubleshooting</div>
                    <div className="text-xs text-gray-500">
                      How do I troubleshoot error codes?
                    </div>
                  </button>
                  <button
                    onClick={() => setQ("What are the safety protocols?")}
                    className="p-4 text-left bg-white rounded-lg border hover:border-gray-400 transition"
                  >
                    <div className="font-medium text-sm mb-1">Safety</div>
                    <div className="text-xs text-gray-500">
                      What are the safety protocols?
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="py-8 space-y-6">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-2xl px-5 py-3"
                        : "bg-white rounded-2xl px-5 py-4 shadow-sm border"
                    }`}
                  >
                    {m.role === "user" ? (
                      <div className="whitespace-pre-wrap">{m.text}</div>
                    ) : (
                      <>
                        {/* Markdown rendering for assistant */}
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw, rehypeSanitize]}
                          >
                            {m.text || "*Thinking...*"}
                          </ReactMarkdown>
                        </div>

                        {/* Citations */}
                        {m.citations && m.citations.length > 0 && (
                          <div className="mt-4 pt-3 border-t flex flex-wrap gap-2">
                            <div className="text-xs text-gray-500 w-full mb-1">
                              Sources:
                            </div>
                            {m.citations.map((c, idx) => (
                              <button
                                key={idx}
                                onClick={() => setSelectedCitation(c)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full text-xs text-amber-800 transition"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                {c.source_title || `Source ${idx + 1}`}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="border-t bg-white">
          <div className="max-w-3xl mx-auto p-4">
            {/* Attached files */}
            {attachedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachedFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
                  >
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    <span className="text-gray-700">{file.name}</span>
                    <button
                      onClick={() => removeFile(i)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input box */}
            <div className="flex items-end gap-2">
              {/* File attach button */}
              <label className="flex-shrink-0 cursor-pointer p-2.5 hover:bg-gray-100 rounded-lg transition">
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>

              {/* Textarea */}
              <textarea
                ref={inputRef}
                className="flex-1 resize-none border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
                placeholder="Ask a question about this instrument..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={streaming}
              />

              {/* Send button */}
              <button
                onClick={onStream}
                disabled={streaming || (!q.trim() && attachedFiles.length === 0)}
                className={`flex-shrink-0 p-3 rounded-xl transition ${
                  streaming || (!q.trim() && attachedFiles.length === 0)
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {streaming ? (
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                )}
              </button>
            </div>

            <div className="text-xs text-gray-400 text-center mt-2">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>

      {/* Citation Modal */}
      {selectedCitation && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCitation(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex-1">
                <h3 className="font-semibold text-xl mb-1">
                  {selectedCitation.source_title || "Source Document"}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {selectedCitation.source_type?.toUpperCase() || "DOCUMENT"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCitation(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-medium text-blue-900 mb-1">
                      Referenced in Response
                    </div>
                    <div className="text-sm text-blue-700">
                      This document was used to generate the answer. Open the full viewer to see the complete content and highlighted sections.
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <a
                    href={`/viewer?source=${selectedCitation.source_id}&fragment=${selectedCitation.fragment_id}`}
                    target="_blank"
                    className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                    rel="noopener noreferrer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open Full Viewer
                  </a>
                  <a
                    href={`/instruments/${id}/store`}
                    className="flex-1 btn-secondary flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    View in Knowledge Store
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
