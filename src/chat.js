
      import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

/**
 * JOE AI Chat Component
 * Features:
 * - Multi-PDF upload
 * - PDF text extraction
 * - Chat bubbles (AI/user)
 * - Dark/Light mode toggle
 * - Emoji support
 * - Timestamps for messages
 * - Typing indicator
 * - Scrollable chat history
 * - Responsive design
 * Everything in one file
 */

function Chat() {
  // Main states
  const [messages, setMessages] = useState([]); // Chat history
  const [input, setInput] = useState(""); // Input box
  const [pdfs, setPdfs] = useState([]); // Uploaded PDFs
  const [pdfText, setPdfText] = useState(""); // Extracted PDF text
  const [loading, setLoading] = useState(false); // Loading indicator
  const [darkMode, setDarkMode] = useState(false); // Theme toggle
  const chatEndRef = useRef(null); // Scroll ref

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Toggle dark/light mode
  const toggleTheme = () => setDarkMode(!darkMode);

  // Helper: extract text from a PDF
  const extractTextFromPDF = async (file) => {
    const pdfjsLib = await import("pdfjs-dist/build/pdf");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async function () {
        const typedArray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item) => item.str);
          text += strings.join(" ") + "\n";
        }
        resolve(text);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Handle PDF file uploads (multiple)
  const handlePDFUpload = async (e) => {
    const files = Array.from(e.target.files);
    setPdfs(files);

    let combinedText = "";
    for (const file of files) {
      const text = await extractTextFromPDF(file);
      combinedText += text + "\n";
    }
    setPdfText(combinedText);
  };

  // Send message to AI
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input, time: new Date() };
    setMessages([...messages, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/ask`, {
        message: input,
        context: pdfText,
      });
      const aiMsg = { sender: "ai", text: res.data.response, time: new Date() };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg = {
        sender: "ai",
        text: "Oops! Something went wrong.",
        time: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Emoji picker
  const insertEmoji = (emoji) => setInput(input + emoji);

  // Chat bubble component
  const ChatBubble = ({ msg }) => (
    <div
      style={{
        maxWidth: "70%",
        padding: "10px 15px",
        margin: "5px 0",
        borderRadius: "20px",
        alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
        backgroundColor: msg.sender === "user" ? "#4b7bec" : "#e6e6e6",
        color: msg.sender === "user" ? "white" : "black",
        wordWrap: "break-word",
        boxShadow: "0px 2px 5px rgba(0,0,0,0.1)",
        fontSize: "15px",
        lineHeight: "1.4",
        position: "relative",
      }}
    >
      <p style={{ margin: 0 }}>{msg.text}</p>
      <span
        style={{
          fontSize: "10px",
          position: "absolute",
          bottom: "-15px",
          right: "10px",
          color: "#555",
        }}
      >
        {msg.time.toLocaleTimeString()}
      </span>
    </div>
  );

  // Main render
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "20px",
        maxWidth: "900px",
        margin: "0 auto",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: darkMode ? "#1e1e1e" : "#f9f9f9",
        color: darkMode ? "#f9f9f9" : "#1e1e1e",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: "0" }}>🤖 JOE AI Assistant</h1>
        <button
          onClick={toggleTheme}
          style={{
            padding: "5px 15px",
            borderRadius: "5px",
            border: "none",
            cursor: "pointer",
            backgroundColor: darkMode ? "#f9f9f9" : "#1e1e1e",
            color: darkMode ? "#1e1e1e" : "#f9f9f9",
          }}
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* PDF uploader */}
      <div style={{ margin: "15px 0" }}>
        <input type="file" accept=".pdf" multiple onChange={handlePDFUpload} />
        {pdfs.length > 0 && (
          <p style={{ marginTop: "5px" }}>
            Uploaded PDFs: {pdfs.map((f) => f.name).join(", ")}
          </p>
        )}
      </div>

      {/* Chat box */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "15px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          backgroundColor: darkMode ? "#2a2a2a" : "#fff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.map((msg, idx) => (
          <ChatBubble key={idx} msg={msg} />
        ))}
        {loading && <ChatBubble msg={{ sender: "ai", text: "Typing...", time: new Date() }} />}
        <div ref={chatEndRef} />
      </div>

      {/* Emoji picker */}
      <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap" }}>
        {["😀", "😂", "😎", "😍", "👍", "🔥", "💡", "🎉"].map((e, i) => (
          <button
            key={i}
            onClick={() => insertEmoji(e)}
            style={{
              fontSize: "20px",
              margin: "3px",
              padding: "5px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Input box */}
      <textarea
        placeholder="Type your message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyPress}
        rows={3}
        style={{
          marginTop: "10px",
          padding: "10px",
          borderRadius: "5px",
          border: "1px solid #ccc",
          resize: "none",
          backgroundColor: darkMode ? "#3a3a3a" : "#fff",
          color: darkMode ? "#f9f9f9" : "#1e1e1e",
        }}
      />

      <button
        onClick={sendMessage}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          border: "none",
          borderRadius: "5px",
          backgroundColor: "#4b7bec",
          color: "white",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Send
      </button>
    </div>
  );
}

export default Chat;

