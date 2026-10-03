import { Component, useEffect, useState, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
export type Layer = "sales" | "cost" | "expenses";
export type MonthLayer<Id extends string> = Readonly<{ id: Id; label: string; detail: string }>;
export type MonthLayers<Id extends string> = readonly [MonthLayer<Id>, MonthLayer<Id>, MonthLayer<Id>];

function ContextLoss({onLost}: {onLost: () => void}) {
  const gl = useThree(state => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onLost(); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onLost]);
  return null;
}

class SceneBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}> {
  state = {failed:false};
  static getDerivedStateFromError() {return {failed:true};}
  render() {return this.state.failed?this.props.fallback:this.props.children;}
}
export function MonthObject<Id extends string>({selected,onSelect,layers,sceneLabel,controlsLabel}:{selected:NoInfer<Id>;onSelect:(layer:NoInfer<Id>)=>void;layers:MonthLayers<Id>;sceneLabel:string;controlsLabel:string}) {
  const [lost,setLost]=useState(false), [attempt,setAttempt]=useState(0);
  const palette=["#2b55ba","#96b7e2","#d2d6dd"];
  const fallback=<div className="scene-fallback"><span role="status">Görünüm kullanılamıyor</span><button onClick={()=>{setLost(false);setAttempt(v=>v+1);}}>3D’yi yeniden dene</button></div>;
  return <div className="month-object"><div className="scene-stage" role="group" aria-label={sceneLabel}>
    {lost?fallback:<SceneBoundary key={attempt} fallback={fallback}><Canvas orthographic camera={{position:[4,3.3,5],zoom:56}} dpr={[1,1.5]} frameloop="demand" fallback={fallback} gl={{antialias:true,alpha:true}}>
      <ContextLoss onLost={()=>setLost(true)}/>
      <ambientLight intensity={1.7}/><directionalLight position={[4,6,3]} intensity={3}/><directionalLight position={[-4,2,0]} intensity={1.2}/>
      <group position={[0,-.15,0]} rotation={[0,-.22,0]}>{layers.map((layer,i)=><group key={layer.id} position={[selected===layer.id?.18:0,(2-i)*.48-.48,0]}>
        <mesh onClick={event=>{event.stopPropagation();onSelect(layer.id);}} rotation={[0,(i-1)*.045,0]}><boxGeometry args={[2.4,.28,1.65]}/><meshStandardMaterial color={palette[i]} roughness={.38} metalness={.08}/></mesh>
        {[0,1,2].map(j=><mesh key={j} position={[-.68+j*.64,.146,.3]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.39,.045]}/><meshBasicMaterial color="#ffffff" transparent opacity={.65}/></mesh>)}
      </group>)}</group>
    </Canvas></SceneBoundary>}
    </div><div className="scene-tabs" role="group" aria-label={controlsLabel}>{layers.map(layer=><button key={layer.id} aria-label={`${layer.label} katmanı`} aria-pressed={selected===layer.id} onClick={()=>onSelect(layer.id)}>{layer.label}</button>)}</div>
    <p className="scene-caption" role="status">{layers.find(layer=>layer.id===selected)?.detail}</p>
  </div>;
}
