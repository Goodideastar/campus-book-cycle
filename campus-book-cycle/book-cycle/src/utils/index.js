// 日期格式化
export const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

// 计算二手书定价参考（原价*折扣）
export const calcSalePrice = (originalPrice, discount) => {
  if (!originalPrice || !discount) return 0
  return Math.floor(originalPrice * discount)
}

// 状态文字映射
export const getStatusText = (status) => {
  const map = {
    onSale: '在售',
    sold: '已售出',
    offSale: '已下架',
    pending: '待确认',
    completed: '已完成',
    cancel: '已取消'
  }
  return map[status] || '未知'
}

// 状态类型映射（Element Plus标签）
export const getStatusType = (status) => {
  const map = {
    onSale: 'success',
    sold: 'info',
    offSale: 'gray',
    pending: 'warning',
    completed: 'success',
    cancel: 'danger'
  }
  return map[status] || 'info'
}