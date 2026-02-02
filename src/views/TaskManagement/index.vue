<template>
  <div class="task-management-container">
    <el-card class="task-header-card">
      <div class="task-header">
        <h2 class="page-title">任务管理</h2>
        <el-button type="primary" @click="openAddTaskDialog">添加任务</el-button>
      </div>
      <div class="task-stats">
        <el-statistic :value="totalTasks" label="总任务数" />
        <el-statistic :value="completedTasks" label="已完成" />
        <el-statistic :value="pendingTasks" label="待完成" />
        <el-statistic :value="completionRate" label="完成率" :formatter="(value: number) => `${value}%`" />
      </div>
    </el-card>

    <el-card class="task-filter-card">
      <div class="filter-section">
        <h3 class="section-title">任务筛选</h3>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="状态">
              <el-select v-model="filter.status" placeholder="选择状态">
                <el-option label="全部" value="all" />
                <el-option label="已完成" value="completed" />
                <el-option label="待完成" value="pending" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="优先级">
              <el-select v-model="filter.priority" placeholder="选择优先级">
                <el-option label="全部" value="all" />
                <el-option label="低" value="low" />
                <el-option label="中" value="medium" />
                <el-option label="高" value="high" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="分类">
              <el-select v-model="filter.category" placeholder="选择分类">
                <el-option label="全部" value="all" />
                <el-option v-for="category in categories" :key="category" :label="category" :value="category" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="标签">
              <el-select v-model="filter.tag" placeholder="选择标签">
                <el-option label="全部" value="all" />
                <el-option v-for="tag in tags" :key="tag" :label="tag" :value="tag" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <el-card class="task-list-card">
      <div class="task-list-section">
        <h3 class="section-title">任务列表</h3>
        <div class="task-list">
          <el-empty v-if="filteredTasks.length === 0" description="暂无任务" />
          <div v-else class="task-grid">
            <el-card
              v-for="task in filteredTasks"
              :key="task.id"
              class="task-card"
              :class="{ 'task-completed': task.completed }"
            >
              <template #header>
                <div class="task-card-header">
                  <h4 class="task-title">{{ task.title }}</h4>
                  <div class="task-actions">
                    <el-button size="small" @click="openEditTaskDialog(task)">编辑</el-button>
                    <el-button size="small" type="danger" @click="deleteTask(task.id)">删除</el-button>
                  </div>
                </div>
              </template>
              <div class="task-content">
                <p class="task-description">{{ task.description }}</p>
                <div class="task-meta">
                  <div class="meta-item">
                    <el-tag :type="priorityTypeMap[task.priority]">
                      {{ priorityLabelMap[task.priority] }}
                    </el-tag>
                  </div>
                  <div class="meta-item">
                    <el-tag>{{ task.category }}</el-tag>
                  </div>
                  <div class="meta-item">
                    <el-tag v-for="tag in task.tags" :key="tag" size="small" effect="plain">
                      {{ tag }}
                    </el-tag>
                  </div>
                  <div class="meta-item">
                    <el-icon><Timer /></el-icon>
                    {{ formatDate(task.dueDate) }}
                  </div>
                  <div class="meta-item reward">
                    <el-icon><Star /></el-icon>
                    {{ task.reward }} 元
                  </div>
                </div>
              </div>
              <div class="task-footer">
                <el-checkbox :checked="task.completed" @change="handleTaskCompletion(task)">
                  {{ task.completed ? '已完成' : '未完成' }}
                </el-checkbox>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 添加/编辑任务对话框 -->
    <el-dialog
      v-model="taskDialogVisible"
      :title="editingTask ? '编辑任务' : '添加任务'"
      width="600px"
    >
      <el-form :model="formData" label-width="80px">
        <el-form-item label="标题" required>
          <el-input v-model="formData.title" placeholder="请输入任务标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            placeholder="请输入任务描述"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="截止时间" required>
          <el-date-picker
            v-model="formData.dueDate"
            type="datetime"
            placeholder="选择截止时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="优先级" required>
          <el-select v-model="formData.priority" placeholder="选择优先级">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
          </el-select>
        </el-form-item>
        <el-form-item label="奖励值" required>
          <el-input-number v-model="formData.reward" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="分类" required>
          <el-input v-model="formData.category" placeholder="请输入任务分类" />
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
          <el-button @click="taskDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveTask">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 奖励动画 -->
    <div v-if="showRewardAnimation" class="reward-animation" ref="rewardAnimationRef">
      +{{ rewardAnimationAmount }} 元
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { useRewardStore } from '@/stores/rewardStore'
import type { Task } from '@/types'
import { Timer, Star } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const taskStore = useTaskStore()
const rewardStore = useRewardStore()

// 响应式数据
const taskDialogVisible = ref(false)
const editingTask = ref<Task | null>(null)
const formData = ref({
  title: '',
  description: '',
  dueDate: '',
  priority: 'medium' as 'low' | 'medium' | 'high',
  reward: 10,
  category: '工作',
  tags: [] as string[]
})
const newTag = ref('')
const filter = ref({
  status: 'all' as 'all' | 'completed' | 'pending',
  priority: 'all' as 'all' | 'low' | 'medium' | 'high',
  category: 'all' as 'all' | string,
  tag: 'all' as 'all' | string
})

// 奖励动画相关
const showRewardAnimation = ref(false)
const rewardAnimationAmount = ref(0)
const rewardAnimationRef = ref<HTMLElement>()

// 计算属性
const totalTasks = computed(() => taskStore.totalTasks)
const completedTasks = computed(() => taskStore.completedTasks)
const pendingTasks = computed(() => taskStore.pendingTasks)
const completionRate = computed(() => taskStore.completionRate)
const categories = computed(() => taskStore.getAllCategories)
const tags = computed(() => taskStore.getAllTags)

// 筛选后的任务列表
const filteredTasks = computed(() => {
  let tasks = taskStore.tasks

  // 按状态筛选
  if (filter.value.status !== 'all') {
    tasks = tasks.filter(task => 
      filter.value.status === 'completed' ? task.completed : !task.completed
    )
  }

  // 按优先级筛选
  if (filter.value.priority !== 'all') {
    tasks = tasks.filter(task => task.priority === filter.value.priority)
  }

  // 按分类筛选
  if (filter.value.category !== 'all') {
    tasks = tasks.filter(task => task.category === filter.value.category)
  }

  // 按标签筛选
  if (filter.value.tag !== 'all') {
    tasks = tasks.filter(task => task.tags.includes(filter.value.tag))
  }

  // 按截止时间排序
  return tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
})

// 优先级映射
const priorityTypeMap = {
  low: 'success',
  medium: 'warning',
  high: 'danger'
}

const priorityLabelMap = {
  low: '低优先级',
  medium: '中优先级',
  high: '高优先级'
}

// 方法
const openAddTaskDialog = () => {
  editingTask.value = null
  formData.value = {
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    reward: 10,
    category: '工作',
    tags: []
  }
  taskDialogVisible.value = true
}

const openEditTaskDialog = (task: Task) => {
  editingTask.value = task
  formData.value = {
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    priority: task.priority,
    reward: task.reward,
    category: task.category,
    tags: [...task.tags]
  }
  taskDialogVisible.value = true
}

const saveTask = () => {
  if (editingTask.value) {
    // 更新任务
    taskStore.updateTask(editingTask.value.id, {
      title: formData.value.title,
      description: formData.value.description,
      dueDate: formData.value.dueDate,
      priority: formData.value.priority,
      reward: formData.value.reward,
      category: formData.value.category,
      tags: formData.value.tags
    })
  } else {
    // 创建任务
    taskStore.createTask({
      title: formData.value.title,
      description: formData.value.description,
      dueDate: formData.value.dueDate,
      priority: formData.value.priority,
      reward: formData.value.reward,
      category: formData.value.category,
      tags: formData.value.tags
    })
  }
  taskDialogVisible.value = false
}

const deleteTask = (id: string) => {
  taskStore.deleteTask(id)
}

const handleTaskCompletion = (task: Task) => {
  // 获取任务在store中的原始状态
  const originalTask = taskStore.tasks.find(t => t.id === task.id)
  if (!originalTask) return
  
  const targetCompleted = !originalTask.completed
  
  if (targetCompleted) {
    // 标记为完成
    try {
      // 1. 检查任务是否已经是完成状态
      if (originalTask.completed) {
        ElMessage.info({
          message: '任务已经是完成状态',
          duration: 2000
        })
        return
      }
      
      // 2. 标记任务为完成
      const completedTask = taskStore.completeTask(task.id)
      if (!completedTask) {
        throw new Error('任务状态更新失败')
      }
      
      // 3. 发放奖励
      const rewardRecord = rewardStore.recordTaskCompletionReward(task.id, completedTask.reward)
      if (!rewardRecord) {
        throw new Error('奖励发放失败')
      }
      
      // 4. 显示奖励动画
      showRewardAnimationEffect(completedTask.reward)
      
      // 5. 显示成功提示
      ElMessage.success({
        message: `任务完成成功！获得 ${completedTask.reward} 元`,
        duration: 2000
      })
      
      // 6. 记录详细日志
      console.log('任务完成奖励发放成功:', {
        taskId: task.id,
        taskTitle: task.title,
        rewardAmount: completedTask.reward,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      // 异常处理
      console.error('任务完成处理失败:', {
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      })
      
      // 显示错误提示
      ElMessage.error({
        message: '任务完成处理失败，请重试',
        duration: 3000
      })
    }
  } else {
    // 标记为未完成
    try {
      // 1. 检查任务是否已经是未完成状态
      if (!originalTask.completed) {
        ElMessage.info({
          message: '任务已经是未完成状态',
          duration: 2000
        })
        return
      }
      
      // 2. 标记任务为未完成
      const uncompletedTask = taskStore.uncompleteTask(task.id)
      if (!uncompletedTask) {
        throw new Error('任务状态更新失败')
      }
      
      // 3. 扣除奖励
      const deductionRecord = rewardStore.recordTaskCancellationDeduction(task.id, originalTask.reward)
      if (!deductionRecord) {
        throw new Error('奖励扣除失败')
      }
      
      ElMessage.success({
        message: `任务已标记为未完成，扣除 ${originalTask.reward} 元奖励`,
        duration: 2000
      })
    } catch (error) {
      console.error('任务状态更新失败:', {
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      })
      ElMessage.error({
        message: '任务状态更新失败，请重试',
        duration: 3000
      })
    }
  }
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

const showRewardAnimationEffect = (amount: number) => {
  rewardAnimationAmount.value = amount
  showRewardAnimation.value = true
  
  // 触发动画
  setTimeout(() => {
    showRewardAnimation.value = false
  }, 2000)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  // 组件挂载时的初始化操作
})
</script>

<style scoped>
.task-management-container {
  padding: 20px 0;
  width: 100%;
  box-sizing: border-box;
}

.task-header {
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

.task-stats {
  display: flex;
  gap: 40px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.filter-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
}

.task-list {
  margin-top: 20px;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.task-card {
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.task-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.task-completed {
  border-left: 4px solid #67c23a;
  opacity: 0.8;
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 10px;
}

.task-title {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.task-content {
  margin: 15px 0;
  flex: 1;
}

.task-description {
  margin-bottom: 15px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.meta-item.reward {
  margin-left: auto;
  font-weight: bold;
  color: #e6a23c;
}

.task-footer {
  margin-top: 15px;
  text-align: right;
}

.reward-animation {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(103, 194, 58, 0.9);
  color: white;
  padding: 20px 40px;
  border-radius: 50px;
  font-size: 24px;
  font-weight: bold;
  z-index: 1000;
  animation: rewardFloat 2s ease-out;
}

@keyframes rewardFloat {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -150%) scale(1.2);
  }
}

/* 响应式设计 */
@media (max-width: 1440px) {
  .task-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 15px;
  }
  
  .task-stats {
    gap: 30px;
  }
}

@media (max-width: 1200px) {
  .page-title {
    font-size: 22px;
  }
  
  .task-title {
    font-size: 16px;
  }
  
  .task-stats {
    gap: 20px;
  }
}

@media (max-width: 992px) {
  .task-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .task-stats {
    flex-direction: column;
    gap: 15px;
  }
  
  .task-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 15px;
  }
  
  .task-description {
    -webkit-line-clamp: 1;
  }
}

@media (max-width: 768px) {
  .task-management-container {
    padding: 15px 0;
  }
  
  .page-title {
    font-size: 18px;
  }
  
  .section-title {
    font-size: 14px;
  }
  
  .task-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 12px;
  }
  
  .task-card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .task-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .meta-item.reward {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 576px) {
  .task-grid {
    grid-template-columns: 1fr;
  }
  
  .reward-animation {
    padding: 15px 30px;
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .task-management-container {
    padding: 10px 0;
  }
  
  .page-title {
    font-size: 16px;
  }
  
  .task-content {
    margin: 10px 0;
  }
  
  .task-description {
    margin-bottom: 10px;
    font-size: 12px;
  }
  
  .task-meta {
    gap: 5px;
  }
  
  .task-footer {
    margin-top: 10px;
  }
  
  .reward-animation {
    padding: 10px 20px;
    font-size: 18px;
  }
}
</style>