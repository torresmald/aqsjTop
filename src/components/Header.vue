<template>
  <header class="flex justify-between items-center p-4 border-b">
    <div class="flex items-center gap-3">
      <router-link to="/">
        <img src="/profile.jpg" alt="AQSJ Top" class="w-10 h-10 rounded-full" />
      </router-link>
      <router-link to="/" class="text-2xl font-bold no-underline text-inherit">AQSJ Top</router-link>
    </div>

    <nav class="flex gap-2">
      <v-btn variant="text" to="/">Votar</v-btn>
      <v-btn variant="text" to="/resultados">Resultados</v-btn>
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
<script setup lang="ts"></script>
<style scoped></style>
