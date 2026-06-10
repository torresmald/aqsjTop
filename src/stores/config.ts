import { defineStore } from 'pinia'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { GameAliasMap } from '@/interfaces/gameAlias'
import type { VotingConfig } from '@/interfaces/vote'

export const useConfigStore = defineStore('config', {
  state: () => ({
    votingOpen: true,
    gameAliases: {} as GameAliasMap,
    loaded: false,
  }),

  getters: {
    aliasGameIds(state): Set<number> {
      return new Set(Object.keys(state.gameAliases).map((id) => Number(id)))
    },
  },

  actions: {
    async load() {
      try {
        const [votingSnapshot, aliasesSnapshot] = await Promise.all([
          getDoc(doc(db, 'config', 'voting')),
          getDoc(doc(db, 'config', 'gameAliases')),
        ])

        const voting = votingSnapshot.data() as VotingConfig | undefined
        this.votingOpen = voting?.open ?? true
        this.gameAliases = (aliasesSnapshot.data() ?? {}) as GameAliasMap
      } catch {
        this.votingOpen = true
        this.gameAliases = {}
      } finally {
        this.loaded = true
      }
    },
  },
})
