<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-bg"></div>
      <el-card class="login-card">
        <div class="login-title">
          <h2>校园二手书管理系统</h2>
          <p>请登录或注册后管理二手书交易信息</p>
        </div>
        
        <!-- 登录/注册标签页 -->
        <el-tabs v-model="activeTab" class="login-tabs" @tab-click="handleTabClick">
          <el-tab-pane label="登录" name="login">
            <el-form 
              :model="loginForm" 
              :rules="loginRules" 
              ref="loginFormRef" 
              label-position="top"
              class="login-form"
            >
              <el-form-item label="用户名" prop="username">
                <el-input 
                  v-model="loginForm.username" 
                  placeholder="请输入学号/工号"
                  prefix-icon="User"
                  size="large"
                />
              </el-form-item>
              <el-form-item label="密码" prop="password">
                <el-input 
                  v-model="loginForm.password" 
                  type="password" 
                  placeholder="请输入密码"
                  prefix-icon="Lock"
                  size="large"
                  show-password
                />
              </el-form-item>
              <el-form-item label="用户类型">
                <el-radio-group v-model="loginForm.userType" class="user-type-group" @change="handleUserTypeChange">
                  <el-radio-button label="student">学生</el-radio-button>
                  <el-radio-button label="admin">管理员</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleLogin" style="width: 100%" size="large">
                  登录
                </el-button>
              </el-form-item>
              <el-form-item class="forgot-password">
                <el-button type="text" @click="activeTab = 'forgot'">找回密码</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
          
          <!-- 找回密码标签页 -->
          <el-tab-pane label="找回密码" name="forgot">
            <el-form 
              :model="forgotForm" 
              :rules="forgotRules" 
              ref="forgotFormRef" 
              label-position="top"
              class="login-form"
            >
              <el-form-item label="用户名" prop="username">
                <el-input 
                  v-model="forgotForm.username" 
                  placeholder="请输入学号/工号"
                  prefix-icon="User"
                  size="large"
                />
              </el-form-item>
              <el-form-item label="手机号" prop="phone">
                <el-input 
                  v-model="forgotForm.phone" 
                  placeholder="请输入注册时的手机号"
                  prefix-icon="Phone"
                  size="large"
                />
              </el-form-item>
              <el-form-item label="验证码" prop="code">
                <el-input 
                  v-model="forgotForm.code" 
                  placeholder="请输入验证码"
                  prefix-icon="Message"
                  size="large"
                >
                  <template #append>
                    <el-button @click="sendCode" :disabled="countdown > 0">
                      {{ countdown > 0 ? `${countdown}s后重试` : '发送验证码' }}
                    </el-button>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="新密码" prop="newPassword">
                <el-input 
                  v-model="forgotForm.newPassword" 
                  type="password" 
                  placeholder="请输入新密码（6-20位）"
                  prefix-icon="Lock"
                  size="large"
                  show-password
                />
              </el-form-item>
              <el-form-item label="确认新密码" prop="confirmPassword">
                <el-input 
                  v-model="forgotForm.confirmPassword" 
                  type="password" 
                  placeholder="请再次输入新密码"
                  prefix-icon="Lock"
                  size="large"
                  show-password
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleForgotPassword" style="width: 100%" size="large">
                  重置密码
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
          
          <!-- 仅在选择学生类型时显示注册标签页 -->
          <el-tab-pane label="注册" name="register" v-if="loginForm.userType === 'student'" :key="loginForm.userType">
            <el-form 
              :model="registerForm" 
              :rules="registerRules" 
              ref="registerFormRef" 
              label-position="top"
              class="login-form"
            >
              <el-form-item label="用户名" prop="username">
                <el-input 
                  v-model="registerForm.username" 
                  placeholder="请输入学号/工号"
                  prefix-icon="User"
                  size="large"
                />
              </el-form-item>
              <el-form-item label="密码" prop="password">
                <el-input 
                  v-model="registerForm.password" 
                  type="password" 
                  placeholder="请输入密码（6-20位）"
                  prefix-icon="Lock"
                  size="large"
                  show-password
                />
              </el-form-item>
              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input 
                  v-model="registerForm.confirmPassword" 
                  type="password" 
                  placeholder="请再次输入密码"
                  prefix-icon="Lock"
                  size="large"
                  show-password
                />
              </el-form-item>
              <!-- 注册时默认学生类型，不显示用户类型选择器 -->
              <el-form-item>
                <el-button type="primary" @click="handleRegister" style="width: 100%" size="large">
                  注册
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBookStore } from '../pinia/store'
import { ElMessage } from 'element-plus'

// 初始化实例
const router = useRouter()
const bookStore = useBookStore()

// 激活的标签页
const activeTab = ref('login')

// 登录表单
const loginFormRef = ref(null)
const loginForm = ref({
  username: '',
  password: '',
  userType: 'student'
})

// 注册表单
const registerFormRef = ref(null)
const registerForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
  userType: 'student'
})

// 登录表单校验规则
const loginRules = ref({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
})

// 注册表单校验规则
const registerRules = ref({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.value.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

// 找回密码表单
const forgotFormRef = ref(null)
const forgotForm = ref({
  username: '',
  phone: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

// 找回密码表单校验规则
const forgotRules = ref({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== forgotForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

// 验证码倒计时
const countdown = ref(0)
let countdownTimer = null

// 发送验证码
const sendCode = () => {
  // 模拟发送验证码
  ElMessage.success('验证码已发送到您的手机，请注意查收')
  
  // 开始倒计时
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
    }
  }, 1000)
}

// 重置密码
const handleForgotPassword = async () => {
  try {
    // 表单校验
    const valid = await new Promise((resolve) => {
      forgotFormRef.value.validate((isValid) => resolve(isValid))
    })

    if (!valid) return

    // 模拟验证码验证（实际项目中应该调用后端API）
    if (forgotForm.value.code !== '123456') {
      ElMessage.error('验证码错误')
      return
    }

    // 重置密码
    const existingUsers = JSON.parse(localStorage.getItem('campus_book_users') || '[]')
    const userIndex = existingUsers.findIndex(u => u.username === forgotForm.value.username && u.phone === forgotForm.value.phone)
    
    if (userIndex === -1) {
      ElMessage.error('用户不存在或手机号错误')
      return
    }

    // 对新密码进行加密
    const hashPassword = (password) => {
      let hash = 0
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      return hash.toString(16)
    }

    // 更新密码
    existingUsers[userIndex].password = hashPassword(forgotForm.value.newPassword)
    existingUsers[userIndex].updatedAt = new Date().toLocaleString()
    localStorage.setItem('campus_book_users', JSON.stringify(existingUsers))

    ElMessage.success('密码重置成功！请使用新密码登录')
    activeTab.value = 'login'
    
    // 重置表单
    forgotForm.value = {
      username: '',
      phone: '',
      code: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (error) {
    console.error('找回密码失败:', error)
    ElMessage.error('找回密码失败，请稍后重试')
  }
}

// 用户类型变化处理
const handleUserTypeChange = (value) => {
  if (value === 'admin') {
    // 选择管理员类型时自动切换到登录标签页
    activeTab.value = 'login'
  }
}

// 标签页点击处理
const handleTabClick = (tab) => {
  if (tab.name === 'register' && loginForm.value.userType === 'admin') {
    // 管理员类型下不允许切换到注册标签页
    activeTab.value = 'login'
    ElMessage.warning('管理员账号不支持注册')
  }
}

// 登录处理
const handleLogin = async () => {
  try {
    // 表单校验
    const valid = await new Promise((resolve) => {
      loginFormRef.value.validate((isValid) => resolve(isValid))
    })

    if (!valid) return

    // 执行登录
    bookStore.login(loginForm.value)
    
    ElMessage.success('登录成功！即将跳转到管理页面')
    setTimeout(() => {
      router.push({ path: '/dashboard/book-manage' }).then(() => {
        console.log('跳转成功：/dashboard/book-manage')
      }).catch(err => {
        console.error('跳转失败：', err)
        ElMessage.error('页面跳转失败，请手动刷新')
      })
    }, 500)

  } catch (err) {
    console.error('登录异常：', err)
    ElMessage.error(err.message || '登录失败，请检查账号密码或重试')
  }
}

// 注册处理
const handleRegister = async () => {
  try {
    // 表单校验
    const valid = await new Promise((resolve) => {
      registerFormRef.value.validate((isValid) => resolve(isValid))
    })

    if (!valid) return

    // 注册时强制设置为学生类型
    registerForm.value.userType = 'student'
    // 执行注册
    const newUser = bookStore.register(registerForm.value)
    
    // 切换到登录标签页（无成功提示）
    activeTab.value = 'login'
    
    // 填充用户名到登录表单
    loginForm.value.username = registerForm.value.username
    
    // 清空注册表单
    registerForm.value = {
      username: '',
      password: '',
      confirmPassword: '',
      userType: 'student'
    }
    
    // 重置表单验证
    registerFormRef.value.resetFields()

  } catch (err) {
    console.error('注册异常：', err)
    ElMessage.error(err.message || '注册失败，请检查信息或重试')
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.login-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="20" cy="80" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.1)"/></svg>');
  animation: bgFloat 20s ease-in-out infinite;
}

@keyframes bgFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(20px); }
}

.login-card {
  width: 450px;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  transform: translateY(0);
  transition: all 0.3s ease;
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.25);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.2);
}

.login-title h2 {
  color: #667eea;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.login-title p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.login-form {
  margin-top: 20px;
}

.login-form :deep(.el-form-item__label) {
  color: #333;
  font-weight: 600;
  margin-bottom: 8px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.4);
}

.user-type-group {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.login-form :deep(.el-radio-button__inner) {
  border-radius: 20px;
  padding: 8px 20px;
  transition: all 0.3s ease;
}

.login-form :deep(.el-radio-button__orig-radio:checked+.el-radio-button__inner) {
  background-color: #667eea;
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.login-form :deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.login-form :deep(.el-button--primary:hover) {
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  transform: translateY(-2px);
}

.login-form :deep(.el-button--primary:active) {
  transform: translateY(0);
}

/* 添加页面加载动画 */
.login-card {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.forgot-password {
  text-align: right;
  margin-top: -10px;
  margin-bottom: 10px;
}

.forgot-password .el-button {
  padding: 0;
}

/* 验证码按钮样式 */
.login-form .el-input-group__append {
  padding: 0;
}

.login-form .el-input-group__append .el-button {
  padding: 0 10px;
}
</style>