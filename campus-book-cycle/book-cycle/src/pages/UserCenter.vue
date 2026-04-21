<template>
  <div class="user-center">
    <el-page-header 
      content="个人中心" 
      @back="router.back()"
    />

    <el-row :gutter="20">
      <!-- 个人信息 -->
      <el-col :span="8">
        <el-card class="info-card">
          <template #header>
            <span>个人信息</span>
          </template>
          <div class="user-info">
            <div class="avatar">
              <img :src="bookStore.user?.avatar || `https://placehold.co/100x100/666666/ffffff?text=${bookStore.user?.username?.charAt(0) || 'U'}`" alt="用户头像" />
            </div>
            <div class="info">
              <h3>{{ bookStore.user?.username }}</h3>
              <p>用户类型：{{ bookStore.user?.userType === 'student' ? '学生' : '管理员' }}</p>
              <p>注册时间：{{ (bookStore.user?.createdAt || '2025-01-01').split(' ')[0] }}</p>
              <el-button type="primary" size="small" @click="handleOpenEditDialog">修改信息</el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 我的发布 -->
      <el-col :span="16">
        <el-card class="publish-card">
          <template #header>
            <span>我的发布</span>
          </template>
          <el-table 
            :data="myPublishList" 
            border 
            stripe 
            style="width: 100%;"
          >
            <el-table-column prop="name" label="书籍名称" width="200" />
            <el-table-column prop="cateName" label="分类" width="120" />
            <el-table-column prop="salePrice" label="售价(元)" width="100" />
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="250">
              <template #default="scope">
                <el-button 
                  type="info" 
                  size="small" 
                  @click="handleEdit(scope.row.id)"
                  v-if="scope.row.status !== 'sold'"
                >
                  编辑
                </el-button>
                <el-button 
                  type="success" 
                  size="small" 
                  @click="handleRelist(scope.row.id)"
                  v-if="scope.row.status === 'offSale'"
                >
                  重新上架
                </el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="handleOffSale(scope.row.id)"
                  v-if="scope.row.status === 'onSale'"
                >
                  下架
                </el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="handleDelete(scope.row.id)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 我的订单 -->
        <el-card class="order-card" style="margin-top: 20px;" v-if="bookStore.user && bookStore.user.userType !== 'admin'">
          <template #header>
            <span>我的订单</span>
          </template>
          <el-table 
            :data="myOrderList" 
            border 
            stripe 
            style="width: 100%;"
          >
            <el-table-column prop="bookName" label="书籍名称" width="200" />
            <el-table-column prop="seller" label="出售人" width="120" />
            <el-table-column prop="price" label="金额(元)" width="100" />
            <el-table-column label="状态" width="120">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="交易时间" width="180">
              <template #default="scope">
                {{ scope.row.createTime }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 修改信息弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="修改个人信息"
      width="500px"
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            action="#"
            :auto-upload="false"
            :on-change="handleAvatarChange"
            :show-file-list="false"
            accept="image/*"
          >
            <img v-if="editForm.avatar" :src="editForm.avatar" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="手机号" required>
          <el-input v-model="editForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="电子邮箱">
          <el-input v-model="editForm.email" placeholder="请输入电子邮箱" type="email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">保存修改</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 数据管理卡片（仅管理员可见） -->
    <el-card class="data-manage-card" style="margin-top: 20px;" v-if="bookStore.user?.userType === 'admin'">
      <template #header>
        <div class="card-header">
          <span>📁 本地数据管理</span>
          <el-tag size="small" type="info">数据大小：{{ dataSize }}</el-tag>
        </div>
      </template>
      <div class="data-manage-actions">
        <el-button type="primary" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
        <el-button type="success" @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入数据
        </el-button>
        <el-button type="danger" @click="handleClear">
          <el-icon><Delete /></el-icon>
          清空数据
        </el-button>
        <input 
          ref="importInput" 
          type="file" 
          accept=".json" 
          style="display: none" 
          @change="handleFileSelect"
        />
      </div>
      <el-alert
        title="提示"
        type="info"
        description="导出数据可在不同设备间迁移数据。导入数据将覆盖当前数据，请谨慎操作。"
        :closable="false"
        style="margin-top: 15px;"
      />
    </el-card>

    <!-- 云端存储管理（仅管理员可见） -->
    <el-card class="cloud-card" style="margin-top: 20px;" v-if="bookStore.user?.userType === 'admin'">
      <template #header>
        <div class="card-header">
          <span>☁️ 云端存储 (Supabase)</span>
          <el-tag 
            :type="cloudConfigured ? 'success' : 'danger'" 
            size="small"
            effect="dark"
          >
            {{ cloudConfigured ? '已配置' : '未配置' }}
          </el-tag>
        </div>
      </template>
      
      <!-- 配置区域 -->
      <div class="cloud-config-section">
        <h4>🔧 API 配置</h4>
        <el-form :model="cloudForm" label-width="120px" size="default">
          <el-form-item label="Project URL">
            <el-input 
              v-model="cloudForm.url" 
              placeholder="https://xxxxx.supabase.co"
              clearable
            />
          </el-form-item>
          <el-form-item label="anon key">
            <el-input 
              v-model="cloudForm.anonKey" 
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              type="password"
              show-password
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSaveCloudConfig">
              保存配置
            </el-button>
            <el-button @click="handleClearCloudConfig">
              清除配置
            </el-button>
            <el-button type="warning" @click="handleTestConnection" :loading="testingConnection">
              测试连接
            </el-button>
          </el-form-item>
        </el-form>
        
        <!-- 连接状态 -->
        <el-alert
          v-if="connectionStatus.message"
          :title="connectionStatus.success ? '✅ 连接成功' : '❌ 连接失败'"
          :type="connectionStatus.success ? 'success' : 'error'"
          :description="connectionStatus.message"
          :closable="true"
          @close="connectionStatus = {}"
          style="margin-top: 10px;"
        />
      </div>

      <el-divider />
      
      <!-- 操作区域 -->
      <div class="cloud-actions-section">
        <h4>🚀 数据操作</h4>
        <div class="cloud-actions">
          <el-button 
            type="primary" 
            @click="handleSaveToCloud"
            :loading="savingToCloud"
            :disabled="!cloudConfigured"
          >
            <el-icon><Upload /></el-icon>
            上传到云端
          </el-button>
          <el-button 
            type="success" 
            @click="handleLoadFromCloud"
            :loading="loadingFromCloud"
            :disabled="!cloudConfigured"
          >
            <el-icon><Download /></el-icon>
            从云端下载
          </el-button>
          <el-button 
            type="warning" 
            @click="handleSyncWithCloud"
            :loading="syncingWithCloud"
            :disabled="!cloudConfigured"
          >
            <el-icon><Refresh /></el-icon>
            双向同步
          </el-button>
        </div>
        
        <!-- 最后同步时间 -->
        <div v-if="lastSyncTime" class="last-sync-info">
          <el-text type="info" size="small">
            🕐 最后同步时间：{{ lastSyncTime }}
          </el-text>
        </div>
        
        <el-alert
          title="使用说明"
          type="info"
          :closable="false"
          style="margin-top: 15px;"
        >
          <template #default>
            <ol style="margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>访问 <a href="https://supabase.com/" target="_blank" rel="noopener">Supabase</a> 注册账号</li>
              <li>创建新项目，选择 Southeast Asia (Singapore) 区域</li>
              <li>在 Project Settings → API 中复制 Project URL 和 anon key</li>
              <li>在上方填写并保存配置</li>
              <li>使用上传/下载/同步功能管理云端数据</li>
            </ol>
            <el-divider />
            <details>
              <summary style="cursor: pointer; font-weight: bold; color: #409eff;">
                📋 点击查看建表 SQL
              </summary>
              <pre style="background: #f5f7fa; padding: 15px; border-radius: 4px; overflow-x: auto; margin-top: 10px; font-size: 12px; line-height: 1.6;">CREATE TABLE app_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data_type TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access"
  ON app_data FOR SELECT USING (true);

CREATE POLICY "Allow anonymous write access"
  ON app_data FOR ALL USING (true) WITH CHECK (true);</pre>
            </details>
          </template>
        </el-alert>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBookStore } from '../pinia/store'
import { getStatusText, getStatusType } from '../utils/index'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Upload, Delete, Refresh } from '@element-plus/icons-vue'
import { exportAllData, importAllData, clearAllData, getDataSize } from '../utils/dataExport'
import { setSupabaseConfig, clearSupabaseConfig, isSupabaseConfigured,
         saveToCloud, loadFromCloud, syncWithCloud, getLastSyncTime,
         testCloudConnection } from '../utils/supabaseSync'

const router = useRouter()
const bookStore = useBookStore()
const importInput = ref(null)
const dataSize = ref('0 字节')

// 数据管理方法
const handleExport = () => {
  try {
    const msg = exportAllData()
    ElMessage.success(msg)
  } catch (err) {
    ElMessage.error('导出失败：' + err.message)
  }
}

const handleImport = () => {
  importInput.value?.click()
}

const handleFileSelect = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  try {
    const msg = await importAllData(file)
    ElMessage.success(msg)
    // 刷新页面数据
    window.location.reload()
  } catch (err) {
    if (err !== '用户取消导入') {
      ElMessage.error(err)
    }
  }
  
  // 清空 input 值，允许重复选择同一文件
  e.target.value = ''
}

const handleClear = () => {
  try {
    const msg = clearAllData()
    if (msg !== '操作已取消') {
      ElMessage.success(msg)
      window.location.reload()
    }
  } catch (err) {
    ElMessage.error('清空失败：' + err.message)
  }
}

// ==================== 云存储管理 ====================
const cloudForm = reactive({
  url: '',
  anonKey: ''
})

const cloudConfigured = ref(false)
const connectionStatus = ref({})
const lastSyncTime = ref(null)
const savingToCloud = ref(false)
const loadingFromCloud = ref(false)
const syncingWithCloud = ref(false)
const testingConnection = ref(false)

// 保存云存储配置
const handleSaveCloudConfig = () => {
  if (!cloudForm.url || !cloudForm.anonKey) {
    ElMessage.warning('请填写完整的 Project URL 和 anon key')
    return
  }
  
  try {
    setSupabaseConfig(cloudForm.url, cloudForm.anonKey)
    cloudConfigured.value = true
    ElMessage.success('✅ Supabase 配置已保存')
  } catch (error) {
    ElMessage.error('❌ 配置保存失败：' + error.message)
  }
}

// 清除云存储配置
const handleClearCloudConfig = () => {
  if (confirm('确定要清除 Supabase 配置吗？')) {
    clearSupabaseConfig()
    cloudForm.url = ''
    cloudForm.anonKey = ''
    cloudConfigured.value = false
    connectionStatus.value = {}
    ElMessage.info('配置已清除')
  }
}

// 测试连接
const handleTestConnection = async () => {
  if (!cloudForm.url || !cloudForm.anonKey) {
    ElMessage.warning('请先填写并保存配置')
    return
  }
  
  testingConnection.value = true
  try {
    const result = await testCloudConnection()
    connectionStatus.value = result
    
    if (result.success) {
      ElMessage.success(`${result.message}${result.hasData ? ' (已有数据)' : ' (暂无数据)'}`)
    } else {
      ElMessage.error(result.message + (result.error ? `: ${result.error}` : ''))
    }
  } catch (error) {
    connectionStatus.value = { success: false, message: error.message }
    ElMessage.error('连接测试失败：' + error.message)
  } finally {
    testingConnection.value = false
  }
}

// 上传数据到云端
const handleSaveToCloud = async () => {
  savingToCloud.value = true
  try {
    const msg = await saveToCloud()
    ElMessage.success(msg)
    lastSyncTime.value = getLastSyncTime()
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    savingToCloud.value = false
  }
}

// 从云端下载数据
const handleLoadFromCloud = async () => {
  loadingFromCloud.value = true
  try {
    const msg = await loadFromCloud()
    ElMessage.success(msg)
    lastSyncTime.value = getLastSyncTime()
    // 刷新页面以应用新数据
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  } catch (error) {
    if (error.message !== '用户取消操作') {
      ElMessage.error(error.message)
    }
  } finally {
    loadingFromCloud.value = false
  }
}

// 双向同步
const handleSyncWithCloud = async () => {
  syncingWithCloud.value = true
  try {
    const msg = await syncWithCloud()
    ElMessage.success(msg)
    lastSyncTime.value = getLastSyncTime()
    // 刷新页面以应用新数据
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    syncingWithCloud.value = false
  }
}

// 组件挂载时计算数据大小和初始化云存储状态
onMounted(() => {
  dataSize.value = getDataSize()
  lastSyncTime.value = getLastSyncTime()
  cloudConfigured.value = isSupabaseConfigured()
  // 从 localStorage 加载已保存的配置
  const savedUrl = localStorage.getItem('supabase_url') || ''
  const savedAnonKey = localStorage.getItem('supabase_anon_key') || ''
  cloudForm.url = savedUrl
  cloudForm.anonKey = savedAnonKey
})

// 修改信息弹窗
const dialogVisible = ref(false)
const editForm = reactive({
  username: '',
  phone: '',
  email: '',
  avatar: ''
})

// 我的发布
const myPublishList = computed(() => {
  const username = bookStore.user?.username
  if (!username) return []
  return bookStore.bookList.filter(book => book.publisher === username && !book.publishDeleted)
})

// 我的订单
const myOrderList = computed(() => {
  const username = bookStore.user?.username
  if (!username) return []
  return bookStore.transactionRecord.filter(record => record.buyer === username)
})

// 编辑书籍（模拟）
const handleEdit = (id) => {
  ElMessage.info('编辑功能暂未实现，可在BookManage中修改')
}

// 重新上架书籍
const handleRelist = (id) => {
  ElMessageBox.confirm(
    '确认重新上架该书籍？',
    '提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'success'
    }
  ).then(() => {
    bookStore.updateBookStatus(id, 'onSale')
    ElMessage.success('书籍已重新上架！')
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

// 下架书籍
const handleOffSale = (id) => {
  ElMessageBox.confirm(
    '确认下架该书籍？',
    '提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    bookStore.updateBookStatus(id, 'offSale')
    ElMessage.success('书籍已下架！')
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

// 删除发布记录
const handleDelete = (id) => {
  ElMessageBox.confirm(
    '确认删除该发布记录？删除后该书籍将不再显示在列表中！',
    '提示',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(() => {
    try {
      bookStore.deletePublishRecord(id)
      ElMessage.success('发布记录已删除！')
    } catch (error) {
      ElMessage.error(error.message || '删除失败，请重试')
    }
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

// 打开修改信息弹窗
const handleOpenEditDialog = () => {
  // 初始化表单数据
  editForm.username = bookStore.user?.username || ''
  editForm.phone = bookStore.user?.phone || ''
  editForm.email = bookStore.user?.email || ''
  // 检查并替换blob URL头像
  if (bookStore.user?.avatar && bookStore.user.avatar.startsWith('blob:')) {
    editForm.avatar = `https://placehold.co/100x100/666666/ffffff?text=${bookStore.user.username?.charAt(0) || 'U'}`
  } else {
    editForm.avatar = bookStore.user?.avatar || ''
  }
  dialogVisible.value = true
}

// 处理头像上传
const handleAvatarChange = (file) => {
  // 读取文件并转换为DataURL
  const reader = new FileReader()
  reader.onload = (e) => {
    editForm.avatar = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

// 保存修改
const handleSave = () => {
  // 表单验证
  if (!editForm.username) {
    ElMessage.error('用户名不能为空')
    return
  }
  
  if (!editForm.phone) {
    ElMessage.error('手机号不能为空')
    return
  }
  
  try {
    // 调用store方法更新用户信息
    bookStore.updateUserInfo({
      username: editForm.username,
      phone: editForm.phone,
      email: editForm.email,
      avatar: editForm.avatar
    })
    
    ElMessage.success('信息修改成功')
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error(error.message || '修改失败，请重试')
  }
}
</script>

<style scoped>
.user-center {
  padding: 0;
}
.info-card {
  height: 300px;
}
.user-info {
  display: flex;
  align-items: center;
  padding: 20px;
}
.avatar img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-right: 20px;
}
.publish-card, .order-card {
  min-height: 300px;
}

.address {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
}

/* 头像上传样式 */
.avatar-uploader {
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-uploader-icon {
  width: 100px;
  height: 100px;
  line-height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
  font-size: 24px;
  color: #999;
  background-color: #fafafa;
  cursor: pointer;
  transition: all 0.3s;
}

.avatar-uploader-icon:hover {
  border-color: #409eff;
  color: #409eff;
  background-color: #f0f9eb;
}

.data-manage-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.data-manage-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.cloud-card {
  margin-bottom: 20px;
}

.cloud-config-section,
.cloud-actions-section {
  margin-bottom: 10px;
}

.cloud-config-section h4,
.cloud-actions-section h4 {
  margin-bottom: 15px;
  color: #303133;
  font-size: 16px;
}

.cloud-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.last-sync-info {
  margin-top: 10px;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
</style>