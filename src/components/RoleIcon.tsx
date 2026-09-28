import type { Role } from '../types'

const ICONS: Record<Role, string> = {
  top: 'lol_role_icons/Top_icon.png',
  jungle: 'lol_role_icons/Jungle_icon.png',
  mid: 'lol_role_icons/Mid_icon.png',
  support: 'lol_role_icons/Support_icon.png',
  bottom: 'lol_role_icons/Bot_icon.png',
}

export function RoleIcon({ role, className }: { role: Role; className?: string }) {
  return <img src={`${import.meta.env.BASE_URL}${ICONS[role]}`} alt="" aria-hidden="true" className={className} />
}
