import { useState } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";

export default function App() {
  const [question, setQuestion] = useState("");
  // Removed unused answer state
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ q: string; a: string }[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const askQuestion = async () => {
    if (!question.trim()) return;
    setLoading(true);
    // setAnswer(""); // No longer needed

    try {
      const res = await fetch("https://gemini-api-2sw1.onrender.com/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      const rawHtml = await marked.parse(data.answer || "No response received");
      const safeHtml = DOMPurify.sanitize(rawHtml);
      // setAnswer(safeHtml); // No longer needed
      setChatHistory((prev) => [...prev, { q: question, a: safeHtml }]);
      setSelectedIndex(chatHistory.length); // auto-select newest
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? "Error: " + err.message : "Unknown error occurred.";
      setChatHistory((prev) => [...prev, { q: question, a: errorMsg }]);
      setSelectedIndex(chatHistory.length);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-teal-600 p-4 space-y-2 overflow-y-auto">
        <h2 className="text-lg font-semibold text-teal-400 mb-4">Chat History</h2>
        {chatHistory.map((entry, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedIndex(idx)}
            className={`w-full text-left p-2 rounded hover:bg-gray-700 transition ${
              selectedIndex === idx ? "bg-teal-600 text-white" : "bg-gray-700 text-gray-300"
            }`}
          >
            {entry.q.slice(0, 50)}...
          </button>
        ))}
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        <h1 className="text-4xl font-bold mb-6 text-center text-teal-400">
          Gemini AI Assistant
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <textarea
            className="flex-1 border border-teal-500 bg-gray-800 text-white rounded px-4 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            placeholder="Type your question here..."
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && askQuestion()}
          />
          <button
            onClick={askQuestion}
            disabled={loading}
            className="bg-teal-600 text-white px-6 py-2 rounded hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Ask"}
          </button>
        </div>

        {selectedIndex !== null && (
          <div className="prose prose-invert max-w-none bg-gray-800 border border-teal-600 rounded p-6 shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4 text-teal-400">Answer:</h2>
            <p className="mb-2 font-semibold text-gray-300">Q: {chatHistory[selectedIndex].q}</p>
            <div dangerouslySetInnerHTML={{ __html: chatHistory[selectedIndex].a }} />
          </div>
        )}
      </main>
    </div>
  );
}
