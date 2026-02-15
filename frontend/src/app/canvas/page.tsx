"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  type Connection,
  addEdge,
  ConnectionMode,
} from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import "@xyflow/react/dist/style.css";

const FASTAPI_BASE =
  process.env.BACKEND_URL || "https://treehacks-backend-pi.vercel.app";
const FAMILY_PHOTOS_FALLBACKS = [
  "/images/reminiscence/IMG_0017.jpg",
  "/images/reminiscence/IMG_0023.jpg",
  "/images/reminiscence/IMG_0034.jpg",
  "/images/reminiscence/IMG_0036.jpg",
  "/images/reminiscence/IMG_0042.jpg",
];

type ImageNodeData = {
  image: string;
  label?: string;
  description?: string;
  location?: string;
};
type ImageNode = Node<ImageNodeData, "imageNode">;
type TextNodeData = { text: string };
type TextNode = Node<TextNodeData, "textNode">;
type CanvasNode = ImageNode | TextNode;

const FLOAT_DURATION = 8;

function TextBubbleNode({ data, selected, id }: NodeProps<TextNode>) {
  const delay = (id.charCodeAt(0) % 4) * 1.8;
  return (
    <div
      className={`
        rounded-[28px] overflow-visible
        bg-white/25 backdrop-blur-md
        border border-white/40
        px-5 py-4
        ${selected ? "ring-2 ring-teal-400/80" : ""}
      `}
      style={{
        boxShadow: selected
          ? "0 0 28px rgba(94, 234, 212, 0.5), 0 0 56px rgba(94, 234, 212, 0.2)"
          : "0 0 24px rgba(94, 234, 212, 0.35), 0 0 48px rgba(94, 234, 212, 0.12), 0 0 12px rgba(255, 255, 255, 0.15)",
        animation: `bubble-float ${FLOAT_DURATION}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <p className="pangolin-regular text-slate-200 text-sm font-medium text-center whitespace-nowrap">
        {data.text}
      </p>
    </div>
  );
}

function ImageBubbleNode({ data, selected, id }: NodeProps<ImageNode>) {
  const delay = (id.charCodeAt(0) % 3) * 1.8;
  return (
    <div
      className={`
        rounded-[28px] overflow-visible
        bg-white/25 backdrop-blur-md
        border border-white/40
        p-1.5
        ${selected ? "ring-2 ring-teal-400/80" : ""}
      `}
      style={{
        width: 140,
        height: 140,
        boxShadow: selected
          ? "0 0 28px rgba(94, 234, 212, 0.5), 0 0 56px rgba(94, 234, 212, 0.2)"
          : "0 0 24px rgba(94, 234, 212, 0.35), 0 0 48px rgba(94, 234, 212, 0.12), 0 0 12px rgba(255, 255, 255, 0.15)",
        animation: `bubble-float ${FLOAT_DURATION}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <div className="w-full h-full rounded-[22px] overflow-hidden bg-black/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.image}
          alt={data.label ?? "Photo"}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>
    </div>
  );
}

const nodeTypes = { imageNode: ImageBubbleNode, textNode: TextBubbleNode };

const baseNodes: CanvasNode[] = [
  {
    id: "0",
    type: "textNode",
    position: { x: 240, y: 20 },
    data: { text: "This week, three years ago" },
  },
  {
    id: "1",
    type: "imageNode",
    position: { x: 100, y: 120 },
    data: {
      image: "/images/IMG_0772 3.jpg",
      label: "A Pensive Morning",
      description: "Before a hike up to Panorama Ridge.",
      location: "Panorama Ridge, BC",
    },
  },
  {
    id: "2",
    type: "imageNode",
    position: { x: 380, y: 120 },
    data: {
      image: "/images/0c9e9304-5694-4780-bd7b-73f1f6daaea4.jpg",
      label: "8ams with the fam",
      description: "The muffin was good.",
      location: "Vancouver, BC",
    },
  },
  {
    id: "3",
    type: "imageNode",
    position: { x: 240, y: 250 },
    data: {
      image: "/images/IMG_0780.jpg",
      label: "Mountains!",
      description: "Look at that glow.",
      location: "Panorama Ridge, BC",
    },
  },
  {
    id: "4",
    type: "imageNode",
    position: { x: 80, y: 320 },
    data: {
      image: "/images/IMG_0688.jpg",
      label: "Longboat was hard",
      description: "And why did we have lab coats on?.",
      location: "Jericho Beach, BC",
    },
  },
  {
    id: "5",
    type: "imageNode",
    position: { x: 400, y: 320 },
    data: {
      image: "/images/IMG_0779 3.jpg",
      label: "Sunrise above the clouds",
      description: "Surreal.",
      location: "Panorama Ridge, BC",
    },
  },
  {
    id: "6",
    type: "textNode",
    position: { x: 740, y: 20 },
    data: { text: "This week, for the family" },
  },
];

const FAMILY_NODE_POSITIONS = [
  { x: 600, y: 120 },
  { x: 880, y: 120 },
  { x: 740, y: 250 },
  { x: 580, y: 320 },
  { x: 900, y: 320 },
];

function buildFamilyPhotoNodes(urls: string[]): ImageNode[] {
  const padded = urls.slice(0, 5);
  for (let i = padded.length; i < 5; i++) {
    padded.push(FAMILY_PHOTOS_FALLBACKS[i]);
  }
  return padded.map((image, i) => ({
    id: String(7 + i),
    type: "imageNode" as const,
    position: FAMILY_NODE_POSITIONS[i],
    data: { image, label: "Photo" },
  }));
}

const initialFamilyPhotoNodes = buildFamilyPhotoNodes([]);
const initialNodes: CanvasNode[] = [...baseNodes, ...initialFamilyPhotoNodes];

const initialEdges: Edge[] = [
  { id: "e0-1", source: "0", target: "1" },
  { id: "e1-2", source: "1", target: "2" },
  { id: "e1-3", source: "1", target: "3" },
  { id: "e2-3", source: "2", target: "3" },
  { id: "e3-4", source: "3", target: "4" },
  { id: "e3-5", source: "3", target: "5" },
  { id: "e6-7", source: "6", target: "7" },
  { id: "e6-8", source: "6", target: "8" },
  { id: "e6-9", source: "6", target: "9" },
  { id: "e7-10", source: "7", target: "10" },
  { id: "e8-10", source: "8", target: "10" },
  { id: "e9-11", source: "9", target: "11" },
];

const ZOOM_DURATION = 0.32;
const ZOOM_SCALE_FOCUSED = 1.55;
const SLIDE_DURATION = 0.52;
const SLIDE_OFFSET = 80;
const FOCUS_IMAGE_SIZE = 380;
const nodeOrder = initialNodes.map((n) => n.id);

type FamilyPhotosState = {
  photos: string[];
  syncing: boolean;
} | null;

export default function CanvasPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [focusedNode, setFocusedNode] = useState<CanvasNode | null>(null);
  const [slideDirection, setSlideDirection] = useState(1);
  const [familyPhotos, setFamilyPhotos] = useState<FamilyPhotosState>(null);
  const closeExitDirectionRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchFamilyPhotos = async () => {
      try {
        const res = await fetch(
          `${FASTAPI_BASE}/companionship/family-photos?family_id=${process.env.NEXT_PUBLIC_FAMILY_ID || "treehacks"}`
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setFamilyPhotos({
          photos: data.photos ?? [],
          syncing: Boolean(data.syncing),
        });
      } catch {
        if (!cancelled) setFamilyPhotos({ photos: [], syncing: false });
      }
    };
    fetchFamilyPhotos();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (familyPhotos === null) return;
    setNodes([...baseNodes, ...buildFamilyPhotoNodes(familyPhotos.photos)]);
  }, [familyPhotos, setNodes]);

  const isLoading = familyPhotos === null;

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: CanvasNode) => {
      closeExitDirectionRef.current = null;
      setFocusedNode(node);
    },
    []
  );

  const focusIndex = focusedNode ? nodeOrder.indexOf(focusedNode.id) : -1;
  const canGoPrev = focusIndex > 0;
  const canGoNext = focusIndex >= 0 && focusIndex < nodeOrder.length - 1;

  const goToPrev = useCallback(() => {
    if (!focusedNode || !canGoPrev) return;
    const goingToFirst = focusIndex - 1 === 0;
    setSlideDirection(goingToFirst ? 1 : -1);
    const prevId = nodeOrder[focusIndex - 1];
    const prev =
      nodes.find((n) => n.id === prevId) ??
      initialNodes.find((n) => n.id === prevId);
    if (prev) setFocusedNode(prev);
  }, [focusedNode, canGoPrev, focusIndex, nodes]);

  const goToNext = useCallback(() => {
    if (!focusedNode || !canGoNext) return;
    const goingToLast = focusIndex + 1 === nodeOrder.length - 1;
    setSlideDirection(goingToLast ? -1 : 1);
    const nextId = nodeOrder[focusIndex + 1];
    const next =
      nodes.find((n) => n.id === nextId) ??
      initialNodes.find((n) => n.id === nextId);
    if (next) setFocusedNode(next);
  }, [focusedNode, canGoNext, focusIndex, nodes]);

  const closeOverlay = useCallback(() => {
    if (focusIndex === 0) closeExitDirectionRef.current = 1;
    else if (focusIndex === nodeOrder.length - 1)
      closeExitDirectionRef.current = -1;
    else closeExitDirectionRef.current = null;
    setFocusedNode(null);
  }, [focusIndex]);

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-900">
      {isLoading && (
        <div
          className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/95"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="rounded-full bg-teal-500/90 px-6 py-3 text-lg font-medium text-white shadow-lg">
            Loading...
          </span>
        </div>
      )}
      <style>{`
        @keyframes bubble-float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          20% { transform: translate(3px, -5px) rotate(0.6deg); }
          40% { transform: translate(-4px, 3px) rotate(-0.4deg); }
          60% { transform: translate(-2px, -3px) rotate(0.3deg); }
          80% { transform: translate(4px, 2px) rotate(-0.5deg); }
        }
      `}</style>
      <motion.div
        className="h-full w-full origin-center"
        style={{ transformOrigin: "50% 50%" }}
        animate={{ scale: focusedNode ? ZOOM_SCALE_FOCUSED : 1 }}
        transition={{
          duration: ZOOM_DURATION,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div className="relative h-full w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            className="bg-slate-900/50"
            defaultEdgeOptions={{
              style: { stroke: "rgba(148, 163, 184, 0.6)", strokeWidth: 1.5 },
              type: "smoothstep",
            }}
          >
            <Background color="rgb(148 163 184)" gap={20} size={0.5} />
            <Controls className="bg-slate-800/90! border-slate-600! rounded-lg!" />
          </ReactFlow>

          <AnimatePresence>
            {focusedNode && (
              <motion.div
                className="absolute inset-0 z-50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: ZOOM_DURATION * 0.5, ease: "easeOut" }}
              >
                <div
                  className="absolute inset-0 bg-black/65 backdrop-blur-sm"
                  onClick={closeOverlay}
                  aria-hidden
                />
                <div
                  className="relative z-10 flex items-center justify-center gap-5 w-full max-w-4xl px-6 py-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={goToPrev}
                    disabled={!canGoPrev}
                    className="shrink-0 p-4 rounded-full text-white hover:bg-white/20 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-10 h-10" />
                  </button>

                  <div className="flex-1 flex justify-center min-h-[480px] items-center overflow-visible py-12 relative">
                    <AnimatePresence initial={false} custom={slideDirection}>
                      <motion.div
                        key={focusedNode.id}
                        className="flex flex-col items-center gap-6 max-w-lg w-full absolute left-1/2 -translate-x-1/2"
                        custom={slideDirection}
                        initial={
                          ((dir: number) => ({
                            x: dir * SLIDE_OFFSET,
                            opacity: 0,
                          })) as unknown as React.ComponentProps<
                            typeof motion.div
                          >["initial"]
                        }
                        animate={{ x: 0, opacity: 1 }}
                        exit={
                          ((dir: number) => {
                            const d = closeExitDirectionRef.current ?? dir;
                            return { x: -d * SLIDE_OFFSET, opacity: 0 };
                          }) as unknown as React.ComponentProps<
                            typeof motion.div
                          >["exit"]
                        }
                        transition={{
                          duration: SLIDE_DURATION,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        {focusedNode.type === "textNode" ? (
                          <div
                            className="
                          rounded-[36px] overflow-visible
                          bg-white/30 backdrop-blur-md
                          border border-white/50
                          px-12 py-10 shadow-2xl
                        "
                            style={{
                              boxShadow:
                                "0 0 40px rgba(94, 234, 212, 0.4), 0 0 80px rgba(94, 234, 212, 0.15), 0 0 20px rgba(255, 255, 255, 0.2)",
                            }}
                          >
                            <p className="pangolin-regular text-slate-100 text-3xl font-medium text-center">
                              {(focusedNode as TextNode).data.text}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div
                              className="
                            rounded-[36px] overflow-visible
                            bg-white/30 backdrop-blur-md
                            border border-white/50
                            p-2.5 shadow-2xl
                          "
                              style={{
                                width: FOCUS_IMAGE_SIZE,
                                height: FOCUS_IMAGE_SIZE,
                                boxShadow:
                                  "0 0 40px rgba(94, 234, 212, 0.4), 0 0 80px rgba(94, 234, 212, 0.15), 0 0 20px rgba(255, 255, 255, 0.2)",
                              }}
                            >
                              <div className="w-full h-full rounded-[28px] overflow-hidden bg-black/10">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={(focusedNode as ImageNode).data.image}
                                  alt={
                                    (focusedNode as ImageNode).data.label ??
                                    "Photo"
                                  }
                                  className="w-full h-full object-cover"
                                  draggable={false}
                                />
                              </div>
                            </div>
                            <div className="pangolin-regular text-center px-6 py-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg">
                              {(focusedNode as ImageNode).data.location && (
                                <div className="flex items-center justify-center gap-1.5 text-slate-400 mb-2">
                                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                                  <span className="text-xs">
                                    {(focusedNode as ImageNode).data.location}
                                  </span>
                                </div>
                              )}
                              <p className="text-slate-200 text-lg font-medium">
                                {(focusedNode as ImageNode).data.label}
                              </p>
                              {(focusedNode as ImageNode).data.description && (
                                <p className="text-slate-300/95 text-base mt-2">
                                  {(focusedNode as ImageNode).data.description}
                                </p>
                              )}
                            </div>
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <button
                    type="button"
                    onClick={goToNext}
                    disabled={!canGoNext}
                    className="shrink-0 p-4 rounded-full text-white hover:bg-white/20 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="Next"
                  >
                    <ChevronRight className="w-10 h-10" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
