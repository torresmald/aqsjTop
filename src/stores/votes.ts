import { defineStore } from 'pinia'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Vote, VoteRanking } from '@/interfaces/vote'
import { normalizeRankings } from '@/utils/gameAliases'
import { formatTelegram, normalizeTelegram } from '@/utils/telegram'
import { useConfigStore } from '@/stores/config'

export class VoteError extends Error {
  constructor(
    message: string,
    public code: 'already_voted' | 'voting_closed' | 'firebase_error',
  ) {
    super(message)
    this.name = 'VoteError'
  }
}

export const useVotesStore = defineStore('votes', {
  actions: {
    async submitVote(telegram: string, rankings: VoteRanking[]) {
      const configStore = useConfigStore()

      if (!configStore.votingOpen) {
        throw new VoteError('La votación está cerrada.', 'voting_closed')
      }

      const normalized = normalizeTelegram(telegram)
      const voteRef = doc(db, 'votes', normalized)
      const resolvedRankings = normalizeRankings(rankings, configStore.gameAliases)

      try {
        const existing = await getDoc(voteRef)
        if (existing.exists()) {
          throw new VoteError('Este usuario de Telegram ya ha votado.', 'already_voted')
        }

        const vote: Vote = {
          telegram: formatTelegram(telegram),
          rankings: resolvedRankings,
          createdAt: serverTimestamp(),
        }

        await setDoc(voteRef, vote)
      } catch (error) {
        if (error instanceof VoteError) throw error
        throw new VoteError('No se pudo guardar el voto. Inténtalo de nuevo.', 'firebase_error')
      }
    },
  },
})
