// src/App.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import * as pdfjsLib from "pdfjs-dist";
import { saveAs } from "file-saver";
import { auth, provider } from "./firebase";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY"; // Replace with your key
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const db = getFirestore();

export default function App() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [question, setQuestion] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const q = query(
          collection(db, "chats"),
          where("uid", "==", currentUser.uid),
          orderBy("timestamp", "desc")
        );
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const chats = [];
          querySnapshot.forEach((doc) => {
            chats.push({ id: doc.id, ...doc.data() });
          });
          setChatHistory(chats);
        });
        return () => unsubscribe();
      } else {
        setChatHistory([]);
      }
    });
  }, []);

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  const storeChat = async (prompt, answer) => {
    if (!user) return;
    await addDoc(collection(db, "chats"), {
      uid: user.uid,
      email: user.email,
      prompt,
      answer,
      timestamp: serverTimestamp(),
    });
  };

  const handleOpenAIQuery = async (queryText) => {
    setLoading(true);
    try {
   const res = await axios.post(
  "https://joe-ai-backend-production.up.railway.app/ask",
  { message: queryText },
  {
    headers: {
      "Content-Type": "application/json",
    },
  }
);

const answer = res.data.response;
setResponse(answer);
await storeChat(queryText, answer);

    } catch {
      setResponse("Error reaching OpenAI API.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const typedArray = new Uint8Array(event.target.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item) => item.str).join(" ") + "\n";
        }
        setFileContent(text);
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => setFileContent(event.target.result);
      reader.readAsText(file);
    }
  };

  const askAboutFile = () => {
    if (!fileContent || !question) return;
    handleOpenAIQuery(`Based on this document: ${fileContent}\n\nAnswer: ${question}`);
  };

  const exportResponse = () => {
    const blob = new Blob([response], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "response.txt");
  };

  const mockClusters = [
    {
      id: 1,
      topic: "AI in Healthcare",
      articles: [
        {
          id: "a1",
          title: "Transforming diagnostics",
          snippet: "AI is used to detect diseases faster...",
        },
      ],
    },
    {
      id: 2,
      topic: "NLP",
      articles: [
        {
          id: "b1",
          title: "Chatbots 2025",
          snippet: "Chatbots now understand better thanks to transformers...",
        },
      ],
    },
  ];

  const filteredClusters = mockClusters.filter((c) =>
    c.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to JOE AI</h1>
          <button
            onClick={login}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      } min-h-screen p-6`}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">JOE AI – Your Research Assistant</h1>
       <div className="flex flex-wrap items-center gap-3">
 <div className="flex flex-wrap items-center gap-3">
  {/* Avatar and Name */}
  <div className="flex items-center gap-2">
    <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full" />
    <span className="text-sm font-medium truncate max-w-[120px]">{user.displayName}</span>
  </div>

  {/* Logout Button */}
  <button
    onClick={logout}
    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
  >
    Logout
  </button>

  {/* Dark Mode Toggle */}
  <button
    onClick={() => setDarkMode(!darkMode)}
    className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
  >
    Toggle {darkMode ? "Light" : "Dark"} Mode
  </button>
</div>
</div>
</div>

      {/* Ask AI */}
      <div className="max-w-xl mx-auto mb-6">
        <input
          className="w-full border px-4 py-2 rounded mb-2"
          placeholder="Search or ask something..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          onClick={() => handleOpenAIQuery(searchTerm)}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Ask AI
        </button>
        {loading && <p className="text-sm mt-2">Loading...</p>}
        {response && (
          <div className="mt-4 p-3 bg-white text-black rounded shadow">
            <p>{response}</p>
            <button
              onClick={exportResponse}
              className="mt-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export Answer
            </button>
          </div>
        )}
      </div>

      {/* Upload File */}
      <div className="max-w-xl mx-auto bg-white p-4 rounded shadow mb-6 text-black">
        <h2 className="text-lg font-semibold mb-2">Upload Document (.txt/.pdf)</h2>
        <input
          type="file"
          accept=".txt,.pdf"
          onChange={handleFileUpload}
          className="mb-2"
        />
        <textarea
          className="w-full border px-3 py-2 rounded mb-2"
          placeholder="Ask something about the document..."
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        ></textarea>
        <button
          onClick={askAboutFile}
          className="bg-green-600 text-white w-full py-2 rounded hover:bg-green-700"
        >
          Ask About Document
        </button>
      </div>
      {/* Knowledge Clusters */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Knowledge Clusters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClusters.map((cluster) => (
            <div
              key={cluster.id}
              onClick={() => setSelectedCluster(cluster)}
              className="p-4 border rounded-lg cursor-pointer hover:shadow bg-white text-black"
            >
              <h3 className="text-lg font-semibold">{cluster.topic}</h3>
              <p className="text-sm text-gray-600">{cluster.articles.length} articles</p>
            </div>
          ))}
        </div>

        {selectedCluster && (
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-2">Articles on {selectedCluster.topic}</h3>
            <div className="space-y-3">
              {selectedCluster.articles.map((a) => (
                <div
                  key={a.id}
                  className="p-3 bg-white text-black rounded border"
                >
                  <h4 className="font-semibold">{a.title}</h4>
                  <p className="text-gray-700 text-sm">{a.snippet}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat History */}
      <div className="max-w-4xl mx-auto mt-10">
        <h2 className="text-xl font-bold mb-4">Your Chat History</h2>
        {chatHistory.length === 0 && (
          <p className="text-gray-500">No chat history available.</p>
        )}
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              className="p-4 bg-white rounded shadow text-black"
            >
              <p>
                <strong className="text-blue-600">You:</strong> {chat.prompt}
              </p>
              <p className="mt-2">
                <strong className="text-green-600">JOE AI:</strong> {chat.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



