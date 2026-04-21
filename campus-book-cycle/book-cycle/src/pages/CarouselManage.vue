<template>
  <div class="carousel-manage">
    <el-page-header 
      content="轮播图管理" 
      @back="router.back()"
    />

    <div class="operate-bar">
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon> 添加轮播书籍
      </el-button>
    </div>

    <el-card class="carousel-card">
      <template #header>
        <span>轮播书籍列表</span>
      </template>
      <el-table 
        :data="carouselBooks" 
        border 
        stripe 
        style="width: 100%;"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="书籍封面" width="100">
          <template #default="scope">
            <img :src="scope.row.cover" :alt="scope.row.name" class="book-cover" />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="书籍名称" width="200" />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="salePrice" label="售价(元)" width="100" />
        <el-table-column prop="publisher" label="发布人" width="120" />
        <el-table-column prop="publishTime" label="发布时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button 
              type="danger" 
              size="small" 
              @click="removeFromCarousel(scope.row.id)"
            >
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加轮播书籍弹窗 -->
    <el-dialog 
      title="添加轮播书籍" 
      v-model="showAddDialog" 
      width="600px"
    >
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="选择书籍">
          <el-select 
            v-model="addForm.bookId" 
            placeholder="请选择在售且已审核的书籍" 
            style="width: 100%;"
          >
            <el-option 
              v-for="book in availableBooks" 
              :key="book.id" 
              :label="`${book.name} - ${book.author} (¥${book.salePrice})`" 
              :value="book.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addCarouselBook">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBookStore } from '../pinia/store'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const bookStore = useBookStore()

// 弹窗状态
const showAddDialog = ref(false)

// 添加表单
const addForm = ref({
  bookId: ''
})

// 可用书籍列表（在售且已审核的书籍）
const availableBooks = computed(() => {
  return bookStore.bookList.filter(book => 
    book.status === 'onSale' && book.auditStatus === 'audited' && !book.publishDeleted
  )
})

// 轮播书籍列表
const carouselBooks = computed(() => {
  return bookStore.carouselBooks
})

// 打开添加弹窗
const openAddDialog = () => {
  addForm.value.bookId = ''
  showAddDialog.value = true
}

// 添加轮播书籍
const addCarouselBook = () => {
  if (!addForm.value.bookId) {
    ElMessage.warning('请选择书籍')
    return
  }

  try {
    bookStore.addCarouselBook(addForm.value.bookId)
    ElMessage.success('添加成功')
    showAddDialog.value = false
  } catch (error) {
    ElMessage.error(error.message || '添加失败')
  }
}

// 从轮播中移除书籍
const removeFromCarousel = (bookId) => {
  ElMessageBox.confirm(
    '确认从轮播中移除该书籍？',
    '提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    bookStore.removeCarouselBook(bookId)
    ElMessage.success('移除成功')
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

onMounted(() => {
  console.log('轮播图管理页面已挂载')
  console.log('轮播书籍数量：', carouselBooks.value.length)
})
</script>

<style scoped>
.carousel-manage {
  padding: 0;
}

.operate-bar {
  margin: 15px 0;
}

.carousel-card {
  min-height: 600px;
}

.book-cover {
  width: 60px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}
</style>