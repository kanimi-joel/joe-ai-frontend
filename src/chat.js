import React, { useState } from "react";
import axios from "axios";

function Chat() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");

  const sendMessage = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/ask", {
        message: message,
      });
      setResponse(res.data.response);
    } catch (error) {
      console.error("Error:", error);
      setResponse("Something went wrong!");
    }
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>🤖 JOE AI Assistant</h1>
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
      <div style={{ marginTop: "20px" }}>
        <strong>JOE AI says:</strong>
        <p>{response}</p>
      </div>
    </div>
  );
}

export default Chat;
