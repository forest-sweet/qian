<template>
  <div class="product-management-container">
    <el-card class="product-header-card">
      <div class="product-header">
        <h2 class="page-title">商品管理</h2>
        <el-button type="primary" @click="openAddProductDialog">添加商品</el-button>
      </div>
    </el-card>

    <el-card class="product-list-card">
      <div class="product-list-section">
        <h3 class="section-title">商品列表</h3>
        <el-table :data="paginatedProducts" style="width: 100%">
          <el-table-column prop="name" label="商品名称" width="200" />
          <el-table-column prop="price" label="价格" width="100">
            <template #default="scope">
              <span>{{ scope.row.price }} 元</span>
            </template>
          </el-table-column>
          <el-table-column prop="stock" label="库存" width="100" />
          <el-table-column prop="category" label="分类" width="120" />
          <el-table-column prop="tags" label="标签" width="200">
            <template #default="scope">
              <el-tag v-for="tag in scope.row.tags" :key="tag" size="small" effect="plain">
                {{ tag }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="200">
            <template #default="scope">
              {{ formatDateTime(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="scope">
              <el-button size="small" @click="openEditProductDialog(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteProduct(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="products.length"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>

    <!-- 添加/编辑商品对话框 -->
    <el-dialog
      v-model="productDialogVisible"
      :title="editingProduct ? '编辑商品' : '添加商品'"
      width="600px"
    >
      <el-form :model="formData" label-width="80px">
        <el-form-item label="商品名称" required>
          <el-input v-model="formData.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品描述" required>
          <el-input
            v-model="formData.description"
            type="textarea"
            placeholder="请输入商品描述"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="价格" required>
          <el-input-number v-model="formData.price" :min="0.01" :max="99999" :step="0.01" />
        </el-form-item>
        <el-form-item label="库存" required>
          <el-input-number v-model="formData.stock" :min="0" :max="9999" :step="1" />
        </el-form-item>
        <el-form-item label="图片URL">
          <el-input v-model="formData.imageUrl" placeholder="请输入商品图片URL" />
        </el-form-item>
        <el-form-item label="分类" required>
          <el-input v-model="formData.category" placeholder="请输入商品分类" />
        </el-form-item>
        <el-form-item label="标签">
          <el-tag
            v-for="tag in formData.tags"
            :key="tag"
            closable
            @close="removeTag(tag)"
            style="margin-right: 8px"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-model="newTag"
            placeholder="输入标签并按回车"
            @keyup.enter="addTag"
            style="width: 150px; margin-top: 8px"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="productDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveProduct">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '@/stores/productStore'
import type { Product } from '@/types'
import { ElMessage } from 'element-plus'

const productStore = useProductStore()

// 响应式数据
const productDialogVisible = ref(false)
const editingProduct = ref<Product | null>(null)
const formData = ref({
  name: '',
  description: '',
  price: 0,
  stock: 0,
  imageUrl: '',
  category: '',
  tags: [] as string[]
})
const newTag = ref('')
const pagination = ref({
  currentPage: 1,
  pageSize: 10
})

// 计算属性
const products = computed(() => {
  return productStore.products.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

// 分页后的商品
const paginatedProducts = computed(() => {
  const startIndex = (pagination.value.currentPage - 1) * pagination.value.pageSize
  const endIndex = startIndex + pagination.value.pageSize
  return products.value.slice(startIndex, endIndex)
})

// 方法
const openAddProductDialog = () => {
  editingProduct.value = null
  formData.value = {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    imageUrl: '',
    category: '',
    tags: []
  }
  productDialogVisible.value = true
}

const openEditProductDialog = (product: Product) => {
  editingProduct.value = product
  formData.value = {
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    imageUrl: product.imageUrl || '',
    category: product.category,
    tags: [...product.tags]
  }
  productDialogVisible.value = true
}

const saveProduct = () => {
  if (editingProduct.value) {
    // 更新商品
    const updatedProduct = productStore.updateProduct(editingProduct.value.id, {
      name: formData.value.name,
      description: formData.value.description,
      price: formData.value.price,
      stock: formData.value.stock,
      imageUrl: formData.value.imageUrl,
      category: formData.value.category,
      tags: formData.value.tags
    })
    
    if (updatedProduct) {
      ElMessage.success({
        message: '商品更新成功',
        duration: 2000
      })
      productDialogVisible.value = false
    } else {
      ElMessage.error({
        message: '商品更新失败',
        duration: 3000
      })
    }
  } else {
    // 创建商品
    const newProduct = productStore.createProduct({
      name: formData.value.name,
      description: formData.value.description,
      price: formData.value.price,
      stock: formData.value.stock,
      imageUrl: formData.value.imageUrl,
      category: formData.value.category,
      tags: formData.value.tags
    })
    
    if (newProduct) {
      ElMessage.success({
        message: '商品创建成功',
        duration: 2000
      })
      productDialogVisible.value = false
    } else {
      ElMessage.error({
        message: '商品创建失败',
        duration: 3000
      })
    }
  }
}

const deleteProduct = (id: string) => {
  ElMessageBox.confirm('确定要删除这个商品吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const success = productStore.deleteProduct(id)
    if (success) {
      ElMessage.success({
        message: '商品删除成功',
        duration: 2000
      })
    } else {
      ElMessage.error({
        message: '商品删除失败',
        duration: 3000
      })
    }
  }).catch(() => {
    // 取消删除
  })
}

const addTag = () => {
  if (newTag.value && !formData.value.tags.includes(newTag.value)) {
    formData.value.tags.push(newTag.value)
    newTag.value = ''
  }
}

const removeTag = (tag: string) => {
  const index = formData.value.tags.indexOf(tag)
  if (index !== -1) {
    formData.value.tags.splice(index, 1)
  }
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
}

const handleCurrentChange = (current: number) => {
  pagination.value.currentPage = current
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 导入 ElMessageBox
import { ElMessageBox } from 'element-plus'

onMounted(() => {
  // 组件挂载时的初始化操作
})
</script>

<style scoped>
.product-management-container {
  padding: 20px 0;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.product-list-section {
  margin-top: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .product-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>