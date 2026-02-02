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
  isLongTerm?: boolean
  completionCount?: number
}

// 奖励记录类型
export interface RewardRecord {
  id: string
  amount: number
  type: 'task_completion' | 'manual_adjustment' | 'task_cancellation' | 'purchase'
  sourceTaskId?: string
  reason?: string
  createdAt: string
}

// 奖励调整类型
export interface RewardAdjustment {
  amount: number
  reason: string
}

// 商品类型
export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  imageUrl?: string
  category: string
  tags: string[]
  createdAt: string
  updatedAt?: string
}

// 交易记录类型
export interface TransactionRecord {
  id: string
  type: 'purchase'
  productId: string
  productName: string
  amount: number
  quantity: number
  totalPrice: number
  createdAt: string
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