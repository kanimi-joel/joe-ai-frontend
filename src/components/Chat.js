import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// Main Chat Component
function Chat() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [pdfText, setPdfText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Scroll to bottom when chat updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Handle sending message
  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { sender: "user", text: message };
    setChatHistory([...chatHistory, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/ask`, {
        message: message,
        context: pdfText,
      });

      const aiMessage = { sender: "ai", text: res.data.response };
      setChatHistory((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = { sender: "ai", text: "Something went wrong!" };
      setChatHistory((prev) => [...prev, errorMessage]);
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

  // Extract text from PDF
  const extractTextFromPDF = async (file) => {
    const pdfjsLib = await import("pdfjs-dist/build/pdf");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const fileReader = new FileReader();

    return new Promise((resolve, reject) => {
      fileReader.onload = async function () {
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
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(file);
    });
  };

  // Handle PDF file upload
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    const extractedText = await extractTextFromPDF(selectedFile);
    setPdfText(extractedText);
  };

  // Chat bubble component
  const ChatBubble = ({ message }) => (
    <div
      style={{
        padding: "10px 15px",
        margin: "5px 0",
        borderRadius: "20px",
        maxWidth: "70%",
        wordWrap: "break-word",
        backgroundColor: message.sender === "user" ? "#4b7bec" : "#e6e6e6",
        color: message.sender === "user" ? "white" : "black",
        alignSelf: message.sender === "user" ? "flex-end" : "flex-start",
        marginLeft: message.sender === "user" ? "auto" : "0",
        marginRight: message.sender === "ai" ? "auto" : "0",
      }}
    >
      <p style={{ margin: 0 }}>{message.text}</p>
    </div>
  );

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <h1 style={{ textAlign: "center" }}>🤖 JOE AI Assistant</h1>

      {/* PDF Uploader */}
      <div style={{ margin: "10px 0" }}>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        {file && <p>Loaded PDF: {file.name}</p>}
      </div>

      {/* Chat box */}
      <div
        style={{
          flex: 1,
          border: "1px solid #ccc",
          padding: "10px",
          overflowY: "auto",
          borderRadius: "10px",
          backgroundColor: "#f8f9fa",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {chatHistory.map((msg, idx) => (
          <ChatBubble key={idx} message={msg} />
        ))}
        {loading && <ChatBubble message={{ sender: "ai", text: "Typing..." }} />}
        <div ref={chatEndRef} />
      </div>

      {/* Message input */}
      <textarea
        rows="3"
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyPress}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "5px",
          marginTop: "10px",
          resize: "none",
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
        }}
      >
        Send
      </button>
    </div>
  );
}

export default Chat;

