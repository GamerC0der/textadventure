"use client";

import { useEffect } from "react";
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

      <main className="min-h-screen bg-black text-white font-sans flex flex-col justify-center items-center p-10">
        <div className="text-2xl leading-loose mb-10 max-w-2xl text-left whitespace-pre-line">
          {currentSceneData.text}
        </div>

        <div className="flex flex-wrap gap-5">
          {currentSceneData.choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => handleChoice(choice.nextScene)}
              className="text-lg text-white bg-transparent border border-white px-5 py-2.5 rounded hover:bg-white hover:text-black transition-colors duration-300 cursor-pointer"
            >
              {choice.text}
            </button>
          ))}
        </div>
      </main>
    </>
  );
}
