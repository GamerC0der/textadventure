"use client";

import { useState, useEffect } from "react";

type Scene = {
  text: string;
  choices: Array<{
    text: string;
    nextScene: string;
  }>;
};

export default function PlayAdventure() {
  const [scenes, setScenes] = useState<Record<string, Scene>>({});
  const [currentScene, setCurrentScene] = useState<string>('start');

  useEffect(() => {
    const adventureData = localStorage.getItem('adventureData');
    if (adventureData) {
      try {
        const parsedScenes = JSON.parse(adventureData);
        setScenes(parsedScenes);
      } catch (error) {
        console.error('Failed to parse adventure data:', error);
      }
    }
  }, []);

  const handleChoice = (nextScene: string) => {
    setCurrentScene(nextScene);
  };


  if (Object.keys(scenes).length === 0) {
    return (
      <main
        style={{
          height: "100vh",
          backgroundColor: "black",
          color: "white",
          fontFamily: "'Courier New', monospace",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div>Loading adventure...</div>
      </main>
    );
  }

  const currentSceneData = scenes[currentScene];

  if (!currentSceneData) {
    return (
      <main
        style={{
          height: "100vh",
          backgroundColor: "black",
          color: "white",
          fontFamily: "'Courier New', monospace",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px",
        }}
      >
        <div>Scene "{currentScene}" not found!</div>
        <button
          onClick={() => setCurrentScene('start')}
          style={{
            marginTop: "20px",
            background: "#61dafb",
            color: "black",
            border: "none",
            padding: "10px 20px",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            fontFamily: "'Courier New', monospace",
          }}
        >
          Return to Start
        </button>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "black",
        color: "white",
        fontFamily: "'Courier New', monospace",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
        position: "relative",
      }}
    >

      <div
        style={{
          fontSize: "24px",
          lineHeight: "1.8",
          marginBottom: "40px",
          maxWidth: "800px",
          textAlign: "center",
          whiteSpace: "pre-line",
        }}
      >
        {currentSceneData.text}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "15px" }}>
        {currentSceneData.choices.map((choice, index) => (
          <button
            key={index}
            onClick={() => handleChoice(choice.nextScene)}
            style={{
              fontSize: "18px",
              color: "white",
              backgroundColor: "transparent",
              border: "2px solid #61dafb",
              padding: "12px 24px",
              borderRadius: "25px",
              cursor: "pointer",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "1px",
              minWidth: "200px",
            }}
          >
            {choice.text}
          </button>
        ))}
      </div>
    </main>
  );
}
