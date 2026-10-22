import type {Availability,RequestError} from "../domain/contracts";

/** The four sidebar sections, in order. Each one owns exactly one page component in src/ui/pages. */
export const sections=[["month","Bu ay"],["products","Ürünler"],["expenses","Giderler"],["reports","Rapor ve Excel"]] as const;
export type Section=typeof sections[number][0];
/** Rapor ve Excel sub-views. */
export type ReportView="report"|"data"|"invoices";
/** Optional state carried by a navigation, e.g. the product to open on Ürünler. */
export type NavigationState={productId?:string;reportView?:ReportView};
export type Coverage={from:string;to:string};

/** Every page receives these props and nothing else. */
export type PageProps={
 /** Selected month (YYYY-MM); null until preferences and the data range are known. */
 month:string|null;
 /** Changes the month for every page (remembered across launches). Already wrapped in the expense draft guard. */
 onMonth:(month:string)=>void;
 /** First and last recorded day (YYYY-MM-DD) of the imported source package, when one exists. */
 coverage:Coverage|null;
 availability:Availability|RequestError|undefined;
 /** False while Ayarlar or recovery covers the page; pages should not start reads then. */
 active:boolean;
 /** State passed by the navigation that opened this page. A new object on each navigation. */
 state:NavigationState;
 /** Opens another section (guarded by expense draft protection). */
 navigate:(section:Section,state?:NavigationState)=>void;
 openSettings:()=>void;
 openRecovery:()=>void;
 /** Re-reads availability and the data range after a change made from a page. */
 refresh:()=>void;
};
