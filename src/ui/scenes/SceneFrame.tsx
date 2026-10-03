import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas, type CanvasProps } from "@react-three/fiber";

class RendererBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function SceneFrame({ children, camera }: { children: ReactNode; camera: CanvasProps["camera"] }) {
  const [ready, setReady] = useState(false);
  const [lost, setLost] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const detach = useRef<() => void>(() => undefined);
  useEffect(() => () => detach.current(), []);
  const fallback = <div className="page-scene-fallback" role="status"><span>Görünüm kullanılamıyor</span><button type="button" onClick={() => { detach.current(); setLost(false); setReady(false); setAttempt(value => value + 1); }}>3D’yi yeniden dene</button></div>;
  return <div className="page-scene-stage">
    {!ready && !lost && <span className="page-scene-loading" role="status">3D görünüm hazırlanıyor…</span>}
    {lost ? fallback : <RendererBoundary key={attempt} fallback={fallback}><Canvas orthographic camera={camera} dpr={[1, 1.5]} frameloop="demand" fallback={fallback} gl={{ antialias: true, alpha: true }} onCreated={({ gl }) => {
      setReady(true);
      detach.current();
      const canvas = gl.domElement;
      const onLost = (event: Event) => { event.preventDefault(); setLost(true); };
      canvas.addEventListener("webglcontextlost", onLost);
      detach.current = () => canvas.removeEventListener("webglcontextlost", onLost);
    }}>
      <ambientLight intensity={1.8} /><directionalLight position={[-3, 5, 4]} intensity={2.6} />
      {children}
    </Canvas></RendererBoundary>}
  </div>;
}
