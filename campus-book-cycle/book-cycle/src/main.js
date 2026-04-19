import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import router from './router'
import App from './App.vue'
// 导入权限指令
import { setupPermissionDirective } from './directives/permission'
import { useBookStore } from './pinia/store'

const app = createApp(App)
const pinia = createPinia()

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册权限指令
setupPermissionDirective(app)

app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 初始化用户（恢复权限）
const bookStore = useBookStore()
bookStore.initUser()
// 初始化消息通知
bookStore.initNotifications()
// 初始化localStorage监听，实现不同端口间的数据同步
bookStore.initLocalStorageListener()

app.mount('#app')