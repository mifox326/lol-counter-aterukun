import type { Role } from '../types'

const PATHS: Record<Role, string> = {
  top: 'M12 3l7 3.5v6c0 4.5-3 7.7-7 9.5-4-1.8-7-5-7-9.5v-6L12 3z',
  jungle: 'M12 4c-4.5 2-7 5.2-7 9 0 3.6 2.9 6.5 7 7 4.1-.5 7-3.4 7-7 0-3.8-2.5-7-7-9z',
  mid: 'M12 2l3.5 6.5L22 12l-6.5 3.5L12 22l-3.5-6.5L2 12l6.5-3.5L12 2z',
  support: 'M12 20s-7-4-9.5-9C.8 7.3 2.7 4 6 4c2.4 0 4.5 1.6 6 4 1.5-2.4 3.6-4 6-4 3.3 0 5.2 3.3 3.5 7-2.5 5-9.5 9-9.5 9z',
  bottom: 'M12 2v4m0 12v4m10-10h-4M6 12H2m14.9-6.9-2.8 2.8M9.9 14.1l-2.8 2.8m0-9.8 2.8 2.8m7 7 2.8 2.8M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
}

export function RoleIcon({ role, className }: { role: Role; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[role]} />
    </svg>
  )
}
