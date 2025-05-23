import { useState } from "react";

export default function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");

    try {
      const res = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      setAnswer(data.answer || "No response received");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAnswer("Error: " + err.message);
      } else {
        setAnswer("An unknown error occurred");
      }
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

        <div className="bg-teal-50 border border-teal-200 rounded p-6 shadow-sm whitespace-pre-wrap">
          <h2 className="text-xl font-semibold mb-2 text-teal-700">Answer:</h2>
          <p className="text-gray-800 leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}
