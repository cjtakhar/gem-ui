import { useState } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";

export default function App() {
  const [question, setQuestion] = useState("");
  // Removed unused answer state
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ q: string; a: string }[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const askQuestion = async () => {
    if (!question.trim()) return;
    setLoading(true);
    // setAnswer(""); // Removed unused answer state

    try {
      const res = await fetch("https://gemini-api-2sw1.onrender.com/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      const rawHtml = await marked.parse(data.answer || "No response received");
      const safeHtml = DOMPurify.sanitize(rawHtml);
      // setAnswer(safeHtml); // Removed unused answer state
      setChatHistory((prev) => [...prev, { q: question, a: safeHtml }]);
      setSelectedIndex(chatHistory.length); // auto-select newest
    } catch {
      // Optionally handle error here, e.g., show a toast or log
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = (index: number) => {
    setChatHistory((prev) => prev.filter((_, i) => i !== index));
    if (selectedIndex === index) {
      setSelectedIndex(null);
    } else if (selectedIndex !== null && index < selectedIndex) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col sm:flex-row">
      {/* Sidebar */}
      <aside className="w-full sm:w-64 bg-gray-800 border-b sm:border-b-0 sm:border-r border-teal-600 p-4">
        <div className="flex items-center justify-between sm:block">
          <h2 className="text-lg font-semibold text-teal-400 mb-2 sm:mb-4">Chat History</h2>
          <button
            className="sm:hidden text-sm text-teal-400 underline"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? "Hide" : "Show"}
          </button>
        </div>
        <div className={`${showHistory || window.innerWidth >= 640 ? "block" : "hidden"}`}>
          {chatHistory.map((entry, idx) => (
            <div
              key={idx}
              className={`relative group rounded transition mb-2 ${
                selectedIndex === idx ? "bg-teal-600 text-white" : "bg-gray-700 text-gray-300"
              }`}
            >
              <button
                onClick={() => setSelectedIndex(idx)}
                className="w-full text-left p-2 pr-8 hover:bg-gray-600 rounded"
              >
                {entry.q.slice(0, 50)}...
              </button>
              <button
                onClick={() => deleteChat(idx)}
                className="absolute top-1 right-2 text-gray-400 hover:text-red-500 hidden group-hover:inline"
              >
                ×
              </button>
            </div>
          ))}
        </div>
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
