import { useState } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";

export default function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");

    try {
      const res = await fetch("https://gemini-api-2sw1.onrender.com/ask", {
        // Or use http://localhost:8000/ask for local dev
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      // Convert Markdown to HTML and sanitize
      const rawHtml = await marked.parse(data.answer || "No response received");
      const safeHtml = DOMPurify.sanitize(rawHtml);
      setAnswer(safeHtml);
    } catch (err: unknown) {
      setAnswer(err instanceof Error ? "Error: " + err.message : "Unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-gray-800 px-4">
      <div className="w-full max-w-3xl py-12">
        <h1 className="text-4xl font-bold mb-10 text-center text-teal-600">
          Gemini AI Assistant
        </h1>

        <div className="flex flex-col sm:flex-row items-stretch gap-4 mb-8">
          <input
            type="text"
            className="flex-1 border border-teal-300 rounded px-4 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            placeholder="Type your question here..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button
            onClick={askQuestion}
            disabled={loading}
            className="bg-teal-600 text-white px-6 py-2 rounded hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Loading..." : "Ask"}
          </button>
        </div>

        <div className="prose max-w-none bg-teal-50 border border-teal-200 rounded p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-teal-700">Answer:</h2>
          <div dangerouslySetInnerHTML={{ __html: answer }} />
        </div>
      </div>
    </div>
  );
}
