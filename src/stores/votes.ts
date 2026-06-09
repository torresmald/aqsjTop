import { defineStore } from 'pinia'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Vote, VoteRanking, VotingConfig } from '@/interfaces/vote'
import { formatTelegram, normalizeTelegram } from '@/utils/telegram'

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
  state: () => ({
    votingOpen: true,
    configLoaded: false,
  }),
  actions: {
    async loadVotingConfig() {
      try {
        const configRef = doc(db, 'config', 'voting')
        const snapshot = await getDoc(configRef)
        const data = snapshot.data() as VotingConfig | undefined
        this.votingOpen = data?.open ?? true
      } catch {
        this.votingOpen = true
      } finally {
        this.configLoaded = true
      }
    },

    async submitVote(telegram: string, rankings: VoteRanking[]) {
      if (!this.votingOpen) {
        throw new VoteError('La votación está cerrada.', 'voting_closed')
      }

      const normalized = normalizeTelegram(telegram)
      const voteRef = doc(db, 'votes', normalized)

      try {
        const existing = await getDoc(voteRef)
        if (existing.exists()) {
          throw new VoteError('Este usuario de Telegram ya ha votado.', 'already_voted')
        }

        const vote: Vote = {
          telegram: formatTelegram(telegram),
          rankings,
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
