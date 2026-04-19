<template>
  <div class="data-board">
    <el-page-header 
      content="数据看板" 
      @back="router.back()"
    />

    <!-- 数据概览 -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span class="menu-icon">📚</span>
              <span>总书籍数</span>
            </div>
          </template>
          <div class="stat-value">{{ totalBookCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <el-icon><ShoppingCart /></el-icon>
              <span>交易总数</span>
            </div>
          </template>
          <div class="stat-value">{{ totalTradeCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <el-icon><Wallet /></el-icon>
              <span>交易总额</span>
            </div>
          </template>
          <div class="stat-value">¥{{ totalTradeAmount }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <el-icon><User /></el-icon>
              <span>在售书籍数</span>
            </div>
          </template>
          <div class="stat-value">{{ onSaleBookCount }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>书籍分类占比</span>
          </template>
          <div ref="cateChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>月度交易数量趋势</span>
          </template>
          <div ref="tradeChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBookStore } from '../pinia/store'
import * as echarts from 'echarts'
// 图标已在 `main.js` 全局注册，无需在此处按名导入

const router = useRouter()
const bookStore = useBookStore()
const cateChartRef = ref(null)
const tradeChartRef = ref(null)

// 数据概览
const totalBookCount = computed(() => bookStore.bookList.filter(book => !book.publishDeleted).length)
const totalTradeCount = computed(() => bookStore.transactionRecord.length)
const totalTradeAmount = computed(() => {
  return bookStore.transactionRecord.reduce((sum, item) => sum + item.price, 0) || 0
})
const onSaleBookCount = computed(() => {
  return bookStore.bookList.filter(book => book.status === 'onSale' && !book.publishDeleted).length
})

// 生成书籍分类占比数据
const generateCateData = () => {
  const cateMap = {}
  const validBooks = bookStore.bookList.filter(book => !book.publishDeleted)
  const totalBooks = validBooks.length
  
  if (totalBooks === 0) {
    return [{ name: '暂无数据', value: 100 }]
  }
  
  validBooks.forEach(book => {
    const cateId = book.cateId
    if (cateId) {
      cateMap[cateId] = (cateMap[cateId] || 0) + 1
    }
  })
  
  // 转换为图表所需格式
  return Object.entries(cateMap).map(([cateId, count]) => {
    // 查找分类名称
    const category = bookStore.bookCate.find(cate => cate.id === cateId)
    const cateName = category ? category.name : `分类${cateId}`
    const percentage = Math.round((count / totalBooks) * 100)
    return { name: cateName, value: percentage }
  })
}

// 生成月度交易趋势数据
const generateTradeData = () => {
  // 生成最近6个月的月份标签
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${date.getMonth() + 1}月`)
  }
  
  // 统计每个月的交易数量
  const monthCounts = Array(6).fill(0)
  
  bookStore.transactionRecord.forEach(trade => {
    if (trade.createTime) {
      // 解析交易时间
      const tradeDate = new Date(trade.createTime)
      const tradeMonth = tradeDate.getMonth() + 1
      const currentMonth = now.getMonth() + 1
      
      // 计算交易所在的月份索引（最近6个月内）
      let monthIndex = currentMonth - tradeMonth
      if (monthIndex < 0) {
        monthIndex += 12
      }
      
      if (monthIndex >= 0 && monthIndex < 6) {
        monthCounts[5 - monthIndex]++
      }
    }
  })
  
  return {
    months,
    counts: monthCounts
  }
}

// 初始化图表
const initCharts = () => {
  // 检查DOM元素是否存在
  if (!cateChartRef.value || !tradeChartRef.value) {
    console.warn('图表DOM元素不存在，无法初始化ECharts')
    return
  }

  // 书籍分类占比饼图
  const cateChart = echarts.init(cateChartRef.value)
  const cateData = generateCateData()
  cateChart.setOption({
    title: { text: '', left: 'center' },
    tooltip: { trigger: 'item' },
    series: [{
      name: '分类占比',
      type: 'pie',
      radius: ['40%', '70%'],
      data: cateData,
      label: {
        show: true,
        formatter: '{b}: {c}%'
      }
    }]
  })

  // 月度交易趋势柱状图
  const tradeChart = echarts.init(tradeChartRef.value)
  const tradeData = generateTradeData()
  tradeChart.setOption({
    title: { text: '', left: 'center' },
    xAxis: {
      type: 'category',
      data: tradeData.months
    },
    yAxis: {
      type: 'value',
      name: '交易数量'
    },
    series: [{
      data: tradeData.counts,
      type: 'bar',
      color: '#1989fa'
    }],
    tooltip: { trigger: 'axis' }
  })

  // 自适应窗口大小
  window.addEventListener('resize', () => {
    cateChart.resize()
    tradeChart.resize()
  })
}

onMounted(() => {
  setTimeout(initCharts, 100)
})
</script>

<style scoped>
.data-board {
  padding: 0;
}
.stat-card {
  text-align: center;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.card-header el-icon {
  margin-right: 5px;
}
.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #1989fa;
  margin-top: 10px;
}
.chart-container {
  width: 100%;
  height: 400px;
}
</style>