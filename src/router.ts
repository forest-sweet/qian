import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/task-management'
    },
    {
      path: '/task-management',
      name: 'TaskManagement',
      component: () => import('./views/TaskManagement/index.vue'),
      meta: {
        title: '任务管理'
      }
    },
    {
      path: '/reward-center',
      name: 'RewardCenter',
      component: () => import('./views/RewardCenter/index.vue'),
      meta: {
        title: '奖励中心'
      }
    },
    {
      path: '/statistics',
      name: 'Statistics',
      component: () => import('./views/Statistics/index.vue'),
      meta: {
        title: '统计分析'
      }
    }
  ]
})

router.beforeEach((to, _from, next) => {
  document.title = to.meta.title as string || '个人任务管理与奖励激励系统'
  next()
})

export default router