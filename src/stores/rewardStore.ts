import { defineStore } from 'pinia'
import type { RewardRecord, RewardAdjustment } from '../types'
import { ref, computed, watch } from 'vue'

// 存储键名
const STORAGE_KEY = 'task-reward-system-rewards'

// 模拟数据
const mockRewardRecords: RewardRecord[] = [
  {
    id: '1',
    amount: 100,
    type: 'manual_adjustment',
    reason: '初始奖励',
    createdAt: '2026-02-01T00:00:00'
  }
]

// 从localStorage读取数据
const loadRewardsFromStorage = (): RewardRecord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load rewards from storage:', error)
  }
  return mockRewardRecords
}

export const useRewardStore = defineStore('reward', () => {
  const rewardRecords = ref<RewardRecord[]>(loadRewardsFromStorage())

  // 监听奖励记录变化，自动保存到localStorage
  watch(rewardRecords, (newRecords) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords))
    } catch (error) {
      console.error('Failed to save rewards to storage:', error)
    }
  }, { deep: true })

  // 计算当前余额
  const currentBalance = computed(() => {
    return rewardRecords.value.reduce((total, record) => total + record.amount, 0)
  })

  // 按类型筛选奖励记录
  const getRecordsByType = (type: 'all' | 'task_completion' | 'manual_adjustment') => {
    if (type === 'all') return rewardRecords.value
    return rewardRecords.value.filter(record => record.type === type)
  }

  // 按时间范围筛选奖励记录
  const getRecordsByDateRange = (startDate: string, endDate: string) => {
    return rewardRecords.value.filter(record => {
      const recordDate = new Date(record.createdAt)
      const start = new Date(startDate)
      const end = new Date(endDate)
      return recordDate >= start && recordDate <= end
    })
  }

  // 按任务筛选奖励记录
  const getRecordsByTaskId = (taskId: string) => {
    return rewardRecords.value.filter(record => record.sourceTaskId === taskId)
  }

  // 添加奖励记录
  const addRewardRecord = (record: Omit<RewardRecord, 'id' | 'createdAt'>) => {
    const newRecord: RewardRecord = {
      ...record,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    rewardRecords.value.push(newRecord)
    return newRecord
  }

  // 记录任务完成奖励
  const recordTaskCompletionReward = (taskId: string, amount: number) => {
    try {
      const record = addRewardRecord({
        amount,
        type: 'task_completion',
        sourceTaskId: taskId,
        reason: `任务完成奖励 - 任务ID: ${taskId}`
      })
      
      // 记录详细日志
      console.log('任务完成奖励发放成功:', {
        taskId,
        amount,
        timestamp: new Date().toISOString(),
        recordId: record.id
      })
      
      return record
    } catch (error) {
      console.error('任务完成奖励发放失败:', {
        taskId,
        amount,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      })
      throw error
    }
  }

  // 记录任务取消奖励扣除
  const recordTaskCancellationDeduction = (taskId: string, amount: number) => {
    try {
      const record = addRewardRecord({
        amount: -amount,
        type: 'task_cancellation',
        sourceTaskId: taskId,
        reason: `任务取消扣除 - 任务ID: ${taskId}`
      })
      
      // 记录详细日志
      console.log('任务取消奖励扣除成功:', {
        taskId,
        amount,
        timestamp: new Date().toISOString(),
        recordId: record.id
      })
      
      return record
    } catch (error) {
      console.error('任务取消奖励扣除失败:', {
        taskId,
        amount,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      })
      throw error
    }
  }

  // 手动调整奖励
  const adjustReward = (adjustment: RewardAdjustment) => {
    return addRewardRecord({
      amount: adjustment.amount,
      type: 'manual_adjustment',
      reason: adjustment.reason
    })
  }

  // 获取最近的奖励记录
  const getRecentRecords = (limit: number = 10) => {
    return [...rewardRecords.value]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  }

  // 获取奖励趋势数据
  const getRewardTrend = (days: number = 7) => {
    const trendData: { date: string; amount: number }[] = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayRecords = rewardRecords.value.filter(record => {
        return record.createdAt.startsWith(dateStr)
      })

      const dayAmount = dayRecords.reduce((total, record) => total + record.amount, 0)
      trendData.push({ date: dateStr, amount: dayAmount })
    }

    return trendData
  }

  return {
    rewardRecords,
    currentBalance,
    getRecordsByType,
    getRecordsByDateRange,
    getRecordsByTaskId,
    addRewardRecord,
    recordTaskCompletionReward,
    recordTaskCancellationDeduction,
    adjustReward,
    getRecentRecords,
    getRewardTrend
  }
})
