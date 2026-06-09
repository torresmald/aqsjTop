import { defineStore } from 'pinia'
import type { Game } from '@/interfaces/game'
import games from '../data/games.json'
export const useGamesStore = defineStore('games', {
  state: () => ({
    games: games as Game[],
  }),
  actions: {},
})
