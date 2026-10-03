import type { ReportSummary } from '../../reports/contracts';
import { SceneFrame } from './SceneFrame';
export function ReportArchiveScene({ reports, selectedId, disabled, onSelect }: { reports: ReportSummary[]; selectedId?: string; disabled: boolean; onSelect: (id: string) => void }) {
  return <div className="report-archive-scene" data-scene="upright-archive"><div role="img" aria-label="Dik rapor arşivi; kaydedilmiş sürümleri seçen gezinme nesnesi">
    <SceneFrame camera={{ position: [3, 1.8, 5], zoom: 66 }}><group rotation={[0, -.18, .03]}>
      <mesh position={[0, 0, -.24]}><boxGeometry args={[1.65, 1.65, .055]} /><meshStandardMaterial color="#b3c7e7" roughness={.7} /></mesh>
      <mesh position={[-.83, -.12, 0]} rotation={[0, .18, 0]}><boxGeometry args={[.07, 1.4, .58]} /><meshStandardMaterial color="#728ba9" roughness={.7} /></mesh>
      {reports.slice(0, 3).map((row, index) => <mesh key={row.id} position={[-.5 + index * .5, .32 + index * .04, selectedId === row.id ? .42 : .12]} onClick={event => { event.stopPropagation(); if(!disabled) onSelect(row.id); }}><boxGeometry args={[selectedId === row.id ? .62 : .44, 1.45, .045]} /><meshStandardMaterial color={selectedId === row.id ? '#2b55ba' : '#e1e8f3'} roughness={.7} /></mesh>)}
      <mesh position={[0, -.25, .28]} rotation={[-.09, 0, 0]}><boxGeometry args={[1.65, 1.05, .06]} /><meshStandardMaterial color="#afc6e7" roughness={.7} /></mesh>
      <mesh position={[-.45, .36, .28]}><boxGeometry args={[.68, .18, .07]} /><meshStandardMaterial color="#afc6e7" roughness={.7} /></mesh>
    </group></SceneFrame></div><div className="report-sleeve-actions" aria-label="Arşiv nesnesi gezinmesi">{reports.slice(0, 3).map(row => <button type="button" key={row.id} disabled={disabled} aria-pressed={selectedId === row.id} onClick={() => onSelect(row.id)}>{row.reason} · sürümü incele</button>)}</div><p className="report-scene-caption">Nesne tutar göstermez. En fazla üç sürüm; tüm kayıtlar listede.</p></div>;
}
