"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Scene = {
  text: string;
  choices: Array<{
    text: string;
    nextScene: string;
  }>;
};

type BugOptions = {
  imageSprite?: string;
  bugWidth?: number;
  bugHeight?: number;
  num_frames?: number;
  canFly?: boolean;
  canDie?: boolean;
  numDeathTypes?: number;
  zoom?: number;
  minDelay?: number;
  maxDelay?: number;
  minBugs?: number;
  maxBugs?: number;
  minSpeed?: number;
  maxSpeed?: number;
  mouseOver?: string;
};

type BugController = {
  initialize: (options?: BugOptions) => void;
  end: () => void;
};

type AdventureState = {
  scenes: Record<string, Scene>;
  currentScene: string;
  accentColor: string;
  tabTitle: string;
  spiders: boolean;
  isLoading: boolean;
  error: string | null;
};

declare global {
  interface Window {
    BugController: new (options?: BugOptions) => BugController;
    currentSpiderController: BugController | null;
  }
}

function useAdventureParams(): AdventureState {
  const searchParams = useSearchParams();

  return useMemo(() => {
    try {
      const dataParam = searchParams.get('data');
      const colorParam = searchParams.get('color');
      const titleParam = searchParams.get('title');
      const spidersParam = searchParams.get('spiders');

      const state: AdventureState = {
        scenes: {},
        currentScene: 'start',
        accentColor: '#61dafb',
        tabTitle: 'My Adventure',
        spiders: false,
        isLoading: false,
        error: null,
      };

      if (dataParam) {
        const decodedData = decodeURIComponent(dataParam);
        const parsedScenes = JSON.parse(decodedData);
        state.scenes = parsedScenes;
      }

      if (colorParam) {
        state.accentColor = decodeURIComponent(colorParam);
      }

      if (titleParam) {
        state.tabTitle = decodeURIComponent(titleParam);
      }

      if (spidersParam) {
        state.spiders = spidersParam === '1';
      }

      return state;
    } catch (error) {
      console.error('Failed to parse adventure parameters:', error);
      return {
        scenes: {},
        currentScene: 'start',
        accentColor: '#61dafb',
        tabTitle: 'My Adventure',
        spiders: false,
        isLoading: false,
        error: 'Failed to load adventure data',
      };
    }
  }, [searchParams]);
}

function useSpiderController(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const initializeSpiderController = () => {
      try {
        if (!window.BugController) {
          const script = document.createElement('script');
          script.src = '/bug.js';
          script.onload = () => {
            if (window.BugController) {
              const controller = new window.BugController({
                imageSprite: 'spider-sprite.png',
                bugWidth: 69,
                bugHeight: 90,
                num_frames: 7,
                canFly: false,
                canDie: true,
                numDeathTypes: 2,
                zoom: 6,
                minDelay: 200,
                maxDelay: 3000,
                minBugs: 2,
                maxBugs: 4,
                minSpeed: 6,
                maxSpeed: 13,
                mouseOver: 'random'
              });
              controller.initialize();
              window.currentSpiderController = controller;
            }
          };
          document.head.appendChild(script);
        } else {
          const controller = new window.BugController({
            imageSprite: 'spider-sprite.png',
            bugWidth: 69,
            bugHeight: 90,
            num_frames: 7,
            canFly: false,
            canDie: true,
            numDeathTypes: 2,
            zoom: 6,
            minDelay: 200,
            maxDelay: 3000,
            minBugs: 2,
            maxBugs: 4,
            minSpeed: 6,
            maxSpeed: 13,
            mouseOver: 'random'
          });
          controller.initialize();
          window.currentSpiderController = controller;
        }
      } catch (error) {
        console.error('Failed to initialize spider controller:', error);
      }
    };

    const cleanupSpiderController = () => {
      if (window.currentSpiderController) {
        window.currentSpiderController.end();
        window.currentSpiderController = null;
      }
    };

    initializeSpiderController();

    return cleanupSpiderController;
  }, [enabled]);
}

const SPECIAL_SCENES = {
  make_your_own: () => window.location.href = '/code',
  go_home: () => window.location.href = '/',
} as const;

function LoadingScreen() {
  return (
    <main className="h-screen bg-black text-white font-mono flex justify-center items-center">
      <div>Loading adventure...</div>
    </main>
  );
}

function ErrorScreen({
  error,
  accentColor,
  onReturnToStart
}: {
  error: string;
  accentColor: string;
  onReturnToStart: () => void;
}) {
  return (
    <main className="h-screen bg-black text-white font-mono flex flex-col justify-center items-center p-10">
      <div className="text-2xl mb-5 text-center text-red-400">{error}</div>
      <button
        onClick={onReturnToStart}
        className="mt-5 px-5 py-2.5 rounded font-bold font-mono cursor-pointer"
        style={{ background: accentColor, color: "black" }}
      >
        Return to Start
      </button>
    </main>
  );
}

function ChoiceButton({
  choice,
  accentColor,
  onClick
}: {
  choice: { text: string; nextScene: string };
  accentColor: string;
  onClick: (nextScene: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(choice.nextScene)}
      className="text-lg text-white bg-transparent border-2 px-6 py-3 rounded-full cursor-pointer font-bold uppercase tracking-wide min-w-50 hover:text-black transition-colors duration-300"
      style={{ borderColor: accentColor }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = accentColor}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      {choice.text}
    </button>
  );
}

function GameScreen({
  currentSceneData,
  accentColor,
  onChoice
}: {
  currentSceneData: Scene;
  accentColor: string;
  onChoice: (nextScene: string) => void;
}) {
  return (
    <main className="min-h-screen bg-black text-white font-mono flex flex-col justify-center items-center p-10 relative">
      <div className="text-2xl leading-relaxed mb-10 max-w-2xl text-center whitespace-pre-line">
        {currentSceneData.text}
      </div>

      <div className="flex flex-wrap justify-center gap-3.5">
        {currentSceneData.choices.map((choice, index) => (
          <ChoiceButton
            key={index}
            choice={choice}
            accentColor={accentColor}
            onClick={onChoice}
          />
        ))}
      </div>
    </main>
  );
}


function PlayAdventure() {
  const adventureState = useAdventureParams();
  const [currentScene, setCurrentScene] = useState<string>('start');

  useSpiderController(adventureState.spiders);

  useEffect(() => {
    if (adventureState.tabTitle) {
      document.title = adventureState.tabTitle;
    }
  }, [adventureState.tabTitle]);

  const handleChoice = (nextScene: string) => {
    const specialHandler = SPECIAL_SCENES[nextScene as keyof typeof SPECIAL_SCENES];
    if (specialHandler) {
      specialHandler();
      return;
    }
    setCurrentScene(nextScene);
  };

  const handleReturnToStart = () => {
    setCurrentScene('start');
  };

  if (adventureState.isLoading) {
    return <LoadingScreen />;
  }

  if (adventureState.error) {
    return (
      <ErrorScreen
        error={adventureState.error}
        accentColor={adventureState.accentColor}
        onReturnToStart={handleReturnToStart}
      />
    );
  }

  if (Object.keys(adventureState.scenes).length === 0) {
    return (
      <ErrorScreen
        error="No adventure data found"
        accentColor={adventureState.accentColor}
        onReturnToStart={handleReturnToStart}
      />
    );
  }

  const currentSceneData = adventureState.scenes[currentScene];

  if (!currentSceneData) {
    return (
      <ErrorScreen
        error={`Scene "${currentScene}" not found!`}
        accentColor={adventureState.accentColor}
        onReturnToStart={handleReturnToStart}
      />
    );
  }

  return (
    <GameScreen
      currentSceneData={currentSceneData}
      accentColor={adventureState.accentColor}
      onChoice={handleChoice}
    />
  );
}

function PlayAdventureWrapper() {
  return (
    <Suspense fallback={<div>Loading adventure...</div>}>
      <PlayAdventure />
    </Suspense>
  );
}

export default PlayAdventureWrapper;
