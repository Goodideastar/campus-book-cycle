<template>
  <el-container style="height: 100%;">
    <el-aside width="200px" style="background-color: #2e3b4e;">
      <div class="logo">
        <div class="logo-icon">📖</div>
        <span>二手书管理系统</span>
      </div>
      <el-menu
        default-active="1"
        class="el-menu-vertical-demo"
        background-color="#2e3b4e"
        text-color="#fff"
        active-text-color="#ffd04b"
        @select="handleMenuSelect"
      >
        <el-menu-item index="1">
          <span class="menu-icon">📚</span>
          <template #title>书籍管理</template>
        </el-menu-item>
        <el-menu-item index="2">
          <el-icon><ShoppingCart /></el-icon>
          <template #title>交易管理</template>
        </el-menu-item>
        <el-menu-item index="3">
          <el-icon><User /></el-icon>
          <template #title>个人中心</template>
        </el-menu-item>
        <!-- 仅管理员可见：数据看板 -->
        <el-menu-item index="4" v-permission="PERMISSIONS.DATA_VIEW">
          <el-icon><DataBoard /></el-icon>
          <template #title>数据看板</template>
        </el-menu-item>
        <!-- 仅管理员可见：权限管理 -->
        <el-menu-item index="5" v-permission="PERMISSIONS.PERMISSION_MANAGE">
          <el-icon><Key /></el-icon>
          <template #title>权限管理</template>
        </el-menu-item>
        <el-menu-item index="6" v-permission="PERMISSIONS.DATA_VIEW">
          <el-icon><Picture /></el-icon>
          <template #title>轮播图管理</template>
        </el-menu-item>
        <el-menu-item index="7" v-if="bookStore.user && bookStore.user.userType === 'student'">
          <el-icon><ShoppingCart /></el-icon>
          <template #title>购物车</template>
        </el-menu-item>
        <el-menu-item index="8" v-if="bookStore.user && bookStore.user.userType === 'student'">
          <el-icon><Book /></el-icon>
          <template #title>已购图书</template>
        </el-menu-item>
        <el-menu-item index="9" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          <template #title>退出登录</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header style="text-align: right; font-size: 12px; border-bottom: 1px solid #e6e6e6; display: flex; justify-content: flex-end; align-items: center; gap: 20px;">
        <!-- 消息通知 -->
        <el-dropdown trigger="click">
          <el-badge :value="notifications.length" type="danger">
            <el-icon class="message-icon" style="font-size: 22px; color: #666; cursor: pointer;">
              <BellFilled />
            </el-icon>
          </el-badge>
          <template #dropdown>
            <el-dropdown-menu style="width: 320px; max-height: 400px; overflow-y: auto;">
              <div class="notification-header">
                <h3>消息通知</h3>
                <el-button type="text" size="small" @click="clearAllNotifications">清空</el-button>
              </div>
              <el-dropdown-item v-if="notifications.length === 0" style="text-align: center; color: #999;">
                暂无新消息
              </el-dropdown-item>
              <div 
                v-for="notification in notifications" 
                :key="notification.id" 
                class="notification-item"
                :class="{ 'read': notification.read }"
                @click="markNotificationAsRead(notification.id)"
              >
                <div class="notification-content">
                  <div class="notification-title">{{ notification.title }}</div>
                  <div class="notification-time">{{ notification.time }}</div>
                </div>
                <div class="notification-desc">{{ notification.description }}</div>
              </div>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 用户菜单 -->
        <el-dropdown>
          <span class="el-dropdown-link user-menu">
            <img 
              :src="bookStore.user?.avatar || `https://placehold.co/40x40/666666/ffffff?text=${bookStore.user?.username?.charAt(0) || 'U'}`" 
              alt="用户头像" 
              class="user-avatar"
            />
            <span class="user-info">
              <span>{{ bookStore.user&&bookStore.user.username || '用户' }}</span>
              <span v-if="bookStore.user && bookStore.user.userType === 'student'" class="user-type">[学生]</span>
              <span v-if="bookStore.user && bookStore.user.userType === 'admin'" class="user-type">[管理员]</span>
            </span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleUserCenter">个人信息</el-dropdown-item>
              <el-dropdown-item @click="showPasswordDialog = true">修改密码</el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <!-- 修改密码对话框 -->
        <el-dialog
          v-model="showPasswordDialog"
          title="修改密码"
          width="400px"
        >
          <el-form
            :model="passwordForm"
            :rules="passwordRules"
            ref="passwordFormRef"
            label-position="top"
          >
            <el-form-item label="原密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                placeholder="请输入原密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="请输入新密码（6-20位）"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                show-password
              />
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="showPasswordDialog = false">取消</el-button>
              <el-button type="primary" @click="handleChangePassword">确认修改</el-button>
            </span>
          </template>
        </el-dialog>
      </el-header>
      <el-main style="padding: 20px;">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { useBookStore, PERMISSIONS } from '../pinia/store'
import { ElMessage } from 'element-plus'

// 导入密码加密工具函数
const hashPassword = (password) => {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}

const verifyPassword = (password, hashedPassword) => {
  return hashPassword(password) === hashedPassword
}
// 图标组件已在 `main.js` 中全局注册，无需在此处按名导入

const router = useRouter()
const bookStore = useBookStore()

// 消息通知数据：使用store中的真实数据
const notifications = computed(() => bookStore.notifications)

// 清空所有通知
const clearAllNotifications = () => {
  bookStore.clearNotifications()
  ElMessage.success('已清空所有通知')
}

// 标记通知为已读
const markNotificationAsRead = (notificationId) => {
  bookStore.markNotificationAsRead(notificationId)
}

// 组件挂载时初始化通知
onMounted(() => {
  // 初始化通知
  bookStore.initNotifications()
  console.log('通知组件已挂载，通知数量：', bookStore.notifications.length)
})

// 菜单切换（新增权限管理页和购物车）
const handleMenuSelect = (index) => {
  const pathMap = {
    '1': '/dashboard/book-manage',
    '2': '/dashboard/transaction',
    '3': '/dashboard/user-center',
    '4': '/dashboard/data-board',
    '5': '/dashboard/permission-manage', // 新增
    '6': '/dashboard/carousel-manage', // 新增轮播图管理
    '7': '/dashboard/cart', // 新增购物车
    '8': '/dashboard/purchased-books', // 新增已购图书
    '9': '' // 退出登录，不需要路由
  }
  if (pathMap[index]) {
    router.push(pathMap[index]).catch(err => console.warn('菜单跳转失败：', err))
  }
}

// 个人中心导航
const handleUserCenter = () => {
  router.push('/dashboard/user-center').catch(err => console.warn('个人中心跳转失败：', err))
}

// 修改密码相关
const showPasswordDialog = ref(false)
const passwordFormRef = ref(null)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = ref({
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的新密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

// 修改密码
const handleChangePassword = async () => {
  try {
    // 表单校验
    const valid = await new Promise((resolve) => {
      passwordFormRef.value.validate((isValid) => resolve(isValid))
    })

    if (!valid) return

    // 验证原密码
    const username = bookStore.user?.username
    if (!username) {
      ElMessage.error('用户信息异常')
      return
    }

    const existingUsers = JSON.parse(localStorage.getItem('campus_book_users') || '[]')
    const userIndex = existingUsers.findIndex(user => user.username === username)
    
    if (userIndex === -1) {
      ElMessage.error('用户不存在')
      return
    }

    const currentUser = existingUsers[userIndex]
    if (!verifyPassword(passwordForm.value.oldPassword, currentUser.password)) {
      ElMessage.error('原密码错误')
      return
    }

    // 更新密码（加密存储）
    currentUser.password = hashPassword(passwordForm.value.newPassword)
    existingUsers[userIndex] = currentUser
    localStorage.setItem('campus_book_users', JSON.stringify(existingUsers))

    // 更新store中的用户信息
    bookStore.user = currentUser

    ElMessage.success('密码修改成功！')
    showPasswordDialog.value = false
    
    // 清空表单
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    passwordFormRef.value.resetFields()

  } catch (err) {
    console.error('修改密码异常：', err)
    ElMessage.error(err.message || '密码修改失败，请重试')
  }
}

// 退出登录
const handleLogout = () => {
  bookStore.logout()
  ElMessage.info('已退出登录！')
  router.push('/login').catch(err => console.warn('退出跳转失败：', err))
}
</script>

<style scoped>
.el-header {
  background-color: #fff;
  color: #333;
  line-height: 60px;
}
.el-aside {
  color: #333;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  border-bottom: 1px solid #404854;
}
.logo img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 10px;
}
.logo-icon {
  width: 30px;
  height: 30px;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
}
.el-dropdown-link {
  cursor: pointer;
  color: #666;
}

/* 消息通知样式 */
.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px 12px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 8px;
}

.notification-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.notification-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f5f7fa;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.read {
  background-color: #f9f9f9;
  opacity: 0.7;
}

.notification-item.read .notification-title {
  font-weight: normal;
}

.notification-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.notification-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin-top: 4px;
}

.message-icon {
  transition: color 0.2s ease;
}

.message-icon:hover {
  color: #667eea !important;
}

/* 用户菜单样式 */
.user-menu {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.user-menu:hover {
  background-color: #f5f7fa;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f0f0f0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

.user-type {
  font-size: 12px;
  color: #999;
}
</style>