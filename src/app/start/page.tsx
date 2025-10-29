"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";

type Choice = {
  text: string;
  nextScene: string;
};

type Scene = {
  text: string;
  choices: Choice[];
};

export default function Home() {
  const [started, setStarted] = useState(false);
  const [currentScene, setCurrentScene] = useState<string>('left1');
  const [scenes, setScenes] = useState<Record<string, Scene>>({});

  useEffect(() => {
    fetch('/scenes.json')
      .then(response => response.json())
      .then(data => setScenes(data));
  }, []);

  const handleChoice = (nextScene: string) => {
    setCurrentScene(nextScene);
  };

  if (Object.keys(scenes).length === 0) {
    return <div>Loading...</div>;
  }

  const currentSceneData = scenes[currentScene];

  return (
    <>
      <Head>
        <title>Text Adventure Game</title>
        <meta
          name="description"
          content="Embark on a thrilling text-based journey."
        />
      </Head>

      <main
        style={{
          minHeight: "100vh",
          backgroundColor: "black",
          color: "white",
          fontFamily: "Arial, sans-serif",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px",
        }}
      >
        <div
          style={{
            fontSize: "24px",
            lineHeight: "2",
            marginBottom: "40px",
            maxWidth: "800px",
            textAlign: "left",
            whiteSpace: "pre-line",
          }}
        >
          {currentSceneData.text}
        </div>

        <div>
          {currentSceneData.choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => handleChoice(choice.nextScene)}
              style={{
                fontSize: "18px",
                color: "white",
                backgroundColor: "transparent",
                border: "1px solid white",
                padding: "10px 20px",
                borderRadius: "4px",
                marginRight: index < currentSceneData.choices.length - 1 ? "20px" : "0",
                cursor: "pointer",
                transition: "background-color 0.3s",
              }}
            >
              {choice.text}
            </button>
          ))}
        </div>
      </main>
    </>
  );
}
