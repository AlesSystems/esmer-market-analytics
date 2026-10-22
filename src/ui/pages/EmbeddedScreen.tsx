import {useContext,useMemo,type ReactNode} from "react";
import {AppFrame} from "../frame";

/** Screens of the older source and financial workspaces, now hosted inside Rapor ve Excel. */
export type Destination="monthly"|"overview"|"purchasing"|"expenses"|"versions";

/** Replaces the old per-workspace shell: no sidebar, no month picker (the app shell owns both). */
export function EmbeddedScreen({controls,children}:{destination?:Destination;navigate?:(destination:Destination)=>void;controls?:ReactNode;children:ReactNode}) {
 return <div className="embedded-screen">{controls&&<div className="embedded-controls">{controls}</div>}{children}</div>;
}

/** Hosts an older workspace and opens one of its screens; a new `sequence` re-opens it. */
export function EmbeddedFrame({destination,sequence,children}:{destination:Destination;sequence:number;children:ReactNode}) {
 const frame=useContext(AppFrame);
 const value=useMemo(()=>frame&&{...frame,launchRequest:{destination,sequence}},[frame,destination,sequence]);
 return <AppFrame.Provider value={value}>{children}</AppFrame.Provider>;
}
