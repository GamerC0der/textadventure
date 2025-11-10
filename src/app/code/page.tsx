"use client";

import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, {
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Background,
  Edge,
  Node,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpider, faPlus, faFileCode, faArrowLeft, faPlusCircle, faNoteSticky, faBook, faMinus, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { GiSpiderAlt } from 'react-icons/gi';

const NODE_MIN_WIDTH = 200;
const NODE_MAX_WIDTH = 250;
const INPUT_HEIGHT = 40;

function CustomColorPicker({ color, onChange }: { color: string; onChange: (color: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

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
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    const s = max === 0 ? 0 : (max - min) / max;
    const l = (max + min) / 2;

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
    <div className="bg-gray-900 border-2 rounded-xl p-4 text-white shadow-lg" style={{ borderColor: accentColor, minWidth: NODE_MIN_WIDTH, maxWidth: NODE_MAX_WIDTH }}>
      <div className="text-lg font-bold mb-3" style={{ color: accentColor }}>
        Theme Settings
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-300 mb-2">
          Tab Title
        </div>
        <input
          type="text"
          value={title || 'My Adventure'}
          onChange={(e) => onTitleChange?.(e.target.value)}
          placeholder="Enter tab title..."
          className="w-full bg-gray-700 border border-gray-500 rounded-lg text-white text-sm px-3 py-2 box-border"
        />
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-300 mb-2">
          Enable Spiders
        </div>
        <label
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`flex items-center gap-4 cursor-pointer p-3 rounded-lg border transition-all duration-200 ${
            isHovered ? 'bg-gray-600 border-gray-400' : 'bg-gray-700 border-gray-500'
          }`}
        >
          <div className="relative w-6 h-6">
            <input
              type="checkbox"
              checked={spiders || false}
              onChange={(e) => onSpidersChange?.(e.target.checked)}
              className="absolute opacity-0 w-full h-full m-0 cursor-pointer"
            />
            <div className={`absolute top-0 left-0 w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 ${
              spiders ? '' : 'border-gray-400 bg-transparent'
            }`} style={{ borderColor: spiders ? accentColor : '', backgroundColor: spiders ? accentColor : 'transparent' }}>
              {spiders && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="animate-checkmark-pop"
                  style={{
                    animation: 'checkmarkPop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                  }}
                >
                  <path d="M20 6L9 17L4 12" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GiSpiderAlt className="w-5 h-5 text-gray-300" />
            <span className="text-sm text-gray-300">Enable Spiders</span>
          </div>
        </label>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-300 mb-2">
          Accent Color
        </div>
        <div className="mb-3">
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
    <div className="bg-blue-900 border-2 rounded-xl p-4 text-white min-w-50 max-w-62.5 shadow-lg" style={{ borderColor: accentColor }}>
      <div className="text-lg font-bold mb-3" style={{ color: accentColor }}>
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
    <div className="bg-gray-900 border-2 rounded-xl p-4 text-white shadow-lg" style={{ borderColor: accentColor, minWidth: NODE_MIN_WIDTH, maxWidth: NODE_MAX_WIDTH }}>
      <div className="text-lg font-bold mb-3" style={{ color: accentColor }}>
        <FontAwesomeIcon icon={faNoteSticky} className="mr-2" />
        Note: {id}
      </div>

      <div className="text-xs text-gray-300 mb-2.5 italic">
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
          className="w-full bg-gray-700 border border-gray-500 rounded text-white text-sm p-2 resize-vertical min-h-20"
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

const SceneNode = ({ data, id, accentColor = '#f97316' }: { data: any; id: string; accentColor?: string }) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(data.text || 'Enter scene text...');
  const [choices, setChoices] = useState(data.choices || []);
  const [enemyName, setEnemyName] = useState(data.battle?.enemyName || 'Mighty Warrior');
  const [enemyHealth, setEnemyHealth] = useState(data.battle?.enemyHealth || 80);
  const [defendEnabled, setDefendEnabled] = useState(data.battle?.defendEnabled ?? true);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [attackMin, setAttackMin] = useState(data.battle?.attackDamageMin || 10);
  const [attackMax, setAttackMax] = useState(data.battle?.attackDamageMax || 20);

  useEffect(() => {
    if (data.battle && (!data.battle.attackDamageMin || !data.battle.attackDamageMax)) {
      updateData({ battle: { ...data.battle, attackDamageMin: data.battle.attackDamageMin || attackMin, attackDamageMax: data.battle.attackDamageMax || attackMax } });
    }
  }, []);

  const updateData = (updates: any) => data.onChange?.(id, { ...data, ...updates });

  return (
    <div className="bg-gray-900 border-2 rounded-xl p-3 text-white min-w-75 max-w-100 shadow-lg" style={{ borderColor: accentColor }}>
      <div className="text-xl font-bold mb-4" style={{ color: accentColor }}>Scene: {id}</div>

      {!data.battle && (editing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => { setEditing(false); updateData({ text }); }}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), setEditing(false), updateData({ text }))}
          className="w-full bg-gray-700 border border-gray-500 rounded-lg text-white text-sm p-3 resize-none min-h-24"
          autoFocus
        />
      ) : (
        <div onClick={() => setEditing(true)} className="cursor-pointer whitespace-pre-wrap mb-4 min-h-20 p-2 rounded hover:bg-gray-700 transition-colors">
          {text && text.trim() ? text : 'Click to edit scene text...'}
        </div>
      ))}

      {data.battle ? (
        <div className="mb-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Enemy Name</label>
              <input
                type="text"
                value={enemyName}
                onChange={(e) => {
                  setEnemyName(e.target.value);
                  updateData({
                    battle: {
                      ...data.battle,
                      enemyName: e.target.value
                    }
                  });
                }}
                placeholder="Enter enemy name..."
                className="w-full bg-gray-700 border border-gray-500 rounded-lg text-white text-sm px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Enemy Health</label>
              <input
                type="number"
                value={enemyHealth}
                onChange={(e) => {
                  const health = parseInt(e.target.value) || 0;
                  setEnemyHealth(health);
                  updateData({
                    battle: {
                      ...data.battle,
                      enemyHealth: health
                    }
                  });
                }}
                placeholder="Enter enemy health..."
                min="1"
                className="w-full bg-gray-700 border border-gray-500 rounded-lg text-white text-sm px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Enable Defend Option
              </label>
              <label
                onMouseEnter={() => {}}
                onMouseLeave={() => {}}
                className="flex items-center gap-4 cursor-pointer p-3 rounded-lg border transition-all duration-200 bg-gray-700 border-gray-500"
              >
                <div className="relative w-6 h-6">
                  <input
                    type="checkbox"
                    checked={defendEnabled}
                    onChange={(e) => {
                      setDefendEnabled(e.target.checked);
                      updateData({
                        battle: {
                          ...data.battle,
                          defendEnabled: e.target.checked
                        }
                      });
                    }}
                    className="absolute opacity-0 w-full h-full m-0 cursor-pointer"
                  />
                  <div className={`absolute top-0 left-0 w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    defendEnabled ? '' : 'border-gray-400 bg-transparent'
                  }`} style={{ borderColor: defendEnabled ? accentColor : '', backgroundColor: defendEnabled ? accentColor : 'transparent' }}>
                    {defendEnabled && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="animate-checkmark-pop"
                        style={{
                          animation: 'checkmarkPop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                        }}
                      >
                        <path d="M20 6L9 17L4 12" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-300">Enable Defend</span>
                </div>
              </label>
            </div>
            <div className="mt-4">
              <button onClick={() => setAdvancedOpen(!advancedOpen)} className="w-full text-left text-sm text-gray-300 hover:text-white py-1 border-t border-gray-600">Advanced Options {advancedOpen ? '▼' : '▶'}</button>
              {advancedOpen && <div className="mt-3 space-y-2">
                <div><label className="text-sm text-gray-300">Min Attack:</label><input type="range" min="1" max="50" value={attackMin} onChange={(e) => { const val = parseInt(e.target.value); setAttackMin(val); if (attackMax < val) setAttackMax(val); updateData({ battle: { ...data.battle, attackDamageMin: val, attackDamageMax: Math.max(attackMax, val) } }); }} className="w-full"/><span className="text-xs text-gray-400 ml-2">{attackMin}</span></div>
                <div><label className="text-sm text-gray-300">Max Attack:</label><input type="range" min="1" max="50" value={attackMax} onChange={(e) => { const val = Math.max(parseInt(e.target.value), attackMin); setAttackMax(val); updateData({ battle: { ...data.battle, attackDamageMin: attackMin, attackDamageMax: val } }); }} className="w-full"/><span className="text-xs text-gray-400 ml-2">{attackMax}</span></div>
              </div>}
            </div>
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={() => { const newChoices = [...choices, { text: 'New choice', nextScene: '' }]; setChoices(newChoices); updateData({ choices: newChoices }); }}
            className="bg-gray-800 text-white border border-gray-600 px-3 py-2 rounded cursor-pointer text-sm hover:bg-gray-700 mb-3"
          >
            <svg className="w-4 h-4 mr-2 inline" viewBox="0 0 512 512" fill="currentColor"><path d="M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM232 344l0-64-64 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l64 0 0-64c0-13.3 10.7-24 24-24s24 10.7 24 24l0 64 64 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-64 0 0 64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"></path></svg>Add Choice
          </button>

          <div className="space-y-3">
            {choices.map((choice: any, i: number) => (
              <div key={i} className="flex gap-3 items-center">
                <input value={choice.text} onChange={(e) => { const newChoices = [...choices]; newChoices[i].text = e.target.value; setChoices(newChoices); updateData({ choices: newChoices }); }} placeholder="Choice text" className="flex-1 bg-gray-700 border border-gray-500 rounded-lg text-white text-xs p-3" />
                <input value={choice.nextScene} onChange={(e) => { const newChoices = [...choices]; newChoices[i].nextScene = e.target.value; setChoices(newChoices); updateData({ choices: newChoices }); }} placeholder="Target scene" className="flex-1 bg-gray-700 border border-gray-500 rounded-lg text-white text-xs p-3" />
                <button onClick={() => { const newChoices = choices.filter((_: any, j: number) => j !== i); setChoices(newChoices); updateData({ choices: newChoices }); }} className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-500 transition-colors">×</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

function CustomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  return (
    <div className="absolute bottom-4 left-4 bg-gray-900 border border-gray-600 rounded-xl p-2 flex gap-2 z-10">
      <button onClick={() => zoomIn({ duration: 300 })} className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center justify-center transition-colors duration-200" title="Zoom In">
        <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
      </button>
      <button onClick={() => zoomOut({ duration: 300 })} className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center justify-center transition-colors duration-200" title="Zoom Out">
        <FontAwesomeIcon icon={faMinus} className="w-4 h-4" />
      </button>
      <button onClick={() => fitView({ duration: 300 })} className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center justify-center transition-colors duration-200" title="Reset View">
        <FontAwesomeIcon icon={faRotateLeft} className="w-4 h-4" />
      </button>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  sceneNode: SceneNode,
  colorPickerNode: ColorPickerNode,
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
        text: '',
        battle: {
          enabled: true,
          enemyName: 'Mighty Warrior',
          enemyHealth: 80,
          defendEnabled: true,
          attackDamageMin: 10,
          attackDamageMax: 20
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

  const handleClick = () => {
    setAddDropdownOpen(false);
  };

  const clearAll = () => {
    setNodes([initialNodes[1]]);
    setEdges([]);
    setNodeIdCounter(1);
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

        .battle-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 40px;
            position: relative;
        }

        .battle-title {
            font-size: 48px;
            margin-bottom: 40px;
            text-align: center;
            color: #a855f7;
            font-family: 'Courier New', monospace;
            font-weight: bold;
        }

        .battle-stats {
            display: flex;
            justify-content: space-between;
            width: 100%;
            max-width: 800px;
            margin-bottom: 40px;
        }

        .stat-box {
            padding: 20px;
            border: 2px solid;
            border-radius: 8px;
            background-color: black;
            min-width: 200px;
            font-family: 'Courier New', monospace;
        }

        .player-box {
            border-color: #06b6d4;
        }

        .enemy-box {
            border-color: #a855f7;
        }

        .stat-title {
            font-size: 20px;
            margin-bottom: 10px;
            font-weight: bold;
        }

        .health-bar {
            width: 200px;
            height: 10px;
            background-color: #374151;
            border-radius: 5px;
            margin-top: 6px;
        }

        .health-fill {
            height: 100%;
            border-radius: 5px;
        }

        .player-health-fill {
            background-color: #06b6d4;
        }

        .enemy-health-fill {
            background-color: #a855f7;
        }

        .battle-log {
            background-color: black;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 40px;
            min-height: 120px;
            font-size: 16px;
            line-height: 1.5;
            width: 100%;
            max-width: 800px;
            font-family: 'Courier New', monospace;
        }

        .battle-buttons {
            display: flex;
            gap: 16px;
            justify-content: center;
        }

        .battle-btn {
            font-size: 20px;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            border: 2px solid ${colorValue};
            transition: all 0.3s;
            font-family: 'Courier New', monospace;
        }

        .battle-btn.enabled {
            background-color: ${colorValue};
            color: black;
        }

        .battle-btn.disabled {
            background-color: #374151;
            color: white;
            cursor: not-allowed;
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

        const PLAYER_MAX_HEALTH = 100;
        const BATTLE_TIMEOUT = 2000;
        const ENEMY_DAMAGE_MIN = 5;
        const ENEMY_DAMAGE_MAX = 15;
        const DEFENSE_MULTIPLIER = 0.5;

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
                const leftOffset = window.innerWidth * 0.25; // Left sidebar takes 25% width
                spider.style.left = Math.random() * (window.innerWidth - leftOffset - this.zoom) + leftOffset + 'px';
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
                        const leftOffset = window.innerWidth * 0.25; // Left sidebar takes 25% width
                        if (x <= leftOffset || x >= window.innerWidth - this.zoom) {
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
                this.battle = {
                    inBattle: false,
                    playerHealth: PLAYER_MAX_HEALTH,
                    enemyMaxHealth: 0,
                    enemyHealth: 0,
                    enemyName: '',
                    battleLog: [],
                    turn: 'player'
                };
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

            startBattle(enemyName, enemyHealth) {
                this.battle = {
                    inBattle: true,
                    playerHealth: PLAYER_MAX_HEALTH,
                    enemyMaxHealth: enemyHealth,
                    enemyHealth,
                    enemyName,
                    battleLog: [\`A \${enemyName} appears!\`],
                    turn: 'player'
                };
                this.render();
            }

            playerAttack() {
                const attackMin = SCENE_DATA[this.currentScene].battle?.attackDamageMin || 10;
                const attackMax = SCENE_DATA[this.currentScene].battle?.attackDamageMax || 20;
                const damage = Math.floor(Math.random() * (attackMax - attackMin + 1)) + attackMin;
                const newEnemyHealth = Math.max(0, this.battle.enemyHealth - damage);
                const log = [...this.battle.battleLog, \`You attack for \${damage} damage!\`];

                if (newEnemyHealth <= 0) {
                    log.push(\`You defeated the \${this.battle.enemyName}!\`);
                    setTimeout(() => {
                        this.battle = { ...this.battle, inBattle: false, battleLog: [] };
                        this.currentScene = 'start';
                        this.render();
                    }, BATTLE_TIMEOUT);
                }

                this.battle = {
                    ...this.battle,
                    enemyHealth: newEnemyHealth,
                    battleLog: log,
                    turn: 'enemy'
                };

                this.render();

                if (newEnemyHealth > 0) {
                    setTimeout(() => this.enemyAttack(false), 1000);
                }
            }

            playerDefend() {
                const log = [...this.battle.battleLog, \`You take a defensive stance!\`];

                this.battle = {
                    ...this.battle,
                    battleLog: log,
                    turn: 'enemy'
                };

                this.render();

                setTimeout(() => this.enemyAttack(true), 1000);
            }

            enemyAttack(playerIsDefending = false) {
                const baseDamage = Math.floor(Math.random() * (ENEMY_DAMAGE_MAX - ENEMY_DAMAGE_MIN + 1)) + ENEMY_DAMAGE_MIN;
                const damage = playerIsDefending ? Math.floor(baseDamage * DEFENSE_MULTIPLIER) : baseDamage;
                const newPlayerHealth = Math.max(0, this.battle.playerHealth - damage);
                const log = [...this.battle.battleLog, playerIsDefending
                    ? \`The \${this.battle.enemyName} attacks for \${baseDamage} damage, but you defend and only take \${damage}!\`
                    : \`The \${this.battle.enemyName} attacks for \${damage} damage!\`];

                if (newPlayerHealth <= 0) {
                    log.push('You were defeated! Game Over.');
                    setTimeout(() => {
                        this.currentScene = 'start';
                        this.battle = { ...this.battle, inBattle: false, battleLog: [], playerHealth: PLAYER_MAX_HEALTH };
                        this.render();
                    }, BATTLE_TIMEOUT);
                }

                this.battle = {
                    ...this.battle,
                    playerHealth: newPlayerHealth,
                    battleLog: log,
                    turn: 'player'
                };

                this.render();
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

                const sceneData = SCENE_DATA[this.currentScene];
                if (sceneData && sceneData.battle?.enabled) {
                    this.startBattle(sceneData.battle.enemyName, sceneData.battle.enemyHealth);
                } else {
                    this.render();
                }
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

                if (this.battle.inBattle || sceneData.battle?.enabled) {
                    const choicesHtml = sceneData.choices.map((choice, index) => \`
                        <button class="choice-btn" onclick="app.handleChoice('\${choice.nextScene}')">
                            \${choice.text}
                        </button>
                    \`).join('');

                    this.container.innerHTML = \`
                        <div class="battle-container">
                            <div class="battle-title">BATTLE: \${this.battle.enemyName.toUpperCase()}</div>

                            <div class="battle-stats">
                                <div class="stat-box player-box">
                                    <div class="stat-title">PLAYER</div>
                                    <div>HP: \${this.battle.playerHealth}/\${PLAYER_MAX_HEALTH}</div>
                                    <div class="health-bar">
                                        <div class="health-fill player-health-fill" style="width: \${(this.battle.playerHealth / PLAYER_MAX_HEALTH) * 100}%"></div>
                                    </div>
                                </div>

                                <div class="stat-box enemy-box">
                                    <div class="stat-title">\${this.battle.enemyName.toUpperCase()}</div>
                                    <div>HP: \${this.battle.enemyHealth}/\${this.battle.enemyMaxHealth}</div>
                                    <div class="health-bar">
                                        <div class="health-fill enemy-health-fill" style="width: \${(this.battle.enemyHealth / this.battle.enemyMaxHealth) * 100}%"></div>
                                    </div>
                                </div>
                            </div>

                            <div class="battle-log">
                                \${this.battle.battleLog.map(log => \`<div>\${log}</div>\`).join('')}
                            </div>

                            <div class="battle-buttons">
                                <button class="battle-btn \${this.battle.turn === 'player' && this.battle.enemyHealth > 0 ? 'enabled' : 'disabled'}" onclick="app.playerAttack()">
                                    ATTACK
                                </button>
                                \${sceneData.battle?.defendEnabled !== false ? \`<button class="battle-btn \${this.battle.turn === 'player' && this.battle.enemyHealth > 0 ? 'enabled' : 'disabled'}" onclick="app.playerDefend()">
                                    DEFEND
                                </button>\` : ''}
                            </div>
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
  }), [setNodes, accentColor, tabTitle, spiders]);

  return (
    <div className="h-screen bg-black flex" onClick={handleClick}>
      <div className="w-1/4 bg-gray-900 border-r border-gray-700 flex flex-col">
        <div className="p-4">
          <button
            onClick={() => router.back()}
            className="text-white border border-gray-600 px-4 py-2 rounded-xl cursor-pointer font-bold hover:bg-gray-800"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back
          </button>
        </div>
        <div className="p-4 flex-1">
          <h2 className="text-white text-xl font-bold mb-4">Tutorial</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            To add a choice, press the Add Choice button.
          </p>
          <div className="mb-5"><button className="bg-gray-800 text-white border border-gray-600 px-5 py-2.5 rounded cursor-pointer text-sm hover:bg-gray-700"><svg data-prefix="fas" data-icon="circle-plus" className="svg-inline--fa fa-circle-plus mr-2 h-4 w-4" role="img" viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM232 344l0-64-64 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l64 0 0-64c0-13.3 10.7-24 24-24s24 10.7 24 24l0 64 64 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-64 0 0 64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"></path></svg> Add&nbsp;Choice</button></div>
          <p className="text-gray-300 text-sm leading-relaxed">
            Then use the add dropdown to add a scene.
          </p>
          <div className="mt-3 flex justify-center">
            <div className="relative inline-block">
              <div className="bg-gray-700 text-white border border-gray-600 px-4 py-2 rounded-xl font-bold opacity-60 cursor-not-allowed">
                Add ▼
              </div>
              <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded-xl shadow-lg py-1 min-w-40 z-20 opacity-60">
                <div className="px-3 py-2 text-white text-sm cursor-not-allowed">
                  + Scene
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed mt-16">
            When adding a choice, enter "scene1" in the target scene field to make it go to your first scene.
          </p>
          <div className="mt-4 flex items-center gap-1.25 opacity-80">
            <input
              type="text"
              value="New choice"
              readOnly
              className="flex-1 bg-gray-800 border border-gray-600 rounded text-white text-xs px-2 py-1"
            />
            <input
              type="text"
              value="scene1"
              readOnly
              className="flex-1 bg-gray-800 border border-gray-600 rounded text-white text-xs px-2 py-1"
            />
          </div>
          <p className="text-gray-300 text-sm leading-relaxed mt-6">
            You can add multiple choices to a scene by clicking "Add Choice" again. Click on the choice text to customize it to your own words.
          </p>
          <div className="mt-3 flex flex-col gap-2 opacity-80">
            <div className="flex items-center gap-1.25">
              <input
                type="text"
                value="Explore the forest"
                readOnly
                className="flex-1 bg-gray-800 border border-gray-600 rounded text-white text-xs px-2 py-1"
              />
              <input
                type="text"
                value="scene1"
                readOnly
                className="flex-1 bg-gray-800 border border-gray-600 rounded text-white text-xs px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-1.25">
              <input
                type="text"
                value="Enter the cave"
                readOnly
                className="flex-1 bg-gray-800 border border-gray-600 rounded text-white text-xs px-2 py-1"
              />
              <input
                type="text"
                value="scene2"
                readOnly
                className="flex-1 bg-gray-800 border border-gray-600 rounded text-white text-xs px-2 py-1"
              />
            </div>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed mt-6">
            To test your game, press the "Test Game" button in the top right corner. Your game will open in a new tab where you can play through your adventure.
          </p>
          <div className="mt-3 flex justify-center">
            <button className="text-white border-2 border-gray-600 px-4 py-2 rounded cursor-not-allowed font-bold bg-black opacity-60 text-sm">
              Test Game
            </button>
          </div>
          <h3 className="text-white text-lg font-bold mt-8 mb-4">Notes</h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            Create Notes using the notes button from the add dropdown. These do not affect your story.
          </p>
          <div className="mt-3 flex justify-center">
            <button className="bg-gray-800 text-white border border-gray-600 px-4 py-2 rounded cursor-not-allowed font-bold opacity-60 text-sm">
              <FontAwesomeIcon icon={faNoteSticky} className="mr-2" />
              Note
            </button>
          </div>
        </div>
        <div className="p-4 border-t border-gray-700">
          <h3 className="text-white text-lg font-bold mb-4">Still Stuck?</h3>
          <a
            href="https://raw.githubusercontent.com/GamerC0der/textadventure/refs/heads/main/tutorial.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gray-800 text-white border border-gray-600 px-4 py-2 rounded cursor-pointer text-sm hover:bg-gray-700 transition-colors"
          >
            <FontAwesomeIcon icon={faBook} className="h-4 w-4" />
            View ReadME.MD
          </a>
        </div>
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
                  className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 text-sm"
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
        <Background color="#333" gap={16} />
        <CustomControls />
      </ReactFlow>

    </div>
  );
}
