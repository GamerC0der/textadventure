"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt } from "@fortawesome/free-solid-svg-icons";

const PLAYER_MAX_HEALTH = 100;
const BATTLE_TIMEOUT = 2000;
const ATTACK_DAMAGE_MIN = 10;
const ATTACK_DAMAGE_MAX = 20;
const ENEMY_DAMAGE_MIN = 5;
const ENEMY_DAMAGE_MAX = 15;
const DEFENSE_MULTIPLIER = 0.5;

const BUTTON_BASE = "rounded font-bold font-mono cursor-pointer";
const CHOICE_BUTTON_CLASSES = "text-lg text-white bg-transparent border-2 px-6 py-3 rounded-full cursor-pointer font-bold uppercase tracking-wide min-w-50 hover:text-black transition-colors duration-300";
const WELCOME_BUTTON_CLASSES = "px-6 py-3 rounded-full font-bold cursor-pointer transition-opacity hover:opacity-90";

type Scene = {
  text: string;
  choices: Array<{
    text: string;
    nextScene: string;
  }>;
  battle?: {
    enabled: boolean;
    enemyName: string;
    enemyHealth: number;
    defendEnabled?: boolean;
  };
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

type BattleState = {
  inBattle: boolean;
  playerHealth: number;
  enemyMaxHealth: number;
  enemyHealth: number;
  enemyName: string;
  battleLog: string[];
  turn: 'player' | 'enemy';
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
        accentColor: '#a855f7',
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
        accentColor: '#a855f7',
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
        className={`mt-5 px-5 py-2.5 ${BUTTON_BASE}`}
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
      className={CHOICE_BUTTON_CLASSES}
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
  onChoice,
  onDownload,
  battle,
  onPlayerAttack,
  onPlayerDefend
}: {
  currentSceneData: Scene;
  accentColor: string;
  onChoice: (nextScene: string) => void;
  onDownload: () => void;
  battle: BattleState;
  onPlayerAttack: () => void;
  onPlayerDefend: () => void;
}) {
  if (battle.inBattle || currentSceneData?.battle?.enabled) {
    return (
      <main className="min-h-screen bg-black text-white font-mono flex flex-col justify-center items-center p-10 relative">
        <div className="max-w-4xl w-full">
          <div className="text-3xl leading-relaxed mb-7.5 text-center text-purple-400">
            BATTLE: {battle.enemyName.toUpperCase()}
          </div>

          <div className="flex justify-between mb-7.5">
            <div className="p-5 border-2 border-cyan-500 rounded-lg bg-black">
              <div className="text-xl mb-2.5">🛡️ PLAYER</div>
              <div className="text-lg">HP: {battle.playerHealth}/{PLAYER_MAX_HEALTH}</div>
              <div className="w-50 h-2.5 bg-gray-600 rounded mt-1.5">
                <div
                  className="h-full bg-cyan-500 rounded"
                  style={{ width: `${(battle.playerHealth / PLAYER_MAX_HEALTH) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-5 border-2 border-purple-500 rounded-lg bg-black">
              <div className="text-xl mb-2.5">👹 {battle.enemyName.toUpperCase()}</div>
              <div className="text-lg">HP: {battle.enemyHealth}/{battle.enemyMaxHealth}</div>
              <div className="w-50 h-2.5 bg-gray-600 rounded mt-1.5">
                <div
                  className="h-full bg-purple-500 rounded"
                  style={{ width: `${(battle.enemyHealth / battle.enemyMaxHealth) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-black p-5 rounded-lg mb-7.5 min-h-30 text-base leading-relaxed">
            {battle.battleLog.map((log, index) => (
              <div key={index} className="mb-1.25">
                {log}
              </div>
            ))}
          </div>

          <div className="text-center flex gap-4 justify-center">
            <button
              onClick={onPlayerAttack}
              disabled={battle.turn !== 'player' || battle.enemyHealth <= 0}
              className={`text-xl px-7.5 py-3.75 rounded-lg font-bold ${
                battle.turn === 'player' && battle.enemyHealth > 0
                  ? 'text-white cursor-pointer'
                  : 'bg-gray-600 text-white cursor-not-allowed'
              }`}
              style={{
                backgroundColor: battle.turn === 'player' && battle.enemyHealth > 0 ? accentColor : undefined,
                border: `2px solid ${accentColor}`,
                color: battle.turn === 'player' && battle.enemyHealth > 0 ? 'black' : undefined
              }}
            >
              ATTACK
            </button>
            {currentSceneData?.battle?.defendEnabled !== false && (
              <button
                onClick={onPlayerDefend}
                disabled={battle.turn !== 'player' || battle.enemyHealth <= 0}
                className={`text-xl px-7.5 py-3.75 rounded-lg font-bold ${
                  battle.turn === 'player' && battle.enemyHealth > 0
                    ? 'text-white cursor-pointer'
                    : 'bg-gray-600 text-white cursor-not-allowed'
                }`}
                style={{
                  backgroundColor: battle.turn === 'player' && battle.enemyHealth > 0 ? accentColor : undefined,
                  border: `2px solid ${accentColor}`,
                  color: battle.turn === 'player' && battle.enemyHealth > 0 ? 'black' : undefined
                }}
              >
                DEFEND
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white font-mono flex flex-col justify-center items-center p-10">
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
  const searchParams = useSearchParams();
  const [currentScene, setCurrentScene] = useState<string>('start');
  const [battle, setBattle] = useState<BattleState>({
    inBattle: false,
    playerHealth: PLAYER_MAX_HEALTH,
    enemyMaxHealth: 0,
    enemyHealth: 0,
    enemyName: '',
    battleLog: [],
    turn: 'player'
  });

  useSpiderController(adventureState.spiders);

  useEffect(() => {
    const sceneParam = searchParams.get('scene');
    if (sceneParam && adventureState.scenes[sceneParam]) {
      setCurrentScene(sceneParam);
      const sceneData = adventureState.scenes[sceneParam];
      if (sceneData.battle?.enabled && !battle.inBattle) {
        startBattle(sceneData.battle.enemyName, sceneData.battle.enemyHealth);
      }
    }
  }, [searchParams, adventureState.scenes, battle.inBattle]);


  const downloadAdventure = () => {
    const adventureData = {
      scenes: adventureState.scenes,
      accentColor: adventureState.accentColor,
      tabTitle: adventureState.tabTitle,
      spiders: adventureState.spiders
    };

    const blob = new Blob([JSON.stringify(adventureData, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = adventureState.tabTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_adventure.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const startBattle = (enemyName: string, enemyHealth: number) => {
    setBattle({
      inBattle: true,
      playerHealth: PLAYER_MAX_HEALTH,
      enemyMaxHealth: enemyHealth,
      enemyHealth,
      enemyName,
      battleLog: [`A ${enemyName} appears!`],
      turn: 'player'
    });
  };

  const playerAttack = () => {
    const damage = Math.floor(Math.random() * (ATTACK_DAMAGE_MAX - ATTACK_DAMAGE_MIN + 1)) + ATTACK_DAMAGE_MIN;
    const newEnemyHealth = Math.max(0, battle.enemyHealth - damage);
    const log = [...battle.battleLog, `You attack for ${damage} damage!`];

    if (newEnemyHealth <= 0) {
      log.push(`You defeated the ${battle.enemyName}!`);
      setTimeout(() => {
        setBattle(prev => ({ ...prev, inBattle: false, battleLog: [] }));
        setCurrentScene('start');
      }, BATTLE_TIMEOUT);
    }

    setBattle(prev => ({
      ...prev,
      enemyHealth: newEnemyHealth,
      battleLog: log,
      turn: 'enemy'
    }));

    if (newEnemyHealth > 0) {
      setTimeout(() => enemyAttack(false), 1000);
    }
  };

  const playerDefend = () => {
    const log = [...battle.battleLog, `You take a defensive stance!`];

    setBattle(prev => ({
      ...prev,
      battleLog: log,
      turn: 'enemy'
    }));

    setTimeout(() => enemyAttack(true), 1000);
  };

  const enemyAttack = (playerIsDefending = false) => {
    const baseDamage = Math.floor(Math.random() * (ENEMY_DAMAGE_MAX - ENEMY_DAMAGE_MIN + 1)) + ENEMY_DAMAGE_MIN;
    const damage = playerIsDefending ? Math.floor(baseDamage * DEFENSE_MULTIPLIER) : baseDamage;
    const newPlayerHealth = Math.max(0, battle.playerHealth - damage);
    const log = [...battle.battleLog, playerIsDefending
      ? `The ${battle.enemyName} attacks for ${baseDamage} damage, but you defend and only take ${damage}!`
      : `The ${battle.enemyName} attacks for ${damage} damage!`];

    if (newPlayerHealth <= 0) {
      log.push('You were defeated! Game Over.');
      setTimeout(() => {
        setCurrentScene('start');
        setBattle(prev => ({ ...prev, inBattle: false, battleLog: [], playerHealth: PLAYER_MAX_HEALTH }));
      }, BATTLE_TIMEOUT);
    }

    setBattle(prev => ({
      ...prev,
      playerHealth: newPlayerHealth,
      battleLog: log,
      turn: 'player'
    }));
  };

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

    const sceneData = adventureState.scenes[nextScene];
    if (sceneData && sceneData.battle?.enabled) {
      startBattle(sceneData.battle.enemyName, sceneData.battle.enemyHealth);
    }
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
      <main className="min-h-screen bg-black text-white font-mono flex flex-col justify-center items-center p-10">
        <div className="max-w-2xl text-center">
          <div className="text-3xl mb-8 text-purple-400">Welcome to Text Adventure!</div>
          <div className="text-lg leading-relaxed mb-8">
            This is an interactive text-based adventure game where you make choices to progress through the story.
            Click on the colored buttons below to make your decisions and explore different paths in the narrative.
            Some adventures may include battles where you'll need to choose between attacking or defending.
          </div>
          <div className="text-base leading-relaxed mb-8 text-gray-300">
            To get started, create your own adventure using the "Make Your Own" button, or visit the home page to explore existing adventures.
            Each choice you make will take you to a new scene with more story and decisions to make.
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => window.location.href = '/code'}
              className={`${WELCOME_BUTTON_CLASSES} text-black`}
              style={{ background: adventureState.accentColor }}
            >
              Make Your Own Adventure
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 rounded-full font-bold text-white bg-gray-700 border-2 border-gray-500 cursor-pointer hover:bg-gray-600 transition-colors"
            >
              Browse Adventures
            </button>
          </div>
        </div>
      </main>
    );
  }

  const currentSceneData = adventureState.scenes[currentScene];

  if (!currentSceneData) {
    return (
      <ErrorScreen
        error={'Scene "' + currentScene + '" not found!'}
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
      onDownload={downloadAdventure}
      battle={battle}
      onPlayerAttack={playerAttack}
      onPlayerDefend={playerDefend}
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
