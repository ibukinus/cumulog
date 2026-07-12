import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }

export function CheckIcon(props: IconProps) { return <svg {...base} {...props}><path d="m5 12 4 4L19 6" /></svg> }
export function AlertIcon(props: IconProps) { return <svg {...base} {...props}><path d="M12 9v4M12 17h.01" /><path d="m10.3 3.8-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z" /></svg> }
export function InfoIcon(props: IconProps) { return <svg {...base} {...props}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg> }
export function LockIcon(props: IconProps) { return <svg {...base} {...props}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg> }
export function SearchIcon(props: IconProps) { return <svg {...base} {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg> }
export function RefreshIcon(props: IconProps) { return <svg {...base} {...props}><path d="M20 11a8 8 0 0 0-14.7-4L3 10" /><path d="M3 5v5h5M4 13a8 8 0 0 0 14.7 4L21 14" /><path d="M21 19v-5h-5" /></svg> }
export function XIcon(props: IconProps) { return <svg {...base} {...props}><path d="m6 6 12 12M18 6 6 18" /></svg> }
export function CloudIcon(props: IconProps) { return <svg {...base} {...props}><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /></svg> }
export function ExternalLinkIcon(props: IconProps) { return <svg {...base} {...props}><path d="M15 4h5v5M20 4l-9 9" /><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></svg> }
