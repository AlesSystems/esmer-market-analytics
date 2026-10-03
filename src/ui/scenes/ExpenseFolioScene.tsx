import { SceneFrame } from "./SceneFrame";
export type ExpenseTask = "records" | "import" | "completeness";
const tabs = [{ id: "records", label: "Kayıtlar" }, { id: "import", label: "Excel hazırlığı" }, { id: "completeness", label: "Tamlık incelemesi" }] as const;
export function ExpenseFolioScene({ task, complete, disabled, onTaskChange }: { task: ExpenseTask; complete: boolean; disabled: boolean; onTaskChange: (task: ExpenseTask) => void }) {
  return <div className="expense-folio" data-scene="standing-month-folio">
    <div role="img" aria-label="Ay dosyası; kayıt, Excel ve tamlık incelemesi gezinmesi; tutarları temsil etmez">
      <SceneFrame camera={{ position: [2.1, 1.2, 6], zoom: 65 }}>
        <group rotation={[0, -.12, -.04]}>
          <mesh position={[-.06, 0, -.12]}><boxGeometry args={[1.8, 2.1, .09]} /><meshStandardMaterial color="#bac9dd" roughness={.75} /></mesh>
          <mesh position={[.18, 0, .04]} rotation={[0, -.12, 0]} onClick={event => { event.stopPropagation(); if (!disabled) onTaskChange(task); }}><boxGeometry args={[1.68, 1.96, .045]} /><meshStandardMaterial color="#f0f4fa" roughness={.8} /></mesh>
          <mesh position={[-.91, 0, 0]} rotation={[0, -.65, 0]}><boxGeometry args={[.35, 2.1, .07]} /><meshStandardMaterial color="#8da5c5" roughness={.75} /></mesh>
          {[-.68, .68].map(y => <mesh key={y} position={[-.7, y, .12]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.045, .045, .3, 12]} /><meshStandardMaterial color="#526985" roughness={.65} /></mesh>)}
          {[0, 1, 2, 3].map(i => <mesh key={i} position={[.15, .53 - i * .25, .11]}><boxGeometry args={[i === 0 ? .92 : 1.1, .025, .01]} /><meshStandardMaterial color="#c4cfdf" roughness={.8} /></mesh>)}
          {tabs.map((tab, i) => <mesh key={tab.id} position={[.98, .65 - i * .57, task === tab.id ? .18 : .02]} onClick={event => { event.stopPropagation(); if (!disabled) onTaskChange(tab.id); }}><boxGeometry args={[.42, .39, .06]} /><meshStandardMaterial color={task === tab.id ? "#2b55ba" : "#a6bad7"} roughness={.7} /></mesh>)}
          <mesh position={[.2, -.73, .13]}><boxGeometry args={[.4, .12, .04]} /><meshStandardMaterial color={complete ? "#2b55ba" : "#c4cfdf"} roughness={.75} /></mesh>
        </group>
      </SceneFrame>
    </div>
    <div className="expense-folio-tabs" aria-label="Ay dosyası görevleri">{tabs.map(tab => <button type="button" key={tab.id} disabled={disabled} aria-pressed={task === tab.id} onClick={() => onTaskChange(tab.id)}>{tab.label}</button>)}</div>
    <p className="caption">Dosya yalnızca görevi seçer. Tamlık işareti kayıtlı onayı gösterir.</p>
  </div>;
}
