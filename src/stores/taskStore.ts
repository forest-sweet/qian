import { defineStore } from 'pinia'
import type { Task } from '../types'
import { ref, computed, watch } from 'vue'

// 存储键名
const STORAGE_KEY = 'task-reward-system-tasks'

// 模拟数据
const mockTasks: Task[] = [
  {
    id: '1',
    title: '完成项目文档',
    description: '撰写项目的技术文档和用户手册',
    dueDate: '2026-02-05',
    priority: 'high',
    reward: 50,
    category: '工作',
    tags: ['文档', '重要'],
    completed: false,
    createdAt: '2026-02-01T08:00:00'
  },
  {
    id: '2',
    title: '学习TypeScript',
    description: '完成TypeScript基础语法学习',
    dueDate: '2026-02-07',
    priority: 'medium',
    reward: 30,
    category: '学习',
    tags: ['编程', 'TypeScript'],
    completed: false,
    createdAt: '2026-02-01T09:00:00'
  },
  {
    id: '3',
    title: '健身锻炼',
    description: '进行30分钟有氧运动',
    dueDate: '2026-02-01',
    priority: 'low',
    reward: 10,
    category: '生活',
    tags: ['健身', '日常'],
    completed: false,
    createdAt: '2026-02-01T10:00:00'
  }
]

// 从localStorage读取数据
const loadTasksFromStorage = (): Task[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load tasks from storage:', error)
  }
  return mockTasks
}

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>(loadTasksFromStorage())

  // 监听任务变化，自动保存到localStorage
  watch(tasks, (newTasks) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks))
    } catch (error) {
      console.error('Failed to save tasks to storage:', error)
    }
  }, { deep: true })

  // 计算属性
  // 总任务数（排除长期任务）
  const totalTasks = computed(() => tasks.value.filter(task => !task.isLongTerm).length)
  // 已完成任务数（仅普通任务）
  const completedTasks = computed(() => tasks.value.filter(task => !task.isLongTerm && task.completed).length)
  // 待完成任务数（仅普通任务）
  const pendingNormalTasks = computed(() => tasks.value.filter(task => !task.isLongTerm && !task.completed).length)
  // 长期任务数
  const longTermTasks = computed(() => tasks.value.filter(task => task.isLongTerm).length)
  // 完成率（基于普通任务）
  const completionRate = computed(() => {
    if (totalTasks.value === 0) return 0
    return (completedTasks.value / totalTasks.value) * 100
  })

  // 按状态筛选任务
  const getTasksByStatus = (status: 'all' | 'completed' | 'pending') => {
    if (status === 'all') return tasks.value
    if (status === 'completed') return tasks.value.filter(task => task.completed)
    return tasks.value.filter(task => !task.completed)
  }

  // 按优先级筛选任务
  const getTasksByPriority = (priority: 'all' | 'low' | 'medium' | 'high') => {
    if (priority === 'all') return tasks.value
    return tasks.value.filter(task => task.priority === priority)
  }

  // 按分类筛选任务
  const getTasksByCategory = (category: 'all' | string) => {
    if (category === 'all') return tasks.value
    return tasks.value.filter(task => task.category === category)
  }

  // 按标签筛选任务
  const getTasksByTag = (tag: string) => {
    return tasks.value.filter(task => task.tags.includes(tag))
  }

  // 获取所有分类
  const getAllCategories = computed(() => {
    const categories = new Set(tasks.value.map(task => task.category))
    return Array.from(categories)
  })

  // 获取所有标签
  const getAllTags = computed(() => {
    const tags = new Set<string>()
    tasks.value.forEach(task => {
      task.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags)
  })

  // 创建任务
  const createTask = (task: Omit<Task, 'id' | 'createdAt' | 'completed' | 'isLongTerm' | 'completionCount'> & { isLongTerm?: boolean }) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      completed: false,
      createdAt: new Date().toISOString(),
      isLongTerm: task.isLongTerm || false,
      completionCount: task.isLongTerm ? 0 : undefined
    }
    tasks.value.push(newTask)
    return newTask
  }

  // 更新任务
  const updateTask = (id: string, updates: Partial<Task>) => {
    const index = tasks.value.findIndex(task => task.id === id)
    if (index !== -1) {
      const updatedTask = { ...tasks.value[index], ...updates }
      // 如果任务被设置为长期任务，确保completionCount为0
      if (updatedTask.isLongTerm && updatedTask.completionCount === undefined) {
        updatedTask.completionCount = 0
      }
      // 如果任务被取消长期任务，移除completionCount
      if (!updatedTask.isLongTerm) {
        delete updatedTask.completionCount
      }
      tasks.value[index] = updatedTask
      return updatedTask
    }
    return null
  }

  // 删除任务
  const deleteTask = (id: string) => {
    const index = tasks.value.findIndex(task => task.id === id)
    if (index !== -1) {
      tasks.value.splice(index, 1)
      return true
    }
    return false
  }

  // 标记任务完成
  const completeTask = (id: string) => {
    const task = tasks.value.find(task => task.id === id)
    if (task && !task.completed) {
      task.completed = true
      task.completedAt = new Date().toISOString()
      return task
    }
    return null
  }

  // 标记任务未完成
  const uncompleteTask = (id: string) => {
    const task = tasks.value.find(task => task.id === id)
    if (task && task.completed) {
      task.completed = false
      delete task.completedAt
      return task
    }
    return null
  }

  // 完成长期任务（增加完成次数）
  const completeLongTermTask = (id: string) => {
    const task = tasks.value.find(task => task.id === id)
    if (task && task.isLongTerm) {
      // 增加完成次数
      task.completionCount = (task.completionCount || 0) + 1
      return task
    }
    return null
  }

  return {
    tasks,
    totalTasks,
    completedTasks,
    pendingTasks: pendingNormalTasks,
    pendingNormalTasks,
    longTermTasks,
    completionRate,
    getTasksByStatus,
    getTasksByPriority,
    getTasksByCategory,
    getTasksByTag,
    getAllCategories,
    getAllTags,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    completeLongTermTask
  }
})
