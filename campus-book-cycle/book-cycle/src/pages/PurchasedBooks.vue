<template>
  <div class="purchased-books">
    <div class="page-header">
      <h2>已购图书</h2>
      <p>查看您已购买的图书</p>
    </div>

    <div class="books-container">
      <div v-if="purchasedBooks.length === 0" class="empty-state">
        <el-empty description="暂无已购图书" />
      </div>

      <div v-else class="books-grid">
        <div v-for="book in purchasedBooks" :key="book.id" class="book-card">
          <div class="book-cover">
            <img :src="book.cover" :alt="book.name" />
          </div>
          <div class="book-info">
            <h3>{{ book.name }}</h3>
            <p class="book-author">作者：{{ book.author }}</p>
            <p class="book-publisher">出版社：{{ book.publishingHouse }}</p>
            <p class="book-price">购买价格：¥{{ book.salePrice }}</p>
            <p class="book-purchase-time">购买时间：{{ book.purchaseTime }}</p>
            <p class="book-seller">卖家：{{ book.publisher }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBookStore } from '../pinia/store'

const bookStore = useBookStore()

// 已购图书列表
const purchasedBooks = computed(() => {
  if (!bookStore.user) return []
  
  // 从交易记录中获取已完成的订单
  const completedOrders = bookStore.transactionRecord.filter(order => 
    order.buyer === bookStore.user.username && order.status === 'completed'
  )
  
  // 从订单中获取书籍信息
  return completedOrders.map(order => {
    const book = bookStore.bookList.find(b => b.id === order.bookId)
    if (book) {
      return {
        ...book,
        purchaseTime: order.createTime
      }
    }
    return null
  }).filter(Boolean)
})

onMounted(() => {
  console.log('已购图书页面已挂载')
  console.log('已购图书数量：', purchasedBooks.value.length)
})
</script>

<style scoped>
.purchased-books {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
  color: #333;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.books-container {
  min-height: 400px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.book-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.book-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}

.book-cover {
  height: 200px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
}

.book-cover img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

.book-info {
  padding: 15px;
}

.book-info h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
  line-height: 1.4;
}

.book-author,
.book-price,
.book-purchase-time,
.book-seller {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

.book-price {
  color: #f56c6c;
  font-weight: 500;
}

.book-purchase-time {
  font-size: 12px;
  color: #999;
}
</style>