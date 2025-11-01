"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Head from "next/head";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt } from "@fortawesome/free-solid-svg-icons";

type Choice = {
  text: string;
  nextScene: string;
};

type Scene = {
  text: string;
  choices: Choice[];
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

function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentScene, setCurrentScene] = useState<string>('left1');
  const [scenes, setScenes] = useState<Record<string, Scene>>({});
  const [battle, setBattle] = useState<BattleState>({
    inBattle: false,
    playerHealth: 100,
    enemyMaxHealth: 0,
    enemyHealth: 0,
    enemyName: '',
    battleLog: [],
    turn: 'player'
  });

  useEffect(() => {
    fetch('/scenes.json')
      .then(response => response.json())
      .then(data => setScenes(data));
  }, []);

  useEffect(() => {
    const bugConfig = {
      minBugs: 3,
      maxBugs: 8,
      mouseOver: 'fly' as const,
      canFly: true,
      canDie: false,
      zoom: 20
    };

    const spiderConfig = {
      minDelay: 0,
      maxDelay: 3000,
      minBugs: 2,
      maxBugs: 4,
      mouseOver: 'random' as const,
      canFly: false,
      canDie: false,
      zoom: 15
    };

    const script = document.createElement('script');
    script.src = '/bug.js';
    script.onload = () => {
      if (typeof window !== 'undefined' && (window as any).BugController) {
        new (window as any).BugController(bugConfig);
        new (window as any).SpiderController(spiderConfig);
      }
    };
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="/bug.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  useEffect(() => {
    const sceneParam = searchParams.get('scene');
    if (sceneParam && scenes[sceneParam]) {
      setCurrentScene(sceneParam);
    }
  }, [searchParams, scenes]);

  const startBattle = (enemyName: string, enemyHealth: number) => {
    setBattle({
      inBattle: true,
      playerHealth: 100,
      enemyMaxHealth: enemyHealth,
      enemyHealth,
      enemyName,
      battleLog: [`A ${enemyName} appears!`],
      turn: 'player'
    });
  };

  const playerAttack = () => {
    const damage = Math.floor(Math.random() * 20) + 10;
    const newEnemyHealth = Math.max(0, battle.enemyHealth - damage);
    const log = [...battle.battleLog, `You attack for ${damage} damage!`];

    if (newEnemyHealth <= 0) {
      log.push(`You defeated the ${battle.enemyName}!`);
      setTimeout(() => {
        setBattle(prev => ({ ...prev, inBattle: false, battleLog: [] }));
        setCurrentScene('door_appears');
        router.push('?scene=door_appears');
      }, 2000);
    }

    setBattle(prev => ({
      ...prev,
      enemyHealth: newEnemyHealth,
      battleLog: log,
      turn: 'enemy'
    }));

    if (newEnemyHealth > 0) {
      setTimeout(enemyAttack, 1000);
    }
  };

  const enemyAttack = () => {
    const damage = Math.floor(Math.random() * 15) + 5;
    const newPlayerHealth = Math.max(0, battle.playerHealth - damage);
    const log = [...battle.battleLog, `The ${battle.enemyName} attacks for ${damage} damage!`];

    if (newPlayerHealth <= 0) {
      log.push('You were defeated! Game Over.');
      setTimeout(() => {
        setCurrentScene('start');
        setBattle(prev => ({ ...prev, inBattle: false, battleLog: [], playerHealth: 100 }));
        router.push('?scene=start');
      }, 2000);
    }

    setBattle(prev => ({
      ...prev,
      playerHealth: newPlayerHealth,
      battleLog: log,
      turn: 'player'
    }));
  };

  const handleChoice = (nextScene: string) => {
    if (nextScene === 'spider_battle') {
      startBattle('Giant Spider', 60);
    } else if (nextScene === 'left_battle') {
      startBattle('Spiders', 75);
    } else if (nextScene === 'make_your_own') {
      window.location.href = '/code';
      return;
    } else if (nextScene === 'go_home') {
      window.location.href = '/';
      return;
    } else {
      setCurrentScene(nextScene);
      router.push(`?scene=${nextScene}`);
    }
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

      <main className="h-screen bg-black text-white font-mono relative p-10 overflow-hidden">
        <div className="flex flex-col justify-center items-center min-h-screen">
        {battle.inBattle ? (
          <div className="max-w-4xl w-full">
            <div className="text-3xl leading-relaxed mb-7.5 text-center text-red-400">
              <FontAwesomeIcon icon={faBolt} className="mr-2" /> BATTLE: {battle.enemyName.toUpperCase()} <FontAwesomeIcon icon={faBolt} className="ml-2" />
            </div>

            <div className="flex justify-between mb-7.5">
              <div className="p-5 border-2 border-green-500 rounded-lg bg-black">
                <div className="text-xl mb-2.5">🛡️ PLAYER</div>
                <div className="text-lg">HP: {battle.playerHealth}/100</div>
                <div className="w-50 h-2.5 bg-gray-600 rounded mt-1.5">
                  <div
                    className="h-full bg-green-500 rounded"
                    style={{ width: `${(battle.playerHealth / 100) * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-5 border-2 border-red-500 rounded-lg bg-black">
                <div className="text-xl mb-2.5">👹 {battle.enemyName.toUpperCase()}</div>
                <div className="text-lg">HP: {battle.enemyHealth}/{battle.enemyMaxHealth}</div>
                <div className="w-50 h-2.5 bg-gray-600 rounded mt-1.5">
                  <div
                    className="h-full bg-red-500 rounded"
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

            <div className="text-center">
              <button
                onClick={playerAttack}
                disabled={battle.turn !== 'player' || battle.enemyHealth <= 0}
                className={`text-xl px-7.5 py-3.75 rounded-lg font-bold ${
                  battle.turn === 'player' && battle.enemyHealth > 0
                    ? 'bg-blue-500 text-white cursor-pointer hover:bg-blue-600'
                    : 'bg-gray-600 text-white cursor-not-allowed'
                }`}
              >
                <FontAwesomeIcon icon={faBolt} className="mr-2" /> ATTACK <FontAwesomeIcon icon={faBolt} className="ml-2" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-2xl leading-relaxed mb-10 max-w-2xl text-center whitespace-pre-line">
              {currentSceneData.text}
            </div>

            <div className="flex flex-wrap justify-center gap-3.5">
              {currentSceneData.choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleChoice(choice.nextScene)}
                  className="text-lg text-white bg-transparent border-2 border-blue-400 px-6 py-3 rounded-full cursor-pointer font-bold uppercase tracking-wide min-w-50 hover:bg-blue-400 hover:text-black transition-colors duration-300"
                >
                  {choice.text}
                </button>
              ))}
            </div>
          </>
        )}
        </div>

        <Link href="/code">
          <button className="absolute bottom-5 left-5 text-2xl text-white bg-transparent border-2 border-blue-400 px-10 py-5 rounded-full cursor-pointer font-bold uppercase tracking-wide font-mono hover:bg-blue-400 hover:text-black transition-colors duration-300">
            Make Your Own
          </button>
        </Link>
      </main>
    </>
  );
}

function HomeWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Home />
    </Suspense>
  );
}

export default HomeWrapper;