import type { JobOutcome, OperationStatus } from "../domain/contracts";
type ActiveOperation = Extract<OperationStatus, {status: "operation"}>;
export class OperationJobs {
  private current: { state: ActiveOperation; cancellation: SharedArrayBuffer } | undefined;
  private nextId = 0;
  status(): OperationStatus { return this.current ? { ...this.current.state } : { status: "idle" }; }
  cancel({id}: {id: number}): {status: "cancelling"} | {status: "idle"} {
    if (!this.current || this.current.state.id !== id) return {status: "idle"};
    Atomics.store(new Int32Array(this.current.cancellation), 0, 1);
    this.current.state.cancelling = true;
    return {status: "cancelling"};
  }
  progress(id: number, phase: string, completed: number, total: number) {
    if (this.current?.state.id === id) Object.assign(this.current.state, {phase, completed, total});
  }
  async run<T>(operation: ActiveOperation["operation"], action: (job: {id: number; cancellation: SharedArrayBuffer}) => Promise<T>): Promise<T | JobOutcome> {
    if (this.current) return {status: "busy"};
    const id = ++this.nextId, cancellation = new SharedArrayBuffer(4);
    this.current = {state: {status: "operation", id, operation, phase: operation === "importPackage" ? "selecting" : "queued", completed: 0, total: 0, cancelling: false}, cancellation};
    try { return await action({id, cancellation}); }
    finally { this.current = undefined; }
  }
}
