import { useFrame } from "@react-three/fiber";
import { SceneFrame } from "./SceneFrame";
function InspectionRenderEvidence() {
 useFrame(({ gl }) => {
  gl.domElement.dataset.frames = String(Number(gl.domElement.dataset.frames ?? 0) + 1);
  queueMicrotask(() => { gl.domElement.dataset.drawCalls = String(gl.info.render.calls); gl.domElement.dataset.triangles = String(gl.info.render.triangles); });
 });
 return null;
}
export type CostSelection = "exceptions" | "evidence" | "history";
export function CostInspectionScene({ selection, onExceptions, onEvidence, source = false, hasEvidence = true, onHistory }: { selection: CostSelection | null; onExceptions: () => void; onEvidence: () => void; source?: boolean; hasEvidence?: boolean; onHistory?: () => void }) {
 return <div data-scene="cost-inspection" className="cost-inspection-scene">
  <div role="img" aria-label="Çapraz inceleme merceği ve açık kanıt tepsisi; tutarları temsil etmez">
   <SceneFrame camera={{ position: [3, 3, 5], zoom: 66 }}>
    <InspectionRenderEvidence/>
    <group rotation={[0, -.28, -.12]}>
     <group onClick={event => { event.stopPropagation(); (onHistory ?? onEvidence)(); }}>
      <mesh position={[0, -.55, 0]}><boxGeometry args={[2, .12, 1.25]}/><meshStandardMaterial color={selection === "history" ? "#2856bf" : "#abc0df"} roughness={.7}/></mesh>
      {[-1, 1].map(side => <mesh key={side} position={[side * .98, -.37, 0]}><boxGeometry args={[.06, .36, 1.25]}/><meshStandardMaterial color="#809dc4" roughness={.7}/></mesh>)}
      <mesh position={[0, -.37, -.59]}><boxGeometry args={[2, .36, .06]}/><meshStandardMaterial color="#809dc4" roughness={.7}/></mesh>
      {hasEvidence && [0,1,2].map(index => <mesh key={index} onClick={event => { event.stopPropagation(); (source ? onEvidence : onExceptions)(); }} position={[-.3 + index * .3, -.42 + index * .05, .1]} rotation={[0, index * .1, -.1]}><boxGeometry args={[.95, .035, .68]}/><meshStandardMaterial color={index === 2 ? "#f4f7ff" : "#d5dfef"} roughness={.85}/></mesh>)}
     </group>
     <group position={[-.24, .62, .12]} rotation={[.4, -.2, -.46]} onClick={event => { event.stopPropagation(); onExceptions(); }}>
      <mesh><torusGeometry args={[.57, .085, 8, 32]}/><meshStandardMaterial color={selection === "exceptions" ? "#2856bf" : "#829fc9"} roughness={.4} metalness={.15}/></mesh>
      <mesh position={[0, -.96, 0]}><boxGeometry args={[.17, .7, .16]}/><meshStandardMaterial color="#2856bf" roughness={.5}/></mesh>
     </group>
    </group>
   </SceneFrame>
  </div>
  <div className="cost-scene-actions"><button type="button" aria-pressed={selection === "exceptions"} onClick={onExceptions}>{source ? "Kaynak kayıtlarını incele" : "Dışlanan satırları incele"}</button><button type="button" aria-pressed={selection === "evidence"} onClick={onEvidence}>Kapsam kanıtını incele</button>{onHistory && <button type="button" aria-pressed={selection === "history"} onClick={onHistory}>Alış geçmişini incele</button>}</div>
  <p className="caption">3D nesne tutar veya oran göstermez.</p>
 </div>;
}
