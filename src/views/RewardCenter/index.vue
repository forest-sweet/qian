<template>
  <div class="reward-center-container">
    <el-card class="balance-card">
      <div class="balance-header">
        <h2 class="page-title">奖励中心</h2>
        <el-button type="primary" @click="resetBalance">重置余额</el-button>
      </div>
      <div class="balance-display">
        <el-statistic :value="currentBalance" label="当前余额(元)" />
        <div class="balance-actions">
          <el-button type="success" @click="openAddRewardDialog">增加余额</el-button>
          <el-button type="danger" @click="openReduceRewardDialog">减少余额</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="reward-records-card">
      <div class="records-section">
        <h3 class="section-title">奖励收支明细</h3>
        <div class="filter-section">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="记录类型">
                <el-select v-model="filter.type" placeholder="选择类型">
                  <el-option label="全部" value="all" />
                  <el-option label="任务完成" value="task_completion" />
                  <el-option label="手动调整" value="manual_adjustment" />
                  <el-option label="任务取消" value="task_cancellation" />
                  <el-option label="购买商品" value="purchase" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="16">
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="filter.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        <el-table :data="filteredRecords" style="width: 100%">
          <el-table-column prop="createdAt" label="时间" width="200">
            <template #default="scope">
              {{ formatDateTime(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="120">
            <template #default="scope">
              <span :class="scope.row.amount > 0 ? 'amount-positive' : 'amount-negative'">
                {{ scope.row.amount > 0 ? '+' : '' }}{{ scope.row.amount }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="120">
            <template #default="scope">
              <el-tag :type="getTagType(scope.row.type)">
                {{ typeLabelMap[scope.row.type] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sourceTaskId" label="来源任务" width="180">
            <template #default="scope">
              {{ getTaskTitle(scope.row.sourceTaskId) || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="原因/备注">
            <template #default="scope">
              {{ scope.row.reason || '-' }}
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredRecords.length"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>

    <!-- 调整余额对话框 -->
    <el-dialog
      v-model="adjustDialogVisible"
      :title="adjustmentType === 'add' ? '增加余额' : '减少余额'"
      width="500px"
    >
      <el-form :model="adjustmentForm" label-width="80px">
        <el-form-item label="金额" required>
          <el-input-number
            v-model="adjustmentForm.amount"
            :min="1"
            :max="10000"
            :step="1"
          />
        </el-form-item>
        <el-form-item label="原因" required>
          <el-input
            v-model="adjustmentForm.reason"
            type="textarea"
            placeholder="请输入调整原因"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="adjustDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmAdjustment">确认调整</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRewardStore } from '@/stores/rewardStore'
import { useTaskStore } from '@/stores/taskStore'
import { ElMessageBox, ElMessage } from 'element-plus'


const rewardStore = useRewardStore()
const taskStore = useTaskStore()

// 响应式数据
const adjustDialogVisible = ref(false)
const adjustmentType = ref<'add' | 'reduce'>('add')
const adjustmentForm = ref({
  amount: 10,
  reason: ''
})
const filter = ref({
  type: 'all' as 'all' | 'task_completion' | 'manual_adjustment' | 'task_cancellation' | 'purchase',
  dateRange: [] as string[]
})
const pagination = ref({
  currentPage: 1,
  pageSize: 10
})

// 计算属性
const currentBalance = computed(() => rewardStore.currentBalance)
const allRecords = computed(() => rewardStore.rewardRecords)

// 筛选后的记录
const filteredRecords = computed(() => {
  let records = allRecords.value

  // 按类型筛选
  if (filter.value.type !== 'all') {
    records = records.filter(record => record.type === filter.value.type)
  }

  // 按时间范围筛选
  if (filter.value.dateRange && filter.value.dateRange.length === 2) {
    const startDate = new Date(filter.value.dateRange[0])
    const endDate = new Date(filter.value.dateRange[1])
    endDate.setHours(23, 59, 59, 999)

    records = records.filter(record => {
      const recordDate = new Date(record.createdAt)
      return recordDate >= startDate && recordDate <= endDate
    })
  }

  // 按时间倒序排序
  return records.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})



// 类型标签映射
const typeLabelMap: Record<string, string> = {
  task_completion: '任务完成',
  manual_adjustment: '手动调整',
  task_cancellation: '任务取消',
  purchase: '购买商品'
}

// 获取标签类型
const getTagType = (type: string): 'success' | 'info' | 'danger' | 'warning' => {
  switch (type) {
    case 'task_completion':
      return 'success'
    case 'task_cancellation':
      return 'danger'
    case 'purchase':
      return 'warning'
    default:
      return 'info'
  }
}

// 方法
const openAdjustRewardDialog = () => {
  adjustmentForm.value = {
    amount: 10,
    reason: ''
  }
  adjustDialogVisible.value = true
}

const openAddRewardDialog = () => {
  adjustmentType.value = 'add'
  adjustmentForm.value = {
    amount: 10,
    reason: ''
  }
  adjustDialogVisible.value = true
}

const openReduceRewardDialog = () => {
  adjustmentType.value = 'reduce'
  adjustmentForm.value = {
    amount: 10,
    reason: ''
  }
  adjustDialogVisible.value = true
}

const confirmAdjustment = () => {
  const amount = adjustmentType.value === 'add' 
    ? adjustmentForm.value.amount 
    : -adjustmentForm.value.amount

  rewardStore.adjustReward({
    amount,
    reason: adjustmentForm.value.reason
  })

  adjustDialogVisible.value = false
}

const getTaskTitle = (taskId?: string) => {
  if (!taskId) return ''
  const task = taskStore.tasks.find(t => t.id === taskId)
  return task ? task.title : ''
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

const resetBalance = async () => {
  try {
    await ElMessageBox.confirm(
      '确认将奖励中心金额重置为零？此操作不可恢复',
      '重置余额',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
        center: true
      }
    )

    // 调用rewardStore的resetBalance方法
    const result = rewardStore.resetBalance()

    // 显示成功消息
    ElMessage({
      type: 'success',
      message: '余额重置成功',
      duration: 2000
    })

    console.log('余额重置操作记录:', {
      timestamp: new Date().toISOString(),
      operatorId: 'system',
      previousBalance: result.previousBalance,
      currentBalance: rewardStore.currentBalance
    })
  } catch (error: any) {
    if (error === 'cancel') {
      // 用户取消操作，不做处理
      return
    }

    // 显示错误消息
    ElMessage({
      type: 'error',
      message: error.message || '余额重置失败，请稍后重试',
      duration: 3000
    })

    console.error('余额重置失败:', error)
  }
}
</script>

<style scoped>
.reward-center-container {
  padding: 20px 0;
  width: 100%;
  box-sizing: border-box;
}

.balance-header {
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

.balance-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.balance-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.records-section {
  margin-top: 20px;
  overflow-x: auto;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
}

.filter-section {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.amount-positive {
  color: #67c23a;
  font-weight: bold;
}

.amount-negative {
  color: #f56c6c;
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 1440px) {
  .reward-center-container {
    padding: 15px 0;
  }
}

@media (max-width: 1200px) {
  .page-title {
    font-size: 22px;
  }
}

@media (max-width: 992px) {
  .balance-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .balance-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .balance-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .page-title {
    font-size: 20px;
  }
}

@media (max-width: 768px) {
  .reward-center-container {
    padding: 15px 0;
  }
  
  .page-title {
    font-size: 18px;
  }
  
  .section-title {
    font-size: 14px;
  }
  
  .balance-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .el-button {
    width: 100%;
  }
  
  .el-table {
    font-size: 12px;
  }
  
  .el-table-column {
    font-size: 12px;
  }
}

@media (max-width: 576px) {
  .reward-center-container {
    padding: 10px 0;
  }
  
  .page-title {
    font-size: 16px;
  }
  
  .el-table {
    font-size: 11px;
  }
  
  .el-table-column {
    font-size: 11px;
  }
  
  .el-pagination {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .balance-header {
    margin-bottom: 15px;
  }
  
  .balance-display {
    margin-top: 15px;
  }
  
  .records-section {
    margin-top: 15px;
  }
  
  .filter-section {
    margin-bottom: 15px;
  }
  
  .pagination {
    margin-top: 15px;
  }
}
</style>