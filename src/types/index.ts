// 任务类型
export interface Task {
  id: string
  title: string
  description: string
  dueDate: string
  priority: 'low' | 'medium' | 'high'
  reward: number
  category: string
  tags: string[]
  completed: boolean
  createdAt: string
  completedAt?: string
}

// 奖励记录类型
export interface RewardRecord {
  id: string
  amount: number
  type: 'task_completion' | 'manual_adjustment' | 'task_cancellation'
  sourceTaskId?: string
  reason?: string
  createdAt: string
}

// 奖励调整类型
export interface RewardAdjustment {
  amount: number
  reason: string
}

// 统计数据类型
export interface StatisticsData {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  completionRate: number
  totalRewards: number
  recentRewards: RewardRecord[]
  taskCompletionTrend: {
    date: string
    completed: number
  }[]
  rewardTrend: {
    date: string
    amount: number
  }[]
}