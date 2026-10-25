import {useContext,useMemo,type ReactNode} from "react";
import {AppFrame} from "../frame";

/** Screens of the older source and financial workspaces, now hosted inside Rapor ve Excel. */
export type Destination="monthly"|"overview"|"purchasing"|"expenses"|"versions";

/** Replaces the old per-workspace shell: no sidebar, no month picker (the app shell owns both). */
export function EmbeddedScreen({controls,children}:{destination?:Destination;navigate?:(destination:Destination)=>void;controls?:ReactNode;children:ReactNode}) {
 return <div className="embedded-screen">{controls&&<div className="embedded-controls">{controls}</div>}{children}</div>;
}

/** Hosts an older workspace and opens one of its screens; a new `sequence` re-opens it. */
export function EmbeddedFrame({destination,sequence,active,children}:{destination:Destination;sequence:number;active:boolean;children:ReactNode}) {
 const frame=useContext(AppFrame);
 // While hidden behind another section the hosted workspace sees itself as away, so it starts no reads or key handlers.
 const value=useMemo(()=>frame&&{...frame,view:active?frame.view:"settings" as const,launchRequest:{destination,sequence}},[frame,destination,sequence,active]);
 return <AppFrame.Provider value={value}>{children}</AppFrame.Provider>;
}
