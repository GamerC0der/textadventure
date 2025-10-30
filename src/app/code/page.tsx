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

function SceneNode({ data, id }: { data: any; id: string }) {
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
        border: '2px solid #61dafb',
        borderRadius: '8px',
        padding: '15px',
        color: 'white',
        fontFamily: "'Courier New', monospace",
        minWidth: '300px',
        maxWidth: '400px',
      }}
    >
      <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#61dafb' }}>
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
];

const initialEdges: Edge[] = [];

export default function CodeEditor() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(2);

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

    localStorage.setItem('adventureData', JSON.stringify(scenes));
    window.open('/play', '_blank');
  };

  const nodeTypesWithCallbacks = useMemo(() => ({
    sceneNode: (props: any) => (
      <SceneNode
        {...props}
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
  }), [setNodes]);

  return (
    <div style={{ height: '100vh', backgroundColor: '#000' }}>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 10,
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={addNode}
          style={{
            background: '#61dafb',
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
          ▶️ Play Adventure
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
        <Controls style={{ backgroundColor: '#1a1a1a', border: '1px solid #61dafb' }} />
        <Background color="#333" gap={16} />
      </ReactFlow>
    </div>
  );
}
