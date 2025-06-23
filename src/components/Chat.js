import React, { useState } from "react";
import axios from "axios";
function Chat() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [pdfText, setPdfText] = useState("");
  const [file, setFile] = useState(null);

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
          const strings = content.items.map(item => item.str);
          text += strings.join(" ") + "\n";
        }
        resolve(text);
      };

      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    const extractedText = await extractTextFromPDF(selectedFile);
    setPdfText(extractedText);
  };

  const sendMessage = async () => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/ask`, {
        message: message,
        context: pdfText
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
        placeholder="Ask something..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <br />

      <input type="file" accept=".pdf" onChange={handleFileChange} />
      <br />

      <button onClick={sendMessage} style={{ marginTop: "10px" }}>
        Ask AI
      </button>

      <div style={{ marginTop: "20px" }}>
        <strong>JOE AI says:</strong>
        <p>{response}</p>
      </div>
    </div>
  );
}

export default Chat;


