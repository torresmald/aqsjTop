<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Vote } from '@/interfaces/vote'

interface GameScore {
  gameId: number
  gameName: string
  totalPoints: number
  votes: number
}

const loading = ref(true)
const errorMessage = ref('')
const totalVotes = ref(0)
const scores = ref<GameScore[]>([])

const topResults = computed(() => scores.value.slice(0, 10))

function aggregateVotes(votes: Vote[]) {
  const totals = new Map<number, GameScore>()

  for (const vote of votes) {
    for (const ranking of vote.rankings) {
      const current = totals.get(ranking.gameId)
      if (current) {
        current.totalPoints += ranking.points
        current.votes += 1
      } else {
        totals.set(ranking.gameId, {
          gameId: ranking.gameId,
          gameName: ranking.gameName,
          totalPoints: ranking.points,
          votes: 1,
        })
      }
    }
  }

  return [...totals.values()].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    return a.gameName.localeCompare(b.gameName, 'es')
  })
}

onMounted(async () => {
  try {
    const snapshot = await getDocs(collection(db, 'votes'))
    const votes = snapshot.docs.map((doc) => doc.data() as Vote)
    totalVotes.value = votes.length
    scores.value = aggregateVotes(votes)
  } catch {
    errorMessage.value = 'No se pudieron cargar los resultados.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <v-container class="py-6" max-width="800">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold mb-2">Resultados</h1>
      <p class="text-medium-emphasis">Clasificación acumulada de todos los votos.</p>
    </div>

    <v-card v-if="loading" class="pa-6">
      <v-progress-linear indeterminate color="primary" />
      <p class="text-center mt-4 text-medium-emphasis">Cargando resultados...</p>
    </v-card>

    <v-alert v-else-if="errorMessage" type="error" variant="tonal" :text="errorMessage" />

    <template v-else>
      <v-alert type="info" variant="tonal" class="mb-4" :text="`${totalVotes} votos registrados`" />

      <v-card v-if="topResults.length === 0" class="pa-6 text-center text-medium-emphasis">
        Aún no hay votos. ¡Sé el primero en participar!
        <div class="mt-4">
          <v-btn color="primary" variant="flat" to="/">Votar ahora</v-btn>
        </div>
      </v-card>

      <v-card v-else>
        <v-list lines="two">
          <v-list-item
            v-for="(result, index) in topResults"
            :key="result.gameId"
            :title="`${index + 1}. ${result.gameName}`"
            :subtitle="`${result.totalPoints} puntos · ${result.votes} apariciones`"
          />
        </v-list>
      </v-card>
    </template>
  </v-container>
</template>
