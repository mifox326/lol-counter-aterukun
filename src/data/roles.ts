import type { Role } from '../types'

export interface RoleDefinition {
  id: Role
  label: string
}

export const ROLES: RoleDefinition[] = [
  { id: 'top', label: 'トップ' },
  { id: 'jungle', label: 'ジャングル' },
  { id: 'mid', label: 'ミッド' },
  { id: 'support', label: 'サポート' },
  { id: 'bottom', label: 'ボット' },
]
