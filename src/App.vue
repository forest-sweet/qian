<template>
  <div class="app-container">
    <el-container>
      <el-header height="60px" class="app-header">
        <div class="header-content">
          <h1 class="app-title">个人任务管理与奖励激励系统</h1>
          <el-menu
            :default-active="activeMenu"
            class="el-menu-demo"
            mode="horizontal"
            @select="handleMenuSelect"
          >
            <el-menu-item index="/task-management">任务管理</el-menu-item>
            <el-menu-item index="/reward-center">奖励中心</el-menu-item>
            <el-menu-item index="/store">商城</el-menu-item>
            <el-menu-item index="/statistics">统计分析</el-menu-item>
          </el-menu>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => {
  return route.path
})

const handleMenuSelect = (key: string) => {
  router.push(key)
}
</script>

<style scoped>
.app-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.app-header {
  background-color: #409EFF;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.app-title {
  font-size: 20px;
  font-weight: bold;
  margin: 0;
}

.el-menu-demo {
  background-color: transparent;
  border-bottom: none;
}

.el-menu-item {
  color: white;
}

.el-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.el-menu-item.is-active {
  color: white;
  background-color: rgba(255, 255, 255, 0.2);
}

.app-main {
  padding: 20px;
  overflow-y: auto;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
</style>