import { Modal } from './Modal'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  return (
    <Modal open={open} title="このサイトについて" onClose={onClose}>
      <div className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        <p>
          「LoL かうんたーあてるくん」は、League of Legendsの対戦相手チャンピオンを入力するだけで、
          有利なカウンターピックを素早く確認できるツールです。
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>検索欄に対戦相手のチャンピオン名を入力</li>
          <li>候補から対戦相手のロールを選択</li>
          <li>勝率が高い順にカウンターピック候補と操作難易度が表示されます</li>
        </ol>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          ※ チャンピオン情報はRiot Games公式Data Dragonから取得しています。カウンターピックの勝率・解説は参考用のサンプルデータです。
        </p>
      </div>
    </Modal>
  )
}
