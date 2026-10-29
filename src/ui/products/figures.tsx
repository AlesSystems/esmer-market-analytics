import {money} from "../format";
import {percentText} from "../pages/month-summary";
import type {Pct} from "../../source/month-profit";

/** A dash for the eye and the word for a screen reader; an unknown value is never a zero. */
export function Unknown({text="Bilinmiyor"}:{text?:string}){return <><span aria-hidden="true">—</span><span className="sr-only">{text}</span></>;}
export const amount=(value:string|null)=>value===null?<Unknown/>:money(value);
export const percent=(value:Pct)=>value===null?<Unknown/>:percentText(value);
