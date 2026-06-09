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
  <v-container class="page-container" max-width="800">
    <div class="page-header">
      <h1 class="page-title">Resultados</h1>
      <p class="page-subtitle">Clasificación acumulada de todos los votos.</p>
    </div>

    <v-card v-if="loading" class="page-card">
      <v-progress-linear indeterminate color="primary" />
      <p class="text-center mt-4 text-medium-emphasis">Cargando resultados...</p>
    </v-card>

    <v-alert v-else-if="errorMessage" type="error" variant="tonal" :text="errorMessage" />

    <template v-else>
      <v-alert type="info" variant="tonal" class="mb-4" :text="`${totalVotes} votos registrados`" />

      <v-card v-if="topResults.length === 0" class="page-card text-center text-medium-emphasis">
        Aún no hay votos. ¡Sé el primero en participar!
        <div class="mt-4">
          <v-btn color="primary" variant="flat" block class="d-sm-inline-flex" to="/">Votar ahora</v-btn>
        </div>
      </v-card>

      <v-card v-else class="results-card">
        <v-list lines="two">
          <v-list-item
            v-for="(result, index) in topResults"
            :key="result.gameId"
            class="results-item"
          >
            <template #prepend>
              <div class="results-item__rank" :class="{ 'results-item__rank--top': index < 3 }">
                {{ index + 1 }}
              </div>
            </template>
            <v-list-item-title class="results-item__name">{{ result.gameName }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ result.totalPoints }} pts · {{ result.votes }} votos
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card>
    </template>
  </v-container>
</template>

<style scoped>
.page-container {
  padding: 16px 12px 24px;
}

@media (min-width: 600px) {
  .page-container {
    padding: 24px 16px 32px;
  }
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 8px;
}

.page-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 0.9rem;
  line-height: 1.5;
}

@media (min-width: 600px) {
  .page-title {
    font-size: 2rem;
  }
}

.page-card {
  padding: 16px;
}

@media (min-width: 600px) {
  .page-card {
    padding: 24px;
  }
}

.results-card {
  overflow: hidden;
}

.results-item {
  padding: 12px 16px !important;
}

.results-item__rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(var(--v-theme-on-surface), 0.08);
  font-weight: 700;
  font-size: 0.9rem;
  margin-right: 12px;
  flex-shrink: 0;
}

.results-item__rank--top {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.results-item__name {
  white-space: normal !important;
  word-break: break-word;
  line-height: 1.3 !important;
  font-size: 0.95rem !important;
}

@media (min-width: 600px) {
  .results-item__name {
    font-size: 1rem !important;
  }
}
</style>
