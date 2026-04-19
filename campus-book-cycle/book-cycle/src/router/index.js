import { createRouter, createWebHistory } from 'vue-router'
import { useBookStore } from '../pinia/store'
import { ElMessage } from 'element-plus'

// 懒加载页面组件
const Login = () => import('../pages/Login.vue')
const Dashboard = () => import('../pages/Dashboard.vue')
const BookManage = () => import('../pages/BookManage.vue')
const Transaction = () => import('../pages/Transaction.vue')
const UserCenter = () => import('../pages/UserCenter.vue')
const DataBoard = () => import('../pages/DataBoard.vue')
// 新增权限管理页面
const PermissionManage = () => import('../pages/PermissionManage.vue')
// 新增购物车页面
const Cart = () => import('../pages/Cart.vue')
// 新增已购图书页面
const PurchasedBooks = () => import('../pages/PurchasedBooks.vue')
// 新增轮播图管理页面
const CarouselManage = () => import('../pages/CarouselManage.vue')

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'book-manage',
        name: 'BookManage',
        component: BookManage,
        meta: { requiresAuth: true }
      },
      {
        path: 'transaction',
        name: 'Transaction',
        component: Transaction,
        meta: { requiresAuth: true }
      },
      {
        path: 'user-center',
        name: 'UserCenter',
        component: UserCenter,
        meta: { requiresAuth: true }
      },
      {
        path: 'data-board',
        name: 'DataBoard',
        component: DataBoard,
        meta: { 
          requiresAuth: true,
          requiredRole: 'admin' // 仅管理员可访问
        }
      },
      {
        path: 'permission-manage',
        name: 'PermissionManage',
        component: PermissionManage,
        meta: { 
          requiresAuth: true,
          requiredRole: 'admin' // 仅管理员可访问
        }
      },
      {
        path: 'cart',
        name: 'Cart',
        component: Cart,
        meta: {
          requiresAuth: true,
          requiredRole: 'student'
        }
      },
      {
        path: 'purchased-books',
        name: 'PurchasedBooks',
        component: PurchasedBooks,
        meta: {
          requiresAuth: true,
          requiredRole: 'student'
        }
      },
      {
        path: 'carousel-manage',
        name: 'CarouselManage',
        component: CarouselManage,
        meta: {
          requiresAuth: true,
          requiredRole: 'admin'
        }
      }
    ]
  },
  // 404路由
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// 路由守卫：登录+角色+权限校验
router.beforeEach((to, from, next) => {
  const bookStore = useBookStore()
  let isLogin = false
  
  try {
    isLogin = localStorage.getItem('campus_book_login') === 'true'
  } catch (err) {
    console.warn('获取登录状态失败：', err)
    isLogin = false
  }

  // 无需登录的页面直接放行
  if (!to.meta.requiresAuth) {
    next()
    return
  }

  // 未登录跳登录页
  if (!isLogin) {
    next('/login')
    return
  }

  // 确保用户信息已初始化
  if (!bookStore.user) {
    bookStore.initUser()
  }

  // 角色校验（如数据看板仅管理员可访问）
  if (to.meta.requiredRole) {
    // 直接从本地存储读取用户信息，确保获取最新的用户类型
    let currentRole = bookStore.user?.userType
    
    // 如果store中没有用户类型，尝试从本地存储直接读取
    if (!currentRole) {
      try {
        const userStr = localStorage.getItem('campus_book_user')
        if (userStr) {
          const user = JSON.parse(userStr)
          currentRole = user.userType
        }
      } catch (err) {
        console.warn('从本地存储读取用户信息失败：', err)
      }
    }
    
    // 如果仍然没有用户类型，默认为学生
    if (!currentRole) {
      currentRole = 'student'
    }
    
    console.log('当前用户类型：', currentRole, '需要的角色：', to.meta.requiredRole)
    
    if (currentRole !== to.meta.requiredRole) {
      // 无权限跳403（或首页）
      next('/dashboard/book-manage')
      ElMessage.warning('无权限访问该页面！')
      return
    }
  }

  next()
})

export default router