"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const [started, setStarted] = useState(false);
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
    // Load bug script and initialize bugs
    const script = document.createElement('script');
    script.src = '/bug.js';
    script.onload = () => {
      // Initialize bugs after script loads
      if (typeof window !== 'undefined' && (window as any).BugController) {
        new (window as any).BugController({
          minBugs: 3,
          maxBugs: 8,
          mouseOver: 'fly',
          canFly: true,
          canDie: false,
          zoom: 20
        });

        new (window as any).SpiderController({
          minDelay: 0,
          maxDelay: 3000,
          minBugs: 2,
          maxBugs: 4,
          mouseOver: 'random',
          canFly: false,
          canDie: false,
          zoom: 15
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup script when component unmounts
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
      startBattle('Shadow Wraith', 75);
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

      <main
        style={{
          height: "100vh",
          backgroundColor: "black",
          color: "white",
          fontFamily: "'Courier New', monospace",
          position: "relative",
          padding: "40px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
            minHeight: "100vh",
        }}
      >
        {battle.inBattle ? (
          <div style={{ maxWidth: "900px", width: "100%" }}>
            <div
              style={{
                fontSize: "28px",
                lineHeight: "1.6",
                marginBottom: "30px",
                textAlign: "center",
                color: "#ff6b6b",
              }}
            >
              ⚔️ BATTLE: {battle.enemyName.toUpperCase()} ⚔️
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
              <div
                style={{
                  padding: "20px",
                  border: "2px solid #4CAF50",
                  borderRadius: "8px",
                  backgroundColor: "black",
                }}
              >
                <div style={{ fontSize: "20px", marginBottom: "10px" }}>🛡️ PLAYER</div>
                <div style={{ fontSize: "18px" }}>HP: {battle.playerHealth}/100</div>
                <div style={{ width: "200px", height: "10px", backgroundColor: "#333", borderRadius: "5px", marginTop: "5px" }}>
                  <div
                    style={{
                      width: `${(battle.playerHealth / 100) * 100}%`,
                      height: "100%",
                      backgroundColor: "#4CAF50",
                      borderRadius: "5px",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: "20px",
                  border: "2px solid #f44336",
                  borderRadius: "8px",
                  backgroundColor: "black",
                }}
              >
                <div style={{ fontSize: "20px", marginBottom: "10px" }}>👹 {battle.enemyName.toUpperCase()}</div>
                <div style={{ fontSize: "18px" }}>HP: {battle.enemyHealth}/{battle.enemyMaxHealth}</div>
                <div style={{ width: "200px", height: "10px", backgroundColor: "#333", borderRadius: "5px", marginTop: "5px" }}>
                  <div
                    style={{
                      width: `${(battle.enemyHealth / battle.enemyMaxHealth) * 100}%`,
                      height: "100%",
                      backgroundColor: "#f44336",
                      borderRadius: "5px",
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "black",
                padding: "20px",
                borderRadius: "8px",
                marginBottom: "30px",
                minHeight: "120px",
                fontSize: "16px",
                lineHeight: "1.6",
              }}
            >
              {battle.battleLog.map((log, index) => (
                <div key={index} style={{ marginBottom: "5px" }}>
                  {log}
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center" }}>
              <button
                onClick={playerAttack}
                disabled={battle.turn !== 'player' || battle.enemyHealth <= 0}
                style={{
                  fontSize: "20px",
                  color: "white",
                  backgroundColor: battle.turn === 'player' && battle.enemyHealth > 0 ? "#2196F3" : "#666",
                  border: "none",
                  padding: "15px 30px",
                  borderRadius: "8px",
                  cursor: battle.turn === 'player' && battle.enemyHealth > 0 ? "pointer" : "not-allowed",
                  fontWeight: "bold",
                }}
              >
                ⚔️ ATTACK ⚔️
              </button>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
        </div>

        <Link href="/code">
          <button
            style={{
              position: "absolute",
              bottom: "20px",
              left: "20px",
              fontSize: "16px",
              color: "white",
              backgroundColor: "transparent",
              border: "2px solid #61dafb",
              padding: "10px 20px",
              borderRadius: "25px",
              cursor: "pointer",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "1px",
              fontFamily: "'Courier New', monospace",
            }}
          >
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