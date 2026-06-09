<script setup lang="ts">
import { useGamesStore } from '@/stores/games'
import { ref } from 'vue'
import type { Game } from '@/interfaces/game'
const gamesStore = useGamesStore()

const games = gamesStore.games

const selectedGame = ref<Game | null>(null)
</script>
<template>
  <div>
    <v-autocomplete v-model="selectedGame" :items="games" item-title="name" item-value="id" />
  </div>
</template>
<style scoped></style>
