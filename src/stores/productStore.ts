import { defineStore } from 'pinia'
import type { Product, TransactionRecord } from '../types'
import { ref, computed, watch } from 'vue'

// 存储键名
const PRODUCTS_STORAGE_KEY = 'task-reward-system-products'
const TRANSACTIONS_STORAGE_KEY = 'task-reward-system-transactions'

// 模拟商品数据
const mockProducts: Product[] = [
  {
    id: '1',
    name: '高级笔记本',
    description: '高品质纸张，适合书写和绘画',
    price: 20,
    stock: 50,
    category: '文具',
    tags: ['办公用品', '学习用品'],
    createdAt: '2026-02-01T08:00:00'
  },
  {
    id: '2',
    name: '无线鼠标',
    description: '人体工学设计，舒适好用',
    price: 80,
    stock: 30,
    category: '电子产品',
    tags: ['电脑配件', '办公设备'],
    createdAt: '2026-02-01T09:00:00'
  },
  {
    id: '3',
    name: '保温杯',
    description: '304不锈钢材质，保温效果好',
    price: 50,
    stock: 40,
    category: '生活用品',
    tags: ['家居', '户外'],
    createdAt: '2026-02-01T10:00:00'
  }
]

// 从localStorage读取商品数据
const loadProductsFromStorage = (): Product[] => {
  try {
    const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load products from storage:', error)
  }
  return mockProducts
}

// 从localStorage读取交易记录
const loadTransactionsFromStorage = (): TransactionRecord[] => {
  try {
    const stored = localStorage.getItem(TRANSACTIONS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load transactions from storage:', error)
  }
  return []
}

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>(loadProductsFromStorage())
  const transactions = ref<TransactionRecord[]>(loadTransactionsFromStorage())

  // 监听商品变化，自动保存到localStorage
  watch(products, (newProducts) => {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(newProducts))
    } catch (error) {
      console.error('Failed to save products to storage:', error)
    }
  }, { deep: true })

  // 监听交易记录变化，自动保存到localStorage
  watch(transactions, (newTransactions) => {
    try {
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(newTransactions))
    } catch (error) {
      console.error('Failed to save transactions to storage:', error)
    }
  }, { deep: true })

  // 计算属性
  const totalProducts = computed(() => products.value.length)
  const totalTransactions = computed(() => transactions.value.length)
  const totalSales = computed(() => {
    return transactions.value.reduce((total: number, transaction: TransactionRecord) => total + transaction.totalPrice, 0)
  })

  // 获取所有分类
  const getAllCategories = computed(() => {
    const categories = new Set(products.value.map((product: Product) => product.category))
    return Array.from(categories)
  })

  // 获取所有标签
  const getAllTags = computed(() => {
    const tags = new Set<string>()
    products.value.forEach((product: Product) => {
      product.tags.forEach((tag: string) => tags.add(tag))
    })
    return Array.from(tags)
  })

  // 按分类筛选商品
  const getProductsByCategory = (category: 'all' | string) => {
    if (category === 'all') return products.value
    return products.value.filter((product: Product) => product.category === category)
  }

  // 按标签筛选商品
  const getProductsByTag = (tag: string) => {
    return products.value.filter((product: Product) => product.tags.includes(tag))
  }

  // 按价格范围筛选商品
  const getProductsByPriceRange = (min: number, max: number) => {
    return products.value.filter((product: Product) => product.price >= min && product.price <= max)
  }

  // 创建商品
  const createProduct = (product: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    products.value.push(newProduct)
    return newProduct
  }

  // 更新商品
  const updateProduct = (id: string, updates: Partial<Product>) => {
    const index = products.value.findIndex((product: Product) => product.id === id)
    if (index !== -1) {
      products.value[index] = {
        ...products.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      return products.value[index]
    }
    return null
  }

  // 删除商品
  const deleteProduct = (id: string) => {
    const index = products.value.findIndex((product: Product) => product.id === id)
    if (index !== -1) {
      products.value.splice(index, 1)
      return true
    }
    return false
  }

  // 获取商品详情
  const getProductById = (id: string) => {
    return products.value.find((product: Product) => product.id === id)
  }

  // 创建交易记录
  const createTransaction = (transaction: Omit<TransactionRecord, 'id' | 'createdAt'>) => {
    const newTransaction: TransactionRecord = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    transactions.value.push(newTransaction)
    return newTransaction
  }

  // 获取交易记录
  const getTransactions = () => {
    return transactions.value.sort((a: TransactionRecord, b: TransactionRecord) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  // 按商品ID获取交易记录
  const getTransactionsByProductId = (productId: string) => {
    return transactions.value.filter((transaction: TransactionRecord) => transaction.productId === productId)
  }

  return {
    products,
    transactions,
    totalProducts,
    totalTransactions,
    totalSales,
    getAllCategories,
    getAllTags,
    getProductsByCategory,
    getProductsByTag,
    getProductsByPriceRange,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    createTransaction,
    getTransactions,
    getTransactionsByProductId
  }
})
