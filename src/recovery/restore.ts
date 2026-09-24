import { access, readFile, rename, rm } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { durableWrite, syncDirectory } from "./files";
import { validateSnapshot } from "./validate";
export type SwitchBoundary = "journal" | "old-moved" | "candidate-moved" | "opened" | "outcome-written";
export type RollbackBoundary = "rollback-planned" | "rollback-renamed" | "rollback-advanced" | "rollback-audited";
type Move={from:string;to:string};
type Journal={version:1;candidate:string;rollback:string;hadOriginal:boolean;outcome:string;identity:string|null;generation:number|null;rollbackPlan?:{uncommitted:string;moves:Move[];next:number}};
type Outcome={version:1;identity:string|null;generation:number|null;at:string;result:"restored"|"rolled-back"};
const exists=async(path:string)=>access(path).then(()=>true,error=>{if(error.code==="ENOENT")return false;throw error;});
const sidecars=["-wal","-shm","-journal"];
const journalPath=(path:string)=>`${path}.restore-journal`;
function journalPaths(path:string,journal:Journal) {
  if (!journal || journal.version!==1 || typeof journal.hadOriginal!=="boolean" || !/^\.esmer-candidate-[a-f0-9-]{36}\.sqlite$/.test(journal.candidate) || !/^\.esmer-rollback-[a-f0-9-]{36}\.sqlite$/.test(journal.rollback) || !/^\.esmer-restore-outcome-[a-f0-9-]{36}\.json$/.test(journal.outcome) || !(journal.identity===null||typeof journal.identity==="string") || !(journal.generation===null||Number.isSafeInteger(journal.generation)&&journal.generation>=0)) throw new Error("RESTORE_RECOVERY_REQUIRED");
  const plan=journal.rollbackPlan;
  if (plan) {
    const allowed=new Set([basename(path),journal.rollback,plan.uncommitted].flatMap(name=>[name,...sidecars.map(suffix=>name+suffix)]));
    if (!/^\.esmer-uncommitted-[a-f0-9-]{36}\.sqlite$/.test(plan.uncommitted) || !Array.isArray(plan.moves) || !Number.isSafeInteger(plan.next) || plan.next<0 || plan.next>plan.moves.length || !plan.moves.every(move=>allowed.has(move.from)&&allowed.has(move.to)&&move.from!==move.to)) throw new Error("RESTORE_RECOVERY_REQUIRED");
  }
  return {candidate:join(dirname(path),journal.candidate),rollback:join(dirname(path),journal.rollback),outcome:join(dirname(path),journal.outcome)};
}
async function readOutcome(path:string,journal:Journal):Promise<Outcome|null> {
  if (!await exists(path)) return null;
  const outcome:Outcome=JSON.parse(await readFile(path,"utf8"));
  if (!outcome || outcome.version!==1 || !["restored","rolled-back"].includes(outcome.result) || outcome.identity!==journal.identity || outcome.generation!==journal.generation) throw new Error("RESTORE_RECOVERY_REQUIRED");
  return outcome;
}
export async function recoverInterruptedSwitch(path:string,fault?:(boundary:RollbackBoundary,index:number)=>void) {
  if (!await exists(journalPath(path))) return;
  const journal:Journal=JSON.parse(await readFile(journalPath(path),"utf8"));
  const {candidate,rollback,outcome}=journalPaths(path,journal);
  const recorded=await readOutcome(outcome,journal);
  if (recorded) {
    if (recorded.result==="restored") validateSnapshot(path);
    else if (await exists(path)!==journal.hadOriginal) throw new Error("RESTORE_RECOVERY_REQUIRED");
  } else {
    if (!journal.rollbackPlan) {
      const moves:Move[]=[],uncommitted=`.esmer-uncommitted-${randomUUID()}.sqlite`;
      if (await exists(rollback)) {
        if (await exists(path)) moves.push({from:basename(path),to:uncommitted});
        for (const suffix of sidecars) {
          if (!await exists(candidate)&&await exists(path+suffix)) moves.push({from:basename(path)+suffix,to:uncommitted+suffix});
          if (await exists(rollback+suffix)) moves.push({from:journal.rollback+suffix,to:basename(path)+suffix});
        }
        moves.push({from:journal.rollback,to:basename(path)});
      } else if (journal.hadOriginal) {
        if (!await exists(path)||!await exists(candidate)) throw new Error("RESTORE_RECOVERY_REQUIRED");
      } else if (!await exists(candidate)&&await exists(path)) {
        moves.push({from:basename(path),to:uncommitted});
        for (const suffix of sidecars) if (await exists(path+suffix)) moves.push({from:basename(path)+suffix,to:uncommitted+suffix});
      }
      journal.rollbackPlan={uncommitted,moves,next:0};
      await durableWrite(journalPath(path),JSON.stringify(journal)); fault?.("rollback-planned",0);
    }
    const plan=journal.rollbackPlan;
    for (;plan.next<plan.moves.length;) {
      const move=plan.moves[plan.next],from=join(dirname(path),move.from),to=join(dirname(path),move.to);
      const source=await exists(from),destination=await exists(to);
      if (source===destination) throw new Error("RESTORE_RECOVERY_REQUIRED");
      if (source) await rename(from,to);
      await syncDirectory(dirname(path)); fault?.("rollback-renamed",plan.next);
      plan.next++;await durableWrite(journalPath(path),JSON.stringify(journal));fault?.("rollback-advanced",plan.next);
    }
    await durableWrite(outcome,JSON.stringify({version:1,identity:journal.identity,generation:journal.generation,at:new Date().toISOString(),result:"rolled-back"} satisfies Outcome));
    fault?.("rollback-audited",plan.next);
  }
  await rm(candidate,{force:true});await rm(journalPath(path));await syncDirectory(dirname(path));
}
export async function restoreCommitted(path:string):Promise<boolean> {
  if (!await exists(journalPath(path))) return false;
  const journal:Journal=JSON.parse(await readFile(journalPath(path),"utf8"));
  return (await readOutcome(journalPaths(path,journal).outcome,journal))?.result==="restored";
}
export async function switchStore(path:string,candidate:string,openCandidate:()=>void,fault?:(boundary:SwitchBoundary)=>void,identity:string|null=null,generation:number|null=null) {
  const rollback=join(dirname(path),`.esmer-rollback-${randomUUID()}.sqlite`);
  const journal:Journal={version:1,candidate:basename(candidate),rollback:basename(rollback),hadOriginal:await exists(path),outcome:`.esmer-restore-outcome-${randomUUID()}.json`,identity,generation};
  const {outcome}=journalPaths(path,journal);
  try {
  await durableWrite(journalPath(path),JSON.stringify(journal));fault?.("journal");
  if (journal.hadOriginal) {
    await rename(path,rollback);
    for (const suffix of sidecars) if (await exists(path+suffix)) await rename(path+suffix,rollback+suffix);
  }
  await syncDirectory(dirname(path));fault?.("old-moved");
  await rename(candidate,path);await syncDirectory(dirname(path));fault?.("candidate-moved");
  validateSnapshot(path);openCandidate();fault?.("opened");
  await durableWrite(outcome,JSON.stringify({version:1,identity,generation,at:new Date().toISOString(),result:"restored"} satisfies Outcome));fault?.("outcome-written");
  await rm(journalPath(path));await syncDirectory(dirname(path));
  } catch(error) {
    if ((await readOutcome(outcome,journal).catch(()=>null))?.result==="restored") throw new Error("RESTORE_COMMITTED_RESTART_REQUIRED");
    throw error;
  }
}
