import type { ReactNode } from "react";

/** One stroke set on a 24px grid (outline paths after Lucide, ISC). Icons are decorative: the label beside each carries the meaning. */
function Icon({ children, className }: { children: ReactNode; className?: string }) {
  return <svg className={className ? `ico ${className}` : "ico"} viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}
type P = { className?: string };
export const GearIcon = ({ className }: P) => <Icon className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></Icon>;
export const ChevronLeftIcon = ({ className }: P) => <Icon className={className}><path d="m14.5 6-6 6 6 6"/></Icon>;
export const ChevronRightIcon = ({ className }: P) => <Icon className={className}><path d="m9.5 6 6 6-6 6"/></Icon>;
export const ChevronDownIcon = ({ className }: P) => <Icon className={className}><path d="m6 9.5 6 6 6-6"/></Icon>;
export const ChevronUpIcon = ({ className }: P) => <Icon className={className}><path d="m6 14.5 6-6 6 6"/></Icon>;
export const ArrowUpIcon = ({ className }: P) => <Icon className={className}><path d="M12 19V5M6 11l6-6 6 6"/></Icon>;
export const ArrowDownIcon = ({ className }: P) => <Icon className={className}><path d="M12 5v14M6 13l6 6 6-6"/></Icon>;
export const SearchIcon = ({ className }: P) => <Icon className={className}><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></Icon>;
export const CloseIcon = ({ className }: P) => <Icon className={className}><path d="M6 6l12 12M18 6 6 18"/></Icon>;
export const InfoIcon = ({ className }: P) => <Icon className={className}><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".4" fill="currentColor"/></Icon>;
export const AlertIcon = ({ className }: P) => <Icon className={className}><path d="M12 4 3 19.5h18z"/><path d="M12 10v4.5"/><circle cx="12" cy="17" r=".4" fill="currentColor"/></Icon>;
export const CheckIcon = ({ className }: P) => <Icon className={className}><path d="m5 12.5 4.5 4.5L19 7.5"/></Icon>;
export const DownloadIcon = ({ className }: P) => <Icon className={className}><path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14"/></Icon>;
export const UploadIcon = ({ className }: P) => <Icon className={className}><path d="M12 15.5v-11M7 9l5-5 5 5M5 19.5h14"/></Icon>;
export const ShieldIcon = ({ className }: P) => <Icon className={className}><path d="M12 3.5 5 6.5v5c0 4.4 3 7.7 7 9 4-1.3 7-4.6 7-9v-5z"/><path d="m9 12 2.2 2.2L15.5 10"/></Icon>;
export const TextSizeIcon = ({ className }: P) => <Icon className={className}><path d="M5 7V5h14v2M12 5v14M9 19h6"/></Icon>;
export const DatabaseIcon = ({ className }: P) => <Icon className={className}><ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/></Icon>;
export const ArrowRightIcon = ({ className }: P) => <Icon className={className}><path d="M5 12h14M13 6l6 6-6 6"/></Icon>;
export const FileIcon = ({ className }: P) => <Icon className={className}><path d="M14 3.5H7a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7.5z"/><path d="M14 3.5v4h4M9.5 13h5M9.5 16.5h5"/></Icon>;
