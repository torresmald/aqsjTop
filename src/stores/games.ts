import { defineStore } from 'pinia'
import type { Game } from '@/interfaces/game'
import games from '../data/games.json'
import { useConfigStore } from '@/stores/config'

export const useGamesStore = defineStore('games', {
  state: () => ({
    games: games as Game[],
  }),

  getters: {
    selectableGames(): Game[] {
      const configStore = useConfigStore()
      if (!configStore.aliasGameIds.size) return this.games

      return this.games.filter((game) => !configStore.aliasGameIds.has(game.id))
    },
  },
})
