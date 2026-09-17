import type { Champion, Role } from '../types'
import { ROLES } from '../data/roles'
import { Modal } from './Modal'
import { RoleIcon } from './RoleIcon'

interface RoleModalProps {
  open: boolean
  champion: Champion | null
  onClose: () => void
  onSelect: (role: Role) => void
}

export function RoleModal({ open, champion, onClose, onSelect }: RoleModalProps) {
  return (
    <Modal open={open} title="対戦相手ロールポジション" onClose={onClose}>
      {champion && (
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          {champion.name} のロールを選択してください
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        {ROLES.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => onSelect(role.id)}
            className="flex flex-1 flex-col items-center gap-2 rounded-lg border border-slate-200 py-3 text-slate-600 transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-600 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-sky-900/30 dark:hover:text-sky-300"
          >
            <RoleIcon role={role.id} className="h-7 w-7" />
            <span className="text-xs font-semibold">{role.label}</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}
