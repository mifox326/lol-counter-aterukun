import { useEffect, useMemo, useState } from 'react'
import { ChampionSearch } from './components/ChampionSearch'
import { CounterList } from './components/CounterList'
import { Header } from './components/Header'
import { HelpModal } from './components/HelpModal'
import { RoleModal } from './components/RoleModal'
import { getCounterPicks } from './data/counterEngine'
import { useChampions } from './hooks/useChampions'
import type { Champion, Role } from './types'

function App() {
  const [dark, setDark] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  const { champions, loading, error } = useChampions()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const counters = useMemo(() => {
    if (!selectedChampion || !selectedRole) return []
    return getCounterPicks(selectedChampion, selectedRole, champions)
  }, [selectedChampion, selectedRole, champions])

  function handleSelectChampion(champion: Champion) {
    setSelectedChampion(champion)
    setSelectedRole(null)
    setRoleModalOpen(true)
  }

  function handleSelectRole(role: Role) {
    setSelectedRole(role)
    setRoleModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-900 dark:text-slate-100">
      <Header dark={dark} onToggleDark={() => setDark((d) => !d)} onHelp={() => setHelpOpen(true)} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          <ChampionSearch
            champions={champions}
            loading={loading}
            error={error}
            selectedChampion={selectedChampion}
            selectedRole={selectedRole}
            onSelect={handleSelectChampion}
            onChangeRole={() => setRoleModalOpen(true)}
          />
          <CounterList counters={counters} hasSelection={Boolean(selectedChampion && selectedRole)} />
        </div>
      </main>

      <RoleModal
        open={roleModalOpen}
        champion={selectedChampion}
        onClose={() => setRoleModalOpen(false)}
        onSelect={handleSelectRole}
      />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}

export default App
