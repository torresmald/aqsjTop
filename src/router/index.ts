import { createRouter, createWebHistory } from 'vue-router'
import Top10 from '@/components/Top10.vue'
import ResultsView from '@/views/ResultsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'vote', component: Top10 },
    { path: '/resultados', name: 'results', component: ResultsView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
