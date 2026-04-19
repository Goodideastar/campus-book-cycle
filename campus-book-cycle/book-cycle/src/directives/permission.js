import { useBookStore } from '../pinia/store'

// 自定义权限指令：v-permission="权限码"
export const permissionDirective = {
  mounted(el, binding) {
    const bookStore = useBookStore()
    const permissionCode = binding.value
    // 无权限则隐藏元素
    if (permissionCode && !bookStore.hasPermission(permissionCode)) {
      el.style.display = 'none'
      // 彻底移除（可选）
      // el.parentNode?.removeChild(el)
    }
  },
  // 组件更新时重新校验
  updated(el, binding) {
    const bookStore = useBookStore()
    const permissionCode = binding.value
    if (permissionCode && !bookStore.hasPermission(permissionCode)) {
      el.style.display = 'none'
    } else {
      el.style.display = ''
    }
  }
}

// 注册指令到Vue
export const setupPermissionDirective = (app) => {
  app.directive('permission', permissionDirective)
}