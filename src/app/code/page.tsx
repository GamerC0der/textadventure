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
import { faSpider, faPlus, faFileCode, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { GiSpiderAlt } from 'react-icons/gi';

const NODE_MIN_WIDTH = 200;
const NODE_MAX_WIDTH = 250;
const INPUT_HEIGHT = 40;

// Custom Color Picker Component
function CustomColorPicker({ color, onChange }: { color: string; onChange: (color: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  // Convert RGB to hex
  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  // Generate hue colors for the picker
  const getHueColors = () => {
    const colors = [];
    for (let i = 0; i <= 360; i += 10) {
      colors.push(`hsl(${i}, 100%, 50%)`);
    }
    return colors;
  };

  const selectHue = (hueIndex: number) => {
    const hue = hueIndex * 10;
    const rgb = hexToRgb(color);
    // Convert RGB to HSL, change hue, convert back
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    const s = max === 0 ? 0 : (max - min) / max;
    const l = (max + min) / 2;

    // Set new hue, keep saturation and lightness
    const newRgb = hslToRgb(hue / 360, s, l);
    onChange(rgbToHex(Math.round(newRgb.r * 255), Math.round(newRgb.g * 255), Math.round(newRgb.b * 255)));
  };

  const hslToRgb = (h: number, s: number, l: number) => {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r, g, b };
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded border-2 cursor-pointer"
        style={{ backgroundColor: color, borderColor: color }}
        title="Click to change color"
      />
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-gray-800 border border-gray-600 rounded shadow-lg z-50">
          <div className="grid grid-cols-6 gap-1 mb-2">
            {getHueColors().map((hueColor, index) => (
              <button
                key={index}
                onClick={() => selectHue(index)}
                className="w-6 h-6 rounded border border-gray-500 hover:border-white transition-colors"
                style={{ backgroundColor: hueColor }}
                title={`Hue ${index * 10}°`}
              />
            ))}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-full text-xs text-gray-400 hover:text-white py-1 border-t border-gray-600"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

function ColorPickerNode({ data }: { data: any }) {
  const { accentColor, title, spiders, onChange, onTitleChange, onSpidersChange } = data;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="bg-gray-900 border-2 rounded-lg p-3.75 text-white " style={{ borderColor: accentColor, minWidth: NODE_MIN_WIDTH, maxWidth: NODE_MAX_WIDTH }}>
      <div className="text-base font-bold mb-2.5" style={{ color: accentColor }}>
        Theme Settings
      </div>

      <div className="mb-3.75">
        <div className="text-xs text-gray-400 mb-1.25">
          Tab Title
        </div>
        <input
          type="text"
          value={title || 'My Adventure'}
          onChange={(e) => onTitleChange?.(e.target.value)}
          placeholder="Enter tab title..."
          className="w-full bg-gray-800 border border-gray-600 rounded text-white  text-xs px-2 py-1.5 box-border"
        />
      </div>

      <div className="mb-3.75">
        <div className="text-xs text-gray-400 mb-1.25">
          Enable Spiders
        </div>
        <label
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`flex items-center gap-3 cursor-pointer p-2 rounded border transition-all duration-200 ${
            isHovered ? 'bg-gray-700 border-gray-500' : 'bg-gray-800 border-gray-600'
          }`}
        >
          <div className="relative w-5 h-5">
            <input
              type="checkbox"
              checked={spiders || false}
              onChange={(e) => onSpidersChange?.(e.target.checked)}
              className="absolute opacity-0 w-full h-full m-0 cursor-pointer"
            />
            <div className={`absolute top-0 left-0 w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200 ${
              spiders ? '' : 'border-gray-500 bg-transparent'
            }`} style={{ borderColor: spiders ? accentColor : '', backgroundColor: spiders ? accentColor : 'transparent' }}>
              {spiders && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GiSpiderAlt className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Enable Spiders</span>
          </div>
        </label>
      </div>

      <div className="mb-3.75">
        <div className="text-xs text-gray-400 mb-1.25">
          Accent Color
        </div>
        <div className="mb-2.5">
          <CustomColorPicker
            color={accentColor}
            onChange={onChange}
          />
        </div>
      </div>
    </div>
  );
}

function TutorialNode({ data }: { data: any }) {
  const accentColor = data.accentColor || '#f97316';
  return (
    <div className="bg-blue-900 border-2 rounded-lg p-3.75 text-white  min-w-50 max-w-62.5" style={{ borderColor: accentColor }}>
      <div className="text-base font-bold mb-2.5" style={{ color: accentColor }}>
        📚 Tutorial
      </div>

      <div className="text-sm text-blue-200 leading-relaxed">
        Scene names are case-sensitive, all lowercase. Change forest/cave to your scene names.
      </div>
    </div>
  );
}

function NoteNode({ data, id, accentColor = '#f97316' }: { data: any; id: string; accentColor?: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text || '');

  const handleTextChange = (newText: string) => {
    setText(newText);
    data.onChange?.(id, { ...data, text: newText });
  };

  return (
    <div className="bg-yellow-900 border-2 rounded-lg p-3.75 text-white  min-w-50 max-w-62.5" style={{ borderColor: accentColor }}>
      <div className="text-base font-bold mb-2.5" style={{ color: accentColor }}>
        📝 Note: {id}
      </div>

      <div className="text-xs text-yellow-200 mb-2.5 italic">
        Notes help you organize your adventure design. They don't appear in the final game.
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
          className="w-full bg-yellow-800 border border-yellow-600 rounded text-white  text-sm p-2 resize-vertical min-h-20"
          placeholder="Write your note here..."
          autoFocus
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="cursor-pointer whitespace-pre-wrap leading-relaxed min-h-15 text-sm"
        >
          {text || 'Click to add a note...'}
        </div>
      )}
    </div>
  );
}

function SceneNode({ data, id, accentColor = '#f97316' }: { data: any; id: string; accentColor?: string }) {
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
    <div className="bg-gray-900 border-2 rounded-lg p-3.75 text-white  min-w-75 max-w-100" style={{ borderColor: accentColor }}>
      <div className="text-base font-bold mb-2.5" style={{ color: accentColor }}>
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
          className="w-full bg-gray-800 border border-gray-600 rounded text-white  text-sm p-2 resize-vertical min-h-15"
          autoFocus
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="cursor-pointer whitespace-pre-wrap leading-relaxed mb-2.5 min-h-10"
        >
          {text || 'Click to edit scene text...'}
        </div>
      )}

      <div className="mb-2.5">
        <button
          onClick={addChoice}
          className="bg-green-500 text-white border-none px-2.5 py-1.25 rounded cursor-pointer text-xs "
        >
          <FontAwesomeIcon icon={faPlus} className="mr-1" /> Add Choice
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {choices.map((choice: any, index: number) => (
          <div key={index} className="flex items-center gap-1.25">
            <input
              type="text"
              value={choice.text}
              onChange={(e) => updateChoice(index, 'text', e.target.value)}
              placeholder="Choice text"
              className="flex-1 bg-gray-800 border border-gray-600 rounded text-white  text-xs px-2 py-1"
            />
            <input
              type="text"
              value={choice.nextScene}
              onChange={(e) => updateChoice(index, 'nextScene', e.target.value)}
              placeholder="Target scene"
              className="flex-1 bg-gray-800 border border-gray-600 rounded text-white  text-xs px-2 py-1"
            />
            <button
              onClick={() => deleteChoice(index)}
              className="bg-red-500 text-white border-none px-2 py-1 rounded cursor-pointer text-xs"
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
  tutorialNode: TutorialNode,
  noteNode: NoteNode,
};

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'sceneNode',
    position: { x: 250, y: 25 },
    data: {
      text: 'Welcome to your adventure! Click to change your text...',
      choices: []
    },
  },
  {
    id: 'color-picker',
    type: 'colorPickerNode',
    position: { x: -18, y: 25 },
    data: { title: 'My Adventure', spiders: false },
  },
  {
    id: 'tutorial',
    type: 'tutorialNode',
    position: { x: -18, y: 442 },
    data: {},
    draggable: false,
  },
];

const initialEdges: Edge[] = [];

export default function CodeEditor() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  const [accentColor, setAccentColor] = useState('#f97316');
  const [tabTitle, setTabTitle] = useState('My Adventure');
  const [spiders, setSpiders] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);

  const hasThemeSettingsNode = nodes.some(node => node.type === 'colorPickerNode');

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

  const addBattleNode = () => {
    const id = `battle${nodeIdCounter}`;
    setNodes((nds) => nds.concat({
      id,
      type: 'sceneNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: {
        text: '⚡ A fierce battle begins! ⚡\n\nYou encounter a powerful enemy. What do you do?',
        choices: [
          { text: '⚔️ Attack with all your might!', nextScene: '' },
          { text: '🛡️ Defend and wait for an opening', nextScene: '' },
          { text: '🏃‍♂️ Try to flee from the battle', nextScene: '' }
        ],
        battle: {
          enabled: true,
          enemyName: 'Mighty Warrior',
          enemyHealth: 80
        }
      },
    }));
    setNodeIdCounter(prev => prev + 1);
  };

  const addNoteNode = () => {
    const id = `note${nodeIdCounter}`;
    setNodes((nds) => nds.concat({
      id,
      type: 'noteNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { text: '' },
    }));
    setNodeIdCounter(prev => prev + 1);
  };

  const addThemeSettingsNode = () => {
    const id = `theme${nodeIdCounter}`;
    setNodes((nds) => nds.concat({
      id,
      type: 'colorPickerNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: { title: tabTitle, spiders: spiders },
    }));
    setNodeIdCounter(prev => prev + 1);
  };

  const startPlay = () => {
    const scenes: Record<string, any> = {};
    nodes.forEach(node => {
      if (node.type === 'noteNode' || node.type === 'tutorialNode') return;
      scenes[node.id] = {
        text: node.data.text || '',
        choices: node.data.choices || [],
        battle: node.data.battle || undefined
      };
    });

    const data = encodeURIComponent(JSON.stringify(scenes));
    const color = encodeURIComponent(accentColor);
    const title = encodeURIComponent(tabTitle);
    const spiderParam = spiders ? '1' : '0';
    window.open(`/play?data=${data}&color=${color}&title=${title}&spiders=${spiderParam}`, '_blank');
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleClick = () => {
    setContextMenu(null);
    setAddDropdownOpen(false);
  };

  const clearAll = () => {
    setNodes([initialNodes[1]]);
    setEdges([]);
    setNodeIdCounter(1);
    setContextMenu(null);
  };

  const downloadAdventure = () => {
    const scenes: Record<string, any> = {};
    nodes.forEach(node => {
      if (node.type === 'noteNode' || node.type === 'tutorialNode') return;
      scenes[node.id] = {
        text: node.data.text || '',
        choices: node.data.choices || [],
        battle: node.data.battle || undefined
      };
    });

    const scenesJson = JSON.stringify(scenes);
    const colorValue = accentColor;
    const titleValue = tabTitle;
    const spidersEnabled = spiders;
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
        const SCENE_DATA = ${scenesJson};
        const ACCENT_COLOR = "${colorValue}";
        const TAB_TITLE = "${titleValue}";
        const SPIDERS_ENABLED = ${spidersEnabled};
        document.title = TAB_TITLE;
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
                        x += vx;
                        y += vy;
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
    noteNode: (props: any) => (
      <NoteNode
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
    tutorialNode: (props: any) => (
      <TutorialNode
        {...props}
        data={{
          ...props.data,
          accentColor,
        }}
      />
    ),
  }), [setNodes, accentColor, tabTitle, spiders]);

  return (
    <div className="h-screen bg-black" onContextMenu={handleContextMenu} onClick={handleClick}>
      {contextMenu && (
        <div
          className="absolute z-50 bg-gray-800 border rounded shadow-lg py-1"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            borderColor: accentColor,
            minWidth: '150px'
          }}
        >
          <button
            onClick={() => { addNode(); setContextMenu(null); }}
            className="w-full text-left px-3 py-2 text-white hover:bg-gray-700  text-sm"
          >
            + Add Scene
          </button>
          <button
            onClick={() => { addBattleNode(); setContextMenu(null); }}
            className="w-full text-left px-3 py-2 text-white hover:bg-gray-700  text-sm"
          >
            ⚔️ Add Battle
          </button>
          <button
            onClick={() => { addNoteNode(); setContextMenu(null); }}
            className="w-full text-left px-3 py-2 text-white hover:bg-gray-700  text-sm"
          >
            📝 Add Note
          </button>
          {!hasThemeSettingsNode && (
            <button
              onClick={() => { addThemeSettingsNode(); setContextMenu(null); }}
              className="w-full text-left px-3 py-2 text-white hover:bg-gray-700  text-sm"
            >
              Add Themes
            </button>
          )}
          <button
            onClick={() => { startPlay(); setContextMenu(null); }}
            className="w-full text-left px-3 py-2 text-white hover:bg-gray-700  text-sm"
          >
            ▶ Play Adventure
          </button>
          <button
            onClick={() => { downloadAdventure(); setContextMenu(null); }}
            className="w-full text-left px-3 py-2 text-white hover:bg-gray-700  text-sm"
          >
            ⬇ Download HTML
          </button>
          <div className="border-t border-gray-600 my-1"></div>
          <button
            onClick={clearAll}
            className="w-full text-left px-3 py-2 text-red-400 hover:bg-gray-700  text-sm"
          >
            🗑 Clear All
          </button>
        </div>
      )}
      <div className="absolute top-2.5 left-2.5 z-10">
        <button
          onClick={() => router.back()}
          className="text-white border border-gray-600 px-4 py-2 rounded-xl cursor-pointer font-bold "
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Back
        </button>
      </div>
      <div className="absolute top-2.5 right-2.5 z-10 flex gap-2.5">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAddDropdownOpen(!addDropdownOpen);
            }}
            className="bg-gray-700 text-white border border-gray-600 px-4 py-2 rounded-xl cursor-pointer font-bold  hover:bg-gray-600"
          >
            Add ▼
          </button>
          {addDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded-xl shadow-lg py-1 min-w-40 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addNode();
                  setAddDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-white hover:bg-gray-700  text-sm"
              >
                + Scene
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addBattleNode();
                  setAddDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-white hover:bg-gray-700  text-sm"
              >
                Battle
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addNoteNode();
                  setAddDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-white hover:bg-gray-700  text-sm"
              >
                Note
              </button>
              {!hasThemeSettingsNode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addThemeSettingsNode();
                    setAddDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-white hover:bg-gray-700  text-sm"
                >
                  Themes
                </button>
              )}
            </div>
          )}
        </div>
        <button
          onClick={startPlay}
          className="text-white border-2 border-gray-600 px-4 py-2 rounded cursor-pointer font-bold bg-black"
        >
Test Game
        </button>
        <button
          onClick={downloadAdventure}
          className="text-white border-2 border-gray-600 px-4 py-2 rounded cursor-pointer font-bold bg-black"
        >
          <FontAwesomeIcon icon={faFileCode} className="mr-2" />Download HTML
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
        className="bg-black"
      >
        <Controls className="bg-gray-900 border" style={{ borderColor: accentColor }} />
        <Background color="#333" gap={16} />
      </ReactFlow>
    </div>
  );
}
