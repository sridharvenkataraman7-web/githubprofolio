import React, { useState } from "react";

export default function ChatbotPanel() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! Want to know about me? 😊" },
  ]);

  const askNextQuestion = () => {
    return "Do you want to see my skills?";
  };

  const handleAnswer = (answer) => {
    setMessages(prev => [
      ...prev,
      { from: "user", text: answer }
    ]);

    if (answer === "Yes") {
      setMessages(prev => [
        ...prev,
        { from: "bot", text: "Great! I am a Web Developer + 3D Artist." },
        { from: "bot", text: askNextQuestion() }
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        { from: "bot", text: "No worries! You can explore my 3D scene freely." }
      ]);
    }
  };

  return (
    <div style={{
      width: "300px",
      height: "200px",
      background: "rgba(20,20,20,0.9)",
      borderRadius: "10px",
      padding: "10px",
      color: "white",
      fontFamily: "Arial",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    }}>
      
      <div style={{ overflowY: "auto", height: "150px" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: "4px" }}>
            <b>{m.from === "bot" ? "🤖 Bot:" : "🧑 You:"}</b> {m.text}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button
          style={{
            width: "45%",
            padding: "6px",
            background: "#00c853",
            border: "none",
            color: "white",
            borderRadius: "5px",
          }}
          onClick={() => handleAnswer("Yes")}
        >
          YES
        </button>

        <button
          style={{
            width: "45%",
            padding: "6px",
            background: "#d50000",
            border: "none",
            color: "white",
            borderRadius: "5px",
          }}
          onClick={() => handleAnswer("No")}
        >
          NO
        </button>
      </div>
    </div>
  );
}
