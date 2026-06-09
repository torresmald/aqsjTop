<template>
  <header class="app-header">
    <router-link to="/" class="app-header__brand">
      <img src="/profile.jpg" alt="AQSJ Top" class="app-header__logo" />
      <span class="app-header__title">AQSJ Top</span>
    </router-link>

    <nav class="app-header__nav d-none d-md-flex">
      <v-btn variant="text" to="/" :active="isVoteActive">Votar</v-btn>
      <v-btn variant="text" to="/resultados" :active="isResultsActive">Resultados</v-btn>
      <v-btn
        variant="text"
        href="https://www.youtube.com/aquesejuega"
        target="_blank"
        rel="noopener noreferrer"
      >
        YouTube
      </v-btn>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const isVoteActive = computed(() => route.path === '/')
const isResultsActive = computed(() => route.path === '/resultados')
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgb(var(--v-theme-surface));
  padding-top: max(12px, env(safe-area-inset-top));
}

.app-header__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  min-width: 0;
}

.app-header__logo {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}

.app-header__title {
  font-size: 1.25rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 600px) {
  .app-header {
    padding: 16px 24px;
  }

  .app-header__logo {
    width: 40px;
    height: 40px;
  }

  .app-header__title {
    font-size: 1.5rem;
  }
}
</style>
