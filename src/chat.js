import React, { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Chat({ username }) { // pass username as prop or get from auth
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]); // store chat history

  // --- Load chat history on component mount ---
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/get_history/${username}`);
        setMessages(res.data.history || []);
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };
    fetchHistory();
  }, [username]);

  // --- Send message and save to backend ---
  const sendMessage = async () => {
    if (!message.trim()) return; // avoid empty messages

    const userMessage = { sender: "user", content: message };
    setMessages((prev) => [...prev, userMessage]); // show user message immediately

    try {
      // Save user message
      await axios.post(`${BACKEND_URL}/save_message`, {
        username,
        sender: "user",
        content: message,
      });

      // Send message to AI
      const res = await axios.post(`${BACKEND_URL}/ask`, {
        message: message,
      });

      const aiMessage = { sender: "ai", content: res.data.response };

      // Save AI message
      await axios.post(`${BACKEND_URL}/save_message`, {
        username,
        sender: "ai",
        content: res.data.response,
      });

      setMessages((prev) => [...prev, aiMessage]); // show AI response
    } catch (error) {
      console.error("Error:", error);
      const aiMessage = { sender: "ai", content: "Something went wrong!" };
      setMessages((prev) => [...prev, aiMessage]);
    }

    setMessage(""); // clear input
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>🤖 JOE AI Assistant</h1>

      <div style={{ maxHeight: "400px", overflowY: "auto", marginBottom: "20px", border: "1px solid #ccc", padding: "10px" }}>
        {messages.map((msg, index) => (
          <p key={index} style={{ textAlign: msg.sender === "user" ? "right" : "left" }}>
            <strong>{msg.sender === "user" ? "You" : "JOE AI"}:</strong> {msg.content}
          </p>
        ))}
      </div>

      <textarea
        rows="3"
        cols="50"
        placeholder="Type your question..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <br />
      <button onClick={sendMessage} style={{ marginTop: "10px" }}>
        Send
      </button>
    </div>
  );
}

export default Chat;

