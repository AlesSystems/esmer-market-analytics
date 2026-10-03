import { useEffect, useMemo } from "react";
import { BufferGeometry, DoubleSide, Float32BufferAttribute } from "three";
import { SceneFrame } from "./SceneFrame";
export type SalesReceiptSelection = "documents" | "returns" | "evidence";
type Props = { selection: SalesReceiptSelection; disabled?: boolean; source?: boolean; onDocuments: () => void; onReturns: () => void; onEvidence: () => void };

export function SalesReceiptScene({ selection, disabled = false, source = false, onDocuments, onReturns, onEvidence }: Props) {
  const ribbon = useMemo(() => {
    const geometry = new BufferGeometry();
    const vertices: number[] = [];
    const positions = [[-.95, .12], [-.6, 0], [.1, .08], [.78, -.2], [1.05, -.18]];
    for (let i = 0; i < positions.length - 1; i++) {
      const [y, z] = positions[i], [nextY, nextZ] = positions[i + 1];
      vertices.push(-.62, y, z, .62, y, z, -.62, nextY, nextZ, .62, y, z, .62, nextY, nextZ, -.62, nextY, nextZ);
    }
    geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    return geometry;
  }, []);
  useEffect(() => () => ribbon.dispose(), [ribbon]);
  const run = (action: () => void) => { if (!disabled) action(); };
  return <div className="sales-receipt-scene" data-scene="folded-receipt">
    <div role="img" aria-label="Katlanmış satış fişi; tutarları temsil etmeyen gezinme nesnesi">
      <SceneFrame camera={{ position: [3, 1.6, 5], zoom: 70 }}>
        <group rotation={[.04, -.2, -.12]} position={[0, .05, 0]}>
          <mesh geometry={ribbon} onClick={event => { event.stopPropagation(); run(onDocuments); }}><meshStandardMaterial color={selection === "documents" ? "#2b55ba" : "#afc6e7"} side={DoubleSide} roughness={.68} /></mesh>
          {[0, 1, 2, 3, 4].map(index => <mesh key={index} position={[index % 2 ? -.11 : 0, .62 - index * .22, .04]}><boxGeometry args={[index % 2 ? .62 : .86, .024, .014]} /><meshStandardMaterial color="#edf3ff" roughness={.8} /></mesh>)}
          <mesh position={[.12, -.8, .35]} rotation={[-.72, .12, 0]} onClick={event => { event.stopPropagation(); run(onReturns); }}><boxGeometry args={[1.22, .53, .025]} /><meshStandardMaterial color={selection === "returns" ? "#2b55ba" : "#d4dce9"} roughness={.7} /></mesh>
          <mesh position={[.42, .88, -.13]} rotation={[0, 0, -.06]} onClick={event => { event.stopPropagation(); run(onEvidence); }}><boxGeometry args={[.62, .32, .04]} /><meshStandardMaterial color={selection === "evidence" ? "#2b55ba" : "#d4dce9"} roughness={.7} /></mesh>
          {[0, 1, 2, 3, 4, 5].map(index => <mesh key={index} position={[-.51 + index * .2, -1.03, .15]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[.12, .12, .025]} /><meshStandardMaterial color="#afc6e7" roughness={.7} /></mesh>)}
        </group>
      </SceneFrame>
    </div>
    <div className="sales-scene-actions" aria-label="Satış fişi gezinmesi">
      <button type="button" disabled={disabled} aria-pressed={selection === "documents"} onClick={onDocuments}>{source ? "Belge kayıtlarını incele" : "Satış belgelerini incele"}</button>
      <button type="button" disabled={disabled} aria-pressed={selection === "returns"} onClick={onReturns}>{source ? "Ürün kayıtlarını incele" : "Müşteri iadelerini incele"}</button>
      <button type="button" disabled={disabled} aria-pressed={selection === "evidence"} onClick={onEvidence}>Kaynak ve yöntemi incele</button>
    </div>
    <p className="sales-scene-caption">3D nesne tutar veya oran göstermez.</p>
  </div>;
}
