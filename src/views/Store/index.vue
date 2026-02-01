<template>
  <div class="store-container">
    <el-card class="store-header-card">
      <div class="store-header">
        <h2 class="page-title">商城</h2>
        <div class="header-actions">
          <el-button type="primary" @click="navigateToManagement">商品管理</el-button>
          <el-tag type="info">当前余额: {{ currentBalance }} 元</el-tag>
        </div>
      </div>
    </el-card>

    <el-card class="store-filter-card">
      <div class="filter-section">
        <h3 class="section-title">商品筛选</h3>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="分类">
              <el-select v-model="filter.category" placeholder="选择分类">
                <el-option label="全部" value="all" />
                <el-option v-for="category in categories" :key="category" :label="category" :value="category" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="标签">
              <el-select v-model="filter.tag" placeholder="选择标签">
                <el-option label="全部" value="all" />
                <el-option v-for="tag in tags" :key="tag" :label="tag" :value="tag" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="价格范围">
              <el-slider
                v-model="priceRange"
                range
                :min="0"
                :max="1000"
                :step="10"
                @change="updateFilteredProducts"
              />
              <div class="price-range-text">
                {{ priceRange[0] }} - {{ priceRange[1] }} 元
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <el-card class="products-card">
      <div class="products-section">
        <h3 class="section-title">商品列表</h3>
        <div class="products-grid">
          <el-empty v-if="filteredProducts.length === 0" description="暂无商品" />
          <el-card
            v-else
            v-for="product in paginatedProducts"
            :key="product.id"
            class="product-card"
          >
            <template #header>
              <div class="product-card-header">
                <h4 class="product-title">{{ product.name }}</h4>
                <el-tag :type="product.stock > 0 ? 'success' : 'danger'">
                  {{ product.stock > 0 ? '有库存' : '缺货' }}
                </el-tag>
              </div>
            </template>
            <div class="product-content">
              <div class="product-image">
                <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" />
                <div v-else class="product-image-placeholder">
                  <el-icon><Picture /></el-icon>
                  <span>暂无图片</span>
                </div>
              </div>
              <p class="product-description">{{ product.description }}</p>
              <div class="product-meta">
                <div class="meta-item">
                  <el-tag>{{ product.category }}</el-tag>
                </div>
                <div class="meta-item">
                  <el-tag v-for="tag in product.tags" :key="tag" size="small" effect="plain">
                    {{ tag }}
                  </el-tag>
                </div>
                <div class="meta-item">
                  <el-icon><Goods /></el-icon>
                  库存: {{ product.stock }}
                </div>
              </div>
              <div class="product-price">
                <span class="price">{{ product.price }} 元</span>
              </div>
            </div>
            <div class="product-actions">
              <el-input-number
                v-model="purchaseQuantities[product.id]"
                :min="1"
                :max="product.stock"
                :step="1"
                size="small"
                :disabled="product.stock === 0"
              />
              <el-button
                type="primary"
                @click="purchaseProduct(product)"
                :disabled="product.stock === 0 || !canAfford(product)"
              >
                购买
              </el-button>
            </div>
          </el-card>
        </div>
        <div class="pagination" v-if="filteredProducts.length > 0">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[6, 12, 24]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredProducts.length"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>

    <el-card class="transactions-card">
      <div class="transactions-section">
        <h3 class="section-title">最近交易记录</h3>
        <el-table :data="recentTransactions" style="width: 100%">
          <el-table-column prop="createdAt" label="交易时间" width="200">
            <template #default="scope">
              {{ formatDateTime(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="productName" label="商品名称" width="200" />
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column prop="totalPrice" label="总价" width="100">
            <template #default="scope">
              <span class="price">{{ scope.row.totalPrice }} 元</span>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="支付金额" width="100">
            <template #default="scope">
              <span class="amount-negative">{{ -scope.row.amount }} 元</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 购买成功弹窗 -->
    <el-dialog
      v-model="purchaseSuccessVisible"
      title="购买成功"
      width="400px"
    >
      <div class="success-content">
        <el-icon class="success-icon"><Check /></el-icon>
        <p>商品购买成功！</p>
        <p>已扣除 {{ purchaseSuccessAmount }} 元余额</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="purchaseSuccessVisible = false">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 购买失败弹窗 -->
    <el-dialog
      v-model="purchaseFailedVisible"
      title="购买失败"
      width="400px"
    >
      <div class="failed-content">
        <el-icon class="failed-icon"><Close /></el-icon>
        <p>{{ purchaseFailedMessage }}</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="purchaseFailedVisible = false">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '@/stores/productStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useRouter } from 'vue-router'
import type { Product } from '@/types'
import { Picture, Goods, Check, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const productStore = useProductStore()
const rewardStore = useRewardStore()
const router = useRouter()

// 响应式数据
const filter = ref({
  category: 'all' as 'all' | string,
  tag: 'all' as 'all' | string
})
const priceRange = ref([0, 1000])
const purchaseQuantities = ref<Record<string, number>>({})
const purchaseSuccessVisible = ref(false)
const purchaseSuccessAmount = ref(0)
const purchaseFailedVisible = ref(false)
const purchaseFailedMessage = ref('')
const pagination = ref({
  currentPage: 1,
  pageSize: 12
})

// 计算属性
const currentBalance = computed(() => rewardStore.currentBalance)
const categories = computed(() => productStore.getAllCategories)
const tags = computed(() => productStore.getAllTags)

// 筛选后的商品
const filteredProducts = computed(() => {
  let products = productStore.products

  // 按分类筛选
  if (filter.value.category !== 'all') {
    products = products.filter(product => product.category === filter.value.category)
  }

  // 按标签筛选
  if (filter.value.tag !== 'all') {
    products = products.filter(product => product.tags.includes(filter.value.tag))
  }

  // 按价格范围筛选
  products = products.filter(product => 
    product.price >= priceRange.value[0] && product.price <= priceRange.value[1]
  )

  return products
})

// 分页后的商品
const paginatedProducts = computed(() => {
  const startIndex = (pagination.value.currentPage - 1) * pagination.value.pageSize
  const endIndex = startIndex + pagination.value.pageSize
  return filteredProducts.value.slice(startIndex, endIndex)
})

// 最近交易记录
const recentTransactions = computed(() => {
  return productStore.getTransactions().slice(0, 5)
})

// 方法
const updateFilteredProducts = () => {
  // 筛选逻辑已在 computed 中处理
}

const canAfford = (product: Product) => {
  const quantity = purchaseQuantities.value[product.id] || 1
  const totalPrice = product.price * quantity
  return currentBalance.value >= totalPrice
}

const purchaseProduct = (product: Product) => {
  const quantity = purchaseQuantities.value[product.id] || 1
  const totalPrice = product.price * quantity

  // 检查库存
  if (product.stock < quantity) {
    purchaseFailedMessage.value = '库存不足'
    purchaseFailedVisible.value = true
    return
  }

  // 检查余额
  if (currentBalance.value < totalPrice) {
    purchaseFailedMessage.value = '余额不足'
    purchaseFailedVisible.value = true
    return
  }

  try {
    // 1. 创建交易记录
    const transaction = productStore.createTransaction({
      type: 'purchase',
      productId: product.id,
      productName: product.name,
      amount: -totalPrice,
      quantity,
      totalPrice
    })

    if (!transaction) {
      throw new Error('交易记录创建失败')
    }

    // 2. 扣除余额
    const rewardRecord = rewardStore.addRewardRecord({
      amount: -totalPrice,
      type: 'purchase',
      reason: `购买商品: ${product.name} (数量: ${quantity})`
    })

    if (!rewardRecord) {
      throw new Error('余额扣除失败')
    }

    // 3. 更新库存
    const updatedProduct = productStore.updateProduct(product.id, {
      stock: product.stock - quantity
    })

    if (!updatedProduct) {
      throw new Error('库存更新失败')
    }

    // 显示成功提示
    purchaseSuccessAmount.value = totalPrice
    purchaseSuccessVisible.value = true

    // 重置购买数量
    purchaseQuantities.value[product.id] = 1

    // 记录详细日志
    console.log('商品购买成功:', {
      productId: product.id,
      productName: product.name,
      quantity,
      totalPrice,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('商品购买失败:', {
      productId: product.id,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })

    purchaseFailedMessage.value = error instanceof Error ? error.message : '购买失败，请重试'
    purchaseFailedVisible.value = true
  }
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const navigateToManagement = () => {
  router.push('/store/management')
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
}

const handleCurrentChange = (current: number) => {
  pagination.value.currentPage = current
}

onMounted(() => {
  // 初始化购买数量
  productStore.products.forEach(product => {
    purchaseQuantities.value[product.id] = 1
  })
})
</script>

<style scoped>
.store-container {
  padding: 20px 0;
}

.store-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.balance-info {
  display: flex;
  align-items: center;
}

.filter-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
}

.price-range-text {
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  color: #606266;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.product-card {
  transition: all 0.3s ease;
}

.product-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.product-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-title {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
  flex: 1;
}

.product-content {
  margin: 15px 0;
}

.product-image {
  width: 100%;
  height: 200px;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 15px;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.product-image-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.product-description {
  margin-bottom: 15px;
  line-height: 1.5;
  color: #606266;
}

.product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.product-price {
  margin-bottom: 15px;
}

.product-price .price {
  font-size: 24px;
  font-weight: bold;
  color: #f56c6c;
}

.product-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  margin-top: 15px;
}

.transactions-section {
  margin-top: 20px;
}

.success-content {
  text-align: center;
  padding: 20px;
}

.success-icon {
  font-size: 48px;
  color: #67c23a;
  margin-bottom: 20px;
}

.failed-content {
  text-align: center;
  padding: 20px;
}

.failed-icon {
  font-size: 48px;
  color: #f56c6c;
  margin-bottom: 20px;
}

.amount-negative {
  color: #f56c6c;
  font-weight: bold;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }

  .store-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>