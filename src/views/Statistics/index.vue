<template>
  <div class="statistics-container">
    <el-card class="stats-header-card">
      <div class="stats-header">
        <h2 class="page-title">统计分析</h2>
        <div class="date-range-selector">
          <el-form-item label="时间范围">
            <el-select v-model="dateRange" @change="updateCharts">
              <el-option label="最近7天" value="7" />
              <el-option label="最近30天" value="30" />
              <el-option label="最近90天" value="90" />
              <el-option label="今年" value="year" />
            </el-select>
          </el-form-item>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="stats-card">
          <h3 class="section-title">任务完成情况</h3>
          <div class="chart-container" ref="taskCompletionChartRef"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="stats-card">
          <h3 class="section-title">奖励获取趋势</h3>
          <div class="chart-container" ref="rewardTrendChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card class="stats-card">
          <h3 class="section-title">任务优先级分布</h3>
          <div class="chart-container" ref="taskPriorityChartRef"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="stats-card">
          <h3 class="section-title">任务分类分布</h3>
          <div class="chart-container" ref="taskCategoryChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="stats-card" style="margin-top: 20px;">
      <h3 class="section-title">任务完成率与奖励获取关联分析</h3>
      <div class="chart-container large" ref="correlationChartRef"></div>
    </el-card>

    <el-card class="stats-summary-card" style="margin-top: 20px;">
      <h3 class="section-title">统计摘要</h3>
      <div class="stats-grid">
        <el-statistic :value="totalTasks" label="总任务数" />
        <el-statistic :value="completedTasks" label="已完成任务" />
        <el-statistic :value="pendingTasks" label="待完成任务" />
        <el-statistic :value="completionRate.toFixed(1) + '%'" label="完成率" />
        <el-statistic :value="totalRewards" label="总奖励获取(元)" />
        <el-statistic :value="averageRewardPerTask.toFixed(1)" label="平均任务奖励(元)" />
        <el-statistic :value="currentBalance" label="当前余额(元)" />
        <el-statistic :value="rewardTrend.length" label="数据统计天数" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { useRewardStore } from '@/stores/rewardStore'
import * as echarts from 'echarts'

const taskStore = useTaskStore()
const rewardStore = useRewardStore()

// 响应式数据
const dateRange = ref('7')

// 图表引用
const taskCompletionChartRef = ref<HTMLElement>()
const rewardTrendChartRef = ref<HTMLElement>()
const taskPriorityChartRef = ref<HTMLElement>()
const taskCategoryChartRef = ref<HTMLElement>()
const correlationChartRef = ref<HTMLElement>()

// 图表实例
let taskCompletionChart: echarts.ECharts | null = null
let rewardTrendChart: echarts.ECharts | null = null
let taskPriorityChart: echarts.ECharts | null = null
let taskCategoryChart: echarts.ECharts | null = null
let correlationChart: echarts.ECharts | null = null

// 计算属性
const totalTasks = computed(() => taskStore.totalTasks)
const completedTasks = computed(() => taskStore.completedTasks)
const pendingTasks = computed(() => taskStore.pendingTasks)
const completionRate = computed(() => taskStore.completionRate)
const currentBalance = computed(() => rewardStore.currentBalance)
const totalRewards = computed(() => {
  return rewardStore.rewardRecords.reduce((total, record) => total + record.amount, 0)
})
const averageRewardPerTask = computed(() => {
  if (completedTasks.value === 0) return 0
  const taskRewards = rewardStore.rewardRecords.filter(record => record.type === 'task_completion')
  const totalTaskRewards = taskRewards.reduce((total, record) => total + record.amount, 0)
  return totalTaskRewards / completedTasks.value
})

// 奖励趋势数据
const rewardTrend = computed(() => {
  return rewardStore.getRewardTrend(Number(dateRange.value))
})

// 任务完成趋势数据
const taskCompletionTrend = computed(() => {
  const days = Number(dateRange.value)
  const trendData: { date: string; completed: number }[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const dayTasks = taskStore.tasks.filter(task => {
      return task.completedAt?.startsWith(dateStr)
    })

    trendData.push({ date: dateStr, completed: dayTasks.length })
  }

  return trendData
})

// 任务优先级分布
const taskPriorityDistribution = computed(() => {
  const distribution = {
    low: 0,
    medium: 0,
    high: 0
  }

  taskStore.tasks.forEach(task => {
    distribution[task.priority]++
  })

  return [
    { name: '低优先级', value: distribution.low },
    { name: '中优先级', value: distribution.medium },
    { name: '高优先级', value: distribution.high }
  ]
})

// 任务分类分布
const taskCategoryDistribution = computed(() => {
  const categoryMap = new Map<string, number>()

  taskStore.tasks.forEach(task => {
    const count = categoryMap.get(task.category) || 0
    categoryMap.set(task.category, count + 1)
  })

  return Array.from(categoryMap.entries()).map(([name, value]) => ({
    name,
    value
  }))
})

// 初始化图表
const initCharts = () => {
  nextTick(() => {
    initTaskCompletionChart()
    initRewardTrendChart()
    initTaskPriorityChart()
    initTaskCategoryChart()
    initCorrelationChart()
  })
}

// 初始化任务完成图表
const initTaskCompletionChart = () => {
  if (taskCompletionChartRef.value) {
    taskCompletionChart = echarts.init(taskCompletionChartRef.value)
    updateTaskCompletionChart()
  }
}

// 初始化奖励趋势图表
const initRewardTrendChart = () => {
  if (rewardTrendChartRef.value) {
    rewardTrendChart = echarts.init(rewardTrendChartRef.value)
    updateRewardTrendChart()
  }
}

// 初始化任务优先级图表
const initTaskPriorityChart = () => {
  if (taskPriorityChartRef.value) {
    taskPriorityChart = echarts.init(taskPriorityChartRef.value)
    updateTaskPriorityChart()
  }
}

// 初始化任务分类图表
const initTaskCategoryChart = () => {
  if (taskCategoryChartRef.value) {
    taskCategoryChart = echarts.init(taskCategoryChartRef.value)
    updateTaskCategoryChart()
  }
}

// 初始化关联分析图表
const initCorrelationChart = () => {
  if (correlationChartRef.value) {
    correlationChart = echarts.init(correlationChartRef.value)
    updateCorrelationChart()
  }
}

// 更新所有图表
const updateCharts = () => {
  updateTaskCompletionChart()
  updateRewardTrendChart()
  updateTaskPriorityChart()
  updateTaskCategoryChart()
  updateCorrelationChart()
}

// 更新任务完成图表
const updateTaskCompletionChart = () => {
  if (!taskCompletionChart) return

  const option = {
    title: {
      text: '任务完成趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>完成任务数: {c}'
    },
    xAxis: {
      type: 'category',
      data: taskCompletionTrend.value.map(item => item.date),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '完成任务数'
    },
    series: [{
      data: taskCompletionTrend.value.map(item => item.completed),
      type: 'line',
      smooth: true,
      lineStyle: {
        color: '#409EFF'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: 'rgba(64, 158, 255, 0.5)'
          },
          {
            offset: 1,
            color: 'rgba(64, 158, 255, 0.1)'
          }
        ])
      }
    }]
  }

  taskCompletionChart.setOption(option)
}

// 更新奖励趋势图表
const updateRewardTrendChart = () => {
  if (!rewardTrendChart) return

  const option = {
    title: {
      text: '奖励获取趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>奖励获取: {c} 元'
    },
    xAxis: {
      type: 'category',
      data: rewardTrend.value.map(item => item.date),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '奖励(元)'
    },
    series: [{
      data: rewardTrend.value.map(item => item.amount),
      type: 'bar',
      itemStyle: {
        color: '#E6A23C'
      }
    }]
  }

  rewardTrendChart.setOption(option)
}

// 更新任务优先级图表
const updateTaskPriorityChart = () => {
  if (!taskPriorityChart) return

  const option = {
    title: {
      text: '任务优先级分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [{
      name: '优先级',
      type: 'pie',
      radius: '60%',
      data: taskPriorityDistribution.value,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      itemStyle: {
        color: function(params: any) {
          const colors = ['#67C23A', '#E6A23C', '#F56C6C']
          return colors[params.dataIndex]
        }
      }
    }]
  }

  taskPriorityChart.setOption(option)
}

// 更新任务分类图表
const updateTaskCategoryChart = () => {
  if (!taskCategoryChart) return

  const option = {
    title: {
      text: '任务分类分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [{
      name: '分类',
      type: 'pie',
      radius: '60%',
      data: taskCategoryDistribution.value,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }

  taskCategoryChart.setOption(option)
}

// 更新关联分析图表
const updateCorrelationChart = () => {
  if (!correlationChart) return

  const option = {
    title: {
      text: '任务完成率与奖励获取关联分析',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['完成任务数', '奖励获取'],
      top: 30
    },
    xAxis: {
      type: 'category',
      data: rewardTrend.value.map(item => item.date),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '完成任务数',
        position: 'left'
      },
      {
        type: 'value',
        name: '奖励获取(元)',
        position: 'right',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#E6A23C'
          }
        },
        axisLabel: {
          color: '#E6A23C'
        }
      }
    ],
    series: [
      {
        name: '完成任务数',
        type: 'line',
        data: taskCompletionTrend.value.map(item => item.completed),
        lineStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '奖励获取',
        type: 'bar',
        yAxisIndex: 1,
        data: rewardTrend.value.map(item => item.amount),
        itemStyle: {
          color: '#E6A23C'
        }
      }
    ]
  }

  correlationChart.setOption(option)
}

// 窗口大小变化时重新调整图表大小
const handleResize = () => {
  taskCompletionChart?.resize()
  rewardTrendChart?.resize()
  taskPriorityChart?.resize()
  taskCategoryChart?.resize()
  correlationChart?.resize()
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', handleResize)
})

// 清理事件监听器
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  taskCompletionChart?.dispose()
  rewardTrendChart?.dispose()
  taskPriorityChart?.dispose()
  taskCategoryChart?.dispose()
  correlationChart?.dispose()
})

// 监听数据变化，更新图表
watch(
  [taskCompletionTrend, rewardTrend, taskPriorityDistribution, taskCategoryDistribution],
  () => {
    updateCharts()
  },
  { deep: true }
)
</script>

<style scoped>
.statistics-container {
  padding: 20px 0;
  width: 100%;
  box-sizing: border-box;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  white-space: nowrap;
}

.date-range-selector {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.stats-card {
  margin-bottom: 20px;
  height: 100%;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
}

.chart-container {
  height: 300px;
  width: 100%;
  min-height: 250px;
}

.chart-container.large {
  height: 400px;
  min-height: 300px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

/* 响应式设计 */
@media (max-width: 1440px) {
  .statistics-container {
    padding: 15px 0;
  }
  
  .chart-container {
    height: 280px;
  }
  
  .chart-container.large {
    height: 350px;
  }
}

@media (max-width: 1200px) {
  .page-title {
    font-size: 22px;
  }
  
  .section-title {
    font-size: 14px;
  }
  
  .chart-container {
    height: 250px;
  }
  
  .chart-container.large {
    height: 320px;
  }
}

@media (max-width: 992px) {
  .stats-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .chart-container {
    height: 220px;
  }
  
  .chart-container.large {
    height: 280px;
  }
}

@media (max-width: 768px) {
  .statistics-container {
    padding: 15px 0;
  }
  
  .page-title {
    font-size: 18px;
  }
  
  .chart-container {
    height: 200px;
  }
  
  .chart-container.large {
    height: 250px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
}

@media (max-width: 576px) {
  .statistics-container {
    padding: 10px 0;
  }
  
  .page-title {
    font-size: 16px;
  }
  
  .chart-container {
    height: 180px;
  }
  
  .chart-container.large {
    height: 220px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .stats-header {
    margin-bottom: 15px;
  }
  
  .chart-container {
    height: 160px;
  }
  
  .chart-container.large {
    height: 200px;
  }
  
  .stats-grid {
    gap: 10px;
  }
}
</style>