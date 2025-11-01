"use client";

import { useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Edge,
  Node,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpider } from '@fortawesome/free-solid-svg-icons';

function ColorPickerNode({ data }: { data: any }) {
  const { accentColor, title, spiders, onChange, onTitleChange, onSpidersChange } = data;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        background: '#1a1a1a',
        border: `2px solid ${accentColor}`,
        borderRadius: '8px',
        padding: '15px',
        color: 'white',
        fontFamily: "'Courier New', monospace",
        minWidth: '200px',
        maxWidth: '250px',
      }}
    >
      <div style={{
        fontSize: '16px',
        fontWeight: 'bold',
        marginBottom: '10px',
        color: accentColor
      }}>
        Theme Settings
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{
          fontSize: '12px',
          color: '#ccc',
          marginBottom: '5px'
        }}>
          Tab Title
        </div>
        <input
          type="text"
          value={title || 'My Adventure'}
          onChange={(e) => onTitleChange?.(e.target.value)}
          placeholder="Enter tab title..."
          style={{
            width: '100%',
            background: '#111',
            border: '1px solid #333',
            borderRadius: '4px',
            color: 'white',
            fontFamily: "'Courier New', monospace",
            fontSize: '12px',
            padding: '6px 8px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <div style={{
          fontSize: '12px',
          color: '#ccc',
          marginBottom: '5px'
        }}>
          Enable Spiders
        </div>
        <label
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: isHovered ? '#333' : '#2a2a2a',
            border: `1px solid ${isHovered ? '#555' : '#444'}`,
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{
            position: 'relative',
            width: '20px',
            height: '20px'
          }}>
            <input
              type="checkbox"
              checked={spiders || false}
              onChange={(e) => onSpidersChange?.(e.target.checked)}
              style={{
                position: 'absolute',
                opacity: 0,
                width: '100%',
                height: '100%',
                margin: 0,
                cursor: 'pointer'
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '20px',
              height: '20px',
              border: `2px solid ${spiders ? accentColor : '#666'}`,
              borderRadius: '4px',
              backgroundColor: spiders ? accentColor : 'transparent',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {spiders && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FontAwesomeIcon icon={faSpider} style={{ fontSize: '16px', color: '#ccc' }} />
            <span style={{ fontSize: '14px', color: '#ccc' }}>Enable Spiders</span>
          </div>
        </label>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="color"
          value={accentColor}
          onChange={(e) => onChange?.(e.target.value)}
          style={{
            width: '60px',
            height: '40px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            background: 'none',
            outline: 'none'
          }}
        />
        <div style={{
          fontSize: '12px',
          color: '#ccc',
          flex: 1
        }}>
          Click to change accent color
        </div>
      </div>
    </div>
  );
}

function SceneNode({ data, id, accentColor = '#61dafb' }: { data: any; id: string; accentColor?: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text || 'Enter scene text...');
  const [choices, setChoices] = useState(data.choices || []);

  const handleTextChange = (newText: string) => {
    setText(newText);
    data.onChange?.(id, { ...data, text: newText });
  };

  const addChoice = () => {
    const newChoices = [...choices, { text: 'New choice', nextScene: '' }];
    setChoices(newChoices);
    data.onChange?.(id, { ...data, choices: newChoices });
  };

  const updateChoice = (index: number, field: string, value: string) => {
    console.log('updateChoice', index, field, value);
    const newChoices = [...choices];
    newChoices[index] = { ...newChoices[index], [field]: value };
    setChoices(newChoices);
    data.onChange?.(id, { ...data, choices: newChoices });
  };

  const deleteChoice = (index: number) => {
    const newChoices = choices.filter((_: any, i: number) => i !== index);
    setChoices(newChoices);
    data.onChange?.(id, { ...data, choices: newChoices });
  };

  return (
    <div
      style={{
        background: '#1a1a1a',
        border: `2px solid ${accentColor}`,
        borderRadius: '8px',
        padding: '15px',
        color: 'white',
        fontFamily: "'Courier New', monospace",
        minWidth: '300px',
        maxWidth: '400px',
      }}
    >
      <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: accentColor }}>
        Scene: {id}
      </div>

      {isEditing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            setIsEditing(false);
            handleTextChange(text);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              setIsEditing(false);
              handleTextChange(text);
            }
          }}
          style={{
            width: '100%',
            background: '#111',
            border: '1px solid #333',
            borderRadius: '4px',
            color: 'white',
            fontFamily: "'Courier New', monospace",
            fontSize: '14px',
            padding: '8px',
            resize: 'vertical',
            minHeight: '60px',
          }}
          autoFocus
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          style={{
            cursor: 'pointer',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.4',
            marginBottom: '10px',
            minHeight: '40px',
          }}
        >
          {text || 'Click to edit scene text...'}
        </div>
      )}

      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={addChoice}
          style={{
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: "'Courier New', monospace",
          }}
        >
          + Add Choice
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {choices.map((choice: any, index: number) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input
              type="text"
              value={choice.text}
              onChange={(e) => updateChoice(index, 'text', e.target.value)}
              placeholder="Choice text"
              style={{
                flex: 1,
                background: '#111',
                border: '1px solid #333',
                borderRadius: '4px',
                color: 'white',
                fontFamily: "'Courier New', monospace",
                fontSize: '12px',
                padding: '4px 8px',
              }}
            />
            <input
              type="text"
              value={choice.nextScene}
              onChange={(e) => updateChoice(index, 'nextScene', e.target.value)}
              placeholder="Target scene"
              style={{
                flex: 1,
                background: '#111',
                border: '1px solid #333',
                borderRadius: '4px',
                color: 'white',
                fontFamily: "'Courier New', monospace",
                fontSize: '12px',
                padding: '4px 8px',
              }}
            />
            <button
              onClick={() => deleteChoice(index)}
              style={{
                background: '#f44336',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  sceneNode: SceneNode,
  colorPickerNode: ColorPickerNode,
};

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'sceneNode',
    position: { x: 250, y: 25 },
    data: {
      text: 'Welcome to your adventure!\n\nWhat do you want to do?',
      choices: [
        { text: 'Explore the forest', nextScene: 'forest' },
        { text: 'Enter the cave', nextScene: 'cave' }
      ]
    },
  },
  {
    id: 'color-picker',
    type: 'colorPickerNode',
    position: { x: 50, y: 25 },
    data: { title: 'My Adventure', spiders: false },
  },
];

const initialEdges: Edge[] = [];

export default function CodeEditor() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(2);
  const [accentColor, setAccentColor] = useState('#61dafb');
  const [tabTitle, setTabTitle] = useState('My Adventure');
  const [spiders, setSpiders] = useState(false);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const addNode = () => {
    const id = `scene${nodeIdCounter}`;
    setNodes((nds) => nds.concat({
      id,
      type: 'sceneNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { text: 'New scene text...', choices: [] },
    }));
    setNodeIdCounter(prev => prev + 1);
  };

  const startPlay = () => {
    const scenes: Record<string, any> = {};
    nodes.forEach(node => {
      scenes[node.id] = {
        text: node.data.text || '',
        choices: node.data.choices || []
      };
    });

    const data = encodeURIComponent(JSON.stringify(scenes));
    const color = encodeURIComponent(accentColor);
    const title = encodeURIComponent(tabTitle);
    const spiderParam = spiders ? '1' : '0';
    window.open(`/play?data=${data}&color=${color}&title=${title}&spiders=${spiderParam}`, '_blank');
  };

  const downloadAdventure = () => {
    const scenes: Record<string, any> = {};
    nodes.forEach(node => {
      scenes[node.id] = {
        text: node.data.text || '',
        choices: node.data.choices || []
      };
    });

    const scenesJson = JSON.stringify(scenes);
    const colorValue = accentColor;
    const titleValue = tabTitle;
    const spidersEnabled = spiders;

    // Create standalone HTML with embedded data and logic
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titleValue}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Courier New', monospace;
            background-color: black;
            color: white;
            min-height: 100vh;
        }

        .container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 40px;
            position: relative;
        }

        .text {
            font-size: 24px;
            line-height: 1.8;
            margin-bottom: 40px;
            max-width: 800px;
            text-align: center;
            white-space: pre-line;
        }

        .choices {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 15px;
        }

        .choice-btn {
            font-size: 18px;
            color: white;
            background-color: transparent;
            border: 2px solid ${colorValue};
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            min-width: 200px;
            transition: background-color 0.3s;
        }

        .choice-btn:hover {
            background-color: ${colorValue};
            color: black;
        }

        .error-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 40px;
        }

        .error-text {
            font-size: 24px;
            margin-bottom: 20px;
            text-align: center;
        }

        .retry-btn {
            background: ${colorValue};
            color: black;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            font-family: 'Courier New', monospace;
        }

        /* Spider/Bug animations */
        .bug {
            position: absolute;
            pointer-events: none;
            z-index: 1000;
            transition: all 0.1s linear;
        }

        .spider {
            position: absolute;
            pointer-events: none;
            z-index: 1000;
            transition: all 0.1s linear;
        }
    </style>
</head>
<body>
    <div id="app"></div>

    <script>
        // Embedded adventure data
        const SCENE_DATA = ${scenesJson};
        const ACCENT_COLOR = "${colorValue}";
        const TAB_TITLE = "${titleValue}";
        const SPIDERS_ENABLED = ${spidersEnabled};

        // Set document title
        document.title = TAB_TITLE;

        // Spider/Bug controller script (simplified version)
        class BugController {
            constructor(options = {}) {
                this.minBugs = options.minBugs || 3;
                this.maxBugs = options.maxBugs || 8;
                this.mouseOver = options.mouseOver || 'fly';
                this.canFly = options.canFly !== false;
                this.canDie = options.canDie !== false;
                this.zoom = options.zoom || 20;
                this.bugs = [];
                this.interval = null;
                this.mouseX = 0;
                this.mouseY = 0;
            }

            initialize() {
                this.createBugs();
                this.startAnimation();
                this.bindEvents();
            }

            createBugs() {
                const bugCount = Math.floor(Math.random() * (this.maxBugs - this.minBugs + 1)) + this.minBugs;
                for (let i = 0; i < bugCount; i++) {
                    this.createBug();
                }
            }

            createBug() {
                const bug = document.createElement('div');
                bug.className = 'bug';
                bug.innerHTML = '🐛';
                bug.style.fontSize = this.zoom + 'px';
                bug.style.left = Math.random() * (window.innerWidth - this.zoom) + 'px';
                bug.style.top = Math.random() * (window.innerHeight - this.zoom) + 'px';
                bug.dataset.vx = (Math.random() - 0.5) * 4;
                bug.dataset.vy = (Math.random() - 0.5) * 4;
                document.body.appendChild(bug);
                this.bugs.push(bug);
            }

            startAnimation() {
                this.interval = setInterval(() => {
                    this.bugs.forEach(bug => {
                        let x = parseFloat(bug.style.left);
                        let y = parseFloat(bug.style.top);
                        let vx = parseFloat(bug.dataset.vx);
                        let vy = parseFloat(bug.dataset.vy);

                        // Update position
                        x += vx;
                        y += vy;

                        // Bounce off walls
                        if (x <= 0 || x >= window.innerWidth - this.zoom) {
                            vx = -vx;
                            bug.dataset.vx = vx;
                        }
                        if (y <= 0 || y >= window.innerHeight - this.zoom) {
                            vy = -vy;
                            bug.dataset.vy = vy;
                        }

                        bug.style.left = x + 'px';
                        bug.style.top = y + 'px';
                    });
                }, 50);
            }

            bindEvents() {
                document.addEventListener('mousemove', (e) => {
                    this.mouseX = e.clientX;
                    this.mouseY = e.clientY;
                });
            }

            end() {
                if (this.interval) {
                    clearInterval(this.interval);
                }
                this.bugs.forEach(bug => {
                    if (bug.parentNode) {
                        bug.parentNode.removeChild(bug);
                    }
                });
                this.bugs = [];
            }
        }

        class SpiderController {
            constructor(options = {}) {
                this.minDelay = options.minDelay || 0;
                this.maxDelay = options.maxDelay || 3000;
                this.minBugs = options.minBugs || 2;
                this.maxBugs = options.maxBugs || 4;
                this.mouseOver = options.mouseOver || 'random';
                this.canFly = options.canFly !== false;
                this.canDie = options.canDie !== false;
                this.zoom = options.zoom || 15;
                this.spiders = [];
                this.interval = null;
            }

            initialize() {
                this.createSpiders();
                this.startAnimation();
            }

            createSpiders() {
                const spiderCount = Math.floor(Math.random() * (this.maxBugs - this.minBugs + 1)) + this.minBugs;
                for (let i = 0; i < spiderCount; i++) {
                    this.createSpider();
                }
            }

            createSpider() {
                const spider = document.createElement('div');
                spider.className = 'spider';
                spider.innerHTML = '🕷️';
                spider.style.fontSize = this.zoom + 'px';
                spider.style.left = Math.random() * (window.innerWidth - this.zoom) + 'px';
                spider.style.top = Math.random() * (window.innerHeight - this.zoom) + 'px';
                spider.dataset.vx = (Math.random() - 0.5) * 2;
                spider.dataset.vy = (Math.random() - 0.5) * 2;
                document.body.appendChild(spider);
                this.spiders.push(spider);
            }

            startAnimation() {
                this.interval = setInterval(() => {
                    this.spiders.forEach(spider => {
                        let x = parseFloat(spider.style.left);
                        let y = parseFloat(spider.style.top);
                        let vx = parseFloat(spider.dataset.vx);
                        let vy = parseFloat(spider.dataset.vy);

                        x += vx;
                        y += vy;

                        // Bounce off walls
                        if (x <= 0 || x >= window.innerWidth - this.zoom) {
                            vx = -vx;
                            spider.dataset.vx = vx;
                        }
                        if (y <= 0 || y >= window.innerHeight - this.zoom) {
                            vy = -vy;
                            spider.dataset.vy = vy;
                        }

                        spider.style.left = x + 'px';
                        spider.style.top = y + 'px';
                    });
                }, 100);
            }

            end() {
                if (this.interval) {
                    clearInterval(this.interval);
                }
                this.spiders.forEach(spider => {
                    if (spider.parentNode) {
                        spider.parentNode.removeChild(spider);
                    }
                });
                this.spiders = [];
            }
        }

        // React-like component for the adventure
        class AdventureApp {
            constructor() {
                this.currentScene = 'start';
                this.container = document.getElementById('app');
                this.bugController = null;
                this.spiderController = null;
                this.render();
                this.initializeEffects();
            }

            initializeEffects() {
                if (SPIDERS_ENABLED) {
                    this.spiderController = new SpiderController({
                        minDelay: 0,
                        maxDelay: 3000,
                        minBugs: 2,
                        maxBugs: 4,
                        mouseOver: 'random',
                        canFly: false,
                        canDie: false,
                        zoom: 15
                    });
                    this.spiderController.initialize();

                    this.bugController = new BugController({
                        minBugs: 3,
                        maxBugs: 8,
                        mouseOver: 'fly',
                        canFly: true,
                        canDie: false,
                        zoom: 20
                    });
                    this.bugController.initialize();
                }
            }

            handleChoice(nextScene) {
                if (nextScene === 'make_your_own') {
                    window.location.href = 'https://textadventure-creator.vercel.app/code';
                    return;
                }
                if (nextScene === 'go_home') {
                    window.location.href = 'https://textadventure-creator.vercel.app/';
                    return;
                }
                this.currentScene = nextScene;
                this.render();
            }

            render() {
                const sceneData = SCENE_DATA[this.currentScene];

                if (!sceneData) {
                    this.container.innerHTML = \`
                        <div class="error-container">
                            <div class="error-text">Scene "\${this.currentScene}" not found!</div>
                            <button class="retry-btn" onclick="app.handleChoice('start')">Return to Start</button>
                        </div>
                    \`;
                    return;
                }

                const choicesHtml = sceneData.choices.map((choice, index) => \`
                    <button class="choice-btn" onclick="app.handleChoice('\${choice.nextScene}')">
                        \${choice.text}
                    </button>
                \`).join('');

                this.container.innerHTML = \`
                    <div class="container">
                        <div class="text">\${sceneData.text}</div>
                        <div class="choices">\${choicesHtml}</div>
                    </div>
                \`;
            }
        }

        let app;
        document.addEventListener('DOMContentLoaded', () => {
            app = new AdventureApp();
        });

        window.addEventListener('beforeunload', () => {
            if (app && app.spiderController) {
                app.spiderController.end();
            }
            if (app && app.bugController) {
                app.bugController.end();
            }
        });
    </script>
</body>
</html>`;

    // Create and trigger download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tabTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_adventure.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const nodeTypesWithCallbacks = useMemo(() => ({
    sceneNode: (props: any) => (
      <SceneNode
        {...props}
        accentColor={accentColor}
        data={{
          ...props.data,
          onChange: (nodeId: string, newData: any) => {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === nodeId ? { ...node, data: newData } : node
              )
            );
          }
        }}
      />
    ),
    colorPickerNode: (props: any) => (
      <ColorPickerNode
        {...props}
        data={{
          ...props.data,
          accentColor,
          title: tabTitle,
          spiders,
          onChange: (newColor: string) => {
            setAccentColor(newColor);
          },
          onTitleChange: (newTitle: string) => {
            setTabTitle(newTitle);
          },
          onSpidersChange: (newSpiders: boolean) => {
            setSpiders(newSpiders);
          }
        }}
      />
    ),
  }), [setNodes, accentColor, tabTitle, spiders]);

  return (
    <div style={{ height: '100vh', backgroundColor: '#000' }}>
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 10,
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={addNode}
          style={{
            background: accentColor,
            color: 'black',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontFamily: "'Courier New', monospace",
          }}
        >
          + Add Scene
        </button>
        <button
          onClick={startPlay}
          style={{
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontFamily: "'Courier New', monospace",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '8px'}}><path d="M8 5v14l11-7z" fill="currentColor"/></svg>Play Adventure
        </button>
        <button
          onClick={downloadAdventure}
          style={{
            background: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontFamily: "'Courier New', monospace",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '8px'}}><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/></svg>Download HTML
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypesWithCallbacks}
        fitView
        style={{ backgroundColor: '#000' }}
      >
        <Controls style={{ backgroundColor: '#1a1a1a', border: `1px solid ${accentColor}` }} />
        <Background color="#333" gap={16} />
      </ReactFlow>
    </div>
  );
}
