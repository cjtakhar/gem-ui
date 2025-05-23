import { useState, useEffect } from "react"; // Added useEffect for window resize handling
import DOMPurify from "dompurify";
import { marked } from "marked";

export default function App() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ q: string; a: string }[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(window.innerWidth >= 640); // Initialize based on screen width

  // Effect to handle window resize for sidebar visibility
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setShowHistory(true);
      } else if (chatHistory.length === 0) { // Or if you want it to hide if no history on mobile
        setShowHistory(false);
      }
      // If you want it to remember the user's toggle on mobile,
      // you might need a more complex state or to remove this auto-show on resize.
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on mount
    return () => window.removeEventListener('resize', handleResize);
  }, [chatHistory.length]);


  const askQuestion = async () => {
    if (!question.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("https://gemini-api-2sw1.onrender.com/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      const rawHtml = await marked.parse(data.answer || "No response received");
      const safeHtml = DOMPurify.sanitize(rawHtml);
      
      setChatHistory((prev) => [...prev, { q: question, a: safeHtml }]);
      setSelectedIndex(chatHistory.length); // auto-select newest
      
      // Clear the question input field
      setQuestion(""); // <--- ADD THIS LINE

    } catch (error) { // It's good practice to log or handle the error
      console.error("Error fetching answer:", error);
      // Optionally set an error message in the UI
      // For example: setChatHistory(prev => [...prev, { q: question, a: "Sorry, an error occurred." }]);
      // setQuestion(""); // You might also want to clear question on error
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

  // Function to create a new chat (clears current question and selection)
  const createNewChat = () => {
    setQuestion("");
    setSelectedIndex(null);
    // Optionally, if on mobile and history is open, close it for a new chat feel
    if (window.innerWidth < 640) {
      setShowHistory(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col sm:flex-row">
      {/* Sidebar */}
      <aside className="w-full sm:w-72 bg-gray-800 border-b sm:border-b-0 sm:border-r border-teal-600 p-4 flex flex-col">
        <div className="flex items-center justify-between sm:block mb-4">
          <h2 className="text-lg font-semibold text-teal-400">Chat History</h2>
          <button
            className="sm:hidden text-sm text-teal-400 underline"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? "Hide" : "Show"}
          </button>
        </div>
        <button
          onClick={createNewChat}
          className="w-full bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 mb-4 text-sm"
        >
          + New Chat
        </button>
        <div className={`flex-grow overflow-y-auto ${showHistory ? "block" : "hidden sm:block"}`}>
          {chatHistory.length === 0 && (
            <p className="text-gray-500 text-sm">No chats yet.</p>
          )}
          {chatHistory.map((entry, idx) => (
            <div
              key={idx}
              className={`relative group rounded transition mb-2 ${
                selectedIndex === idx ? "bg-teal-600 text-white" : "bg-gray-700 text-gray-300"
              }`}
            >
              <button
                onClick={() => {
                  setSelectedIndex(idx);
                  // If on mobile, and history was manually opened, you might want to close it
                  // or ensure the main content is visible. For now, just selecting.
                  if (window.innerWidth < 640 && showHistory) {
                     // Optionally hide history to show content better on mobile
                     // setShowHistory(false);
                  }
                }}
                className="w-full text-left p-2 pr-8 hover:bg-gray-600 rounded truncate" // Added truncate
                title={entry.q} // Show full question on hover
              >
                {entry.q}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent chat selection when deleting
                  deleteChat(idx);
                }}
                className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-8 flex flex-col"> {/* Added flex flex-col */}
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-teal-400">
          Gemini AI Assistant
        </h1>

        {/* Answer Area: Takes up available space and scrolls if needed */}
        <div className="flex-grow overflow-y-auto mb-6">
          {selectedIndex !== null && chatHistory[selectedIndex] ? (
            <div className="prose prose-invert max-w-none bg-gray-800 border border-teal-600 rounded p-4 sm:p-6 shadow-sm">
              <p className="mb-2 font-semibold text-gray-300">Q: {chatHistory[selectedIndex].q}</p>
              <div dangerouslySetInnerHTML={{ __html: chatHistory[selectedIndex].a }} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-xl">Select a chat or ask a new question</p>
            </div>
          )}
        </div>
        
        {/* Input area: Sticks to the bottom */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <textarea
            className="flex-1 border border-teal-500 bg-gray-800 text-white rounded px-4 py-2 shadow-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none" // Added resize-none
            placeholder="Type your question here..."
            rows={2} // Adjusted rows
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); // Prevent newline in textarea
                askQuestion();
              }
            }}
          />
          <button
            onClick={askQuestion}
            disabled={loading || !question.trim()} // Disable if no question
            className="bg-teal-600 text-white px-6 py-2 rounded hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed" // Added cursor-not-allowed
          >
            {loading ? "Loading..." : "Ask"}
          </button>
        </div>
      </main>
    </div>
  );
}