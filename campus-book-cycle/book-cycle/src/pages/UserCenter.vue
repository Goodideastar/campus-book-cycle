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
  </div>
</template>

<script setup>
import { computed, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useBookStore } from '../pinia/store'
import { getStatusText, getStatusType } from '../utils/index'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const bookStore = useBookStore()

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
</style>