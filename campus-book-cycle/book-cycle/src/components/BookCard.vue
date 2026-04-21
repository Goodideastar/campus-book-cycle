<template>
  <el-card class="book-card" shadow="hover">
    <!-- 书籍封面 -->
    <div class="book-cover">
      <img :src="book.cover" alt="书籍封面" />
    </div>
    <!-- 书籍信息 -->
    <div class="book-info">
      <h3>
        {{ book.name }}
        <el-tag :type="getStatusType(book.status)">{{ getStatusText(book.status) }}</el-tag>
      </h3>
      <p>分类：{{ book.cateName }} | 作者：{{ book.author }}</p>
      <p>原价：¥{{ book.originalPrice }} | 售价：¥{{ book.salePrice }}</p>
      <p>成色：{{ book.statusName }} | 发布人：{{ book.publisher }}</p>
      <p class="desc" v-if="book.desc">{{ book.desc }}</p>
    </div>
    <!-- 操作按钮 -->
    <div class="book-actions">
      <el-button 
        type="primary" 
        size="small" 
        @click="handleBuy"
        v-if="book.status === 'onSale'"
      >
        立即购买
      </el-button>
      <el-button 
        type="info" 
        size="small" 
        @click="showQrCode = true"
      >
        <span class="qr-emoji" aria-hidden="true">🔳</span> 书籍码
      </el-button>
    </div>

    <!-- 二维码弹窗 -->
    <el-dialog title="书籍信息二维码" v-model="showQrCode" width="300px">
      <div ref="qrcodeRef" class="qrcode-container"></div>
    </el-dialog>

    <!-- 购买弹窗 -->
    <el-dialog title="确认购买" v-model="showBuyDialog" width="400px">
      <el-form :model="buyForm" label-width="80px">
        <el-form-item label="书籍名称">
          <span>{{ book.name }}</span>
        </el-form-item>
        <el-form-item label="售价">
          <span>¥{{ book.salePrice }}</span>
        </el-form-item>
        <el-form-item label="购买人">
          <el-input v-model="buyForm.buyer" placeholder="请输入你的姓名" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="buyForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="交易地点">
          <el-input v-model="buyForm.address" placeholder="请输入交易地点（如XX教学楼）" />
        </el-form-item>
      </el-form>
      <template v-slot:footer>
        <el-button @click="showBuyDialog = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmBuy">确认购买</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, watch } from 'vue'
import QRCode from 'qrcode'
import { useBookStore } from '../pinia/store'
import { getStatusText, getStatusType } from '../utils/index'
import { ElMessage } from 'element-plus'

const bookStore = useBookStore()
const props = defineProps({
  book: {
    type: Object,
    required: true
  }
})

// 响应式数据
const showQrCode = ref(false)
const showBuyDialog = ref(false)
const qrcodeRef = ref(null)
const buyForm = ref({
  buyer: '',
  phone: '',
  address: ''
})

// 生成二维码（使用 `qrcode` 包生成 data URL 并插入 img）
const generateQrCode = async () => {
  if (!qrcodeRef.value) return
  qrcodeRef.value.innerHTML = ''
  const payload = JSON.stringify({
    id: props.book.id,
    name: props.book.name,
    cate: props.book.cateName,
    price: props.book.salePrice,
    publisher: props.book.publisher
  })
  try {
    const dataUrl = await QRCode.toDataURL(payload, { width: 200, margin: 1 })
    const img = document.createElement('img')
    img.src = dataUrl
    img.alt = 'qrcode'
    img.width = 200
    img.height = 200
    qrcodeRef.value.appendChild(img)
  } catch (err) {
    console.error('生成二维码失败', err)
  }
}

// 监听弹窗显示
watch(showQrCode, (val) => {
  if (val) setTimeout(generateQrCode, 100)
})

// 处理购买
const handleBuy = () => {
  showBuyDialog.value = true
  // 初始化购买人（当前登录用户）
  buyForm.value.buyer = bookStore.user?.username || ''
}

// 确认购买
const handleConfirmBuy = () => {
  if (!buyForm.value.buyer || !buyForm.value.phone || !buyForm.value.address) {
    ElMessage.warning('请填写完整购买信息！')
    return
  }

  bookStore.createTransaction({
    bookId: props.book.id,
    bookName: props.book.name,
    buyer: buyForm.value.buyer,
    seller: props.book.publisher,
    price: props.book.salePrice,
    address: buyForm.value.address,
    phone: buyForm.value.phone
  })

  showBuyDialog.value = false
  ElMessage.success('下单成功！请等待卖家确认')
  
  // 重置表单
  buyForm.value = {
    buyer: '',
    phone: '',
    address: ''
  }
}

// 暴露方法
defineExpose({
  getStatusText,
  getStatusType
})
</script>

<style scoped>
.book-card {
  width: 320px;
  margin: 10px;
  display: inline-block;
  vertical-align: top;
}
.book-cover {
  text-align: center;
  margin-bottom: 10px;
}
.book-cover img {
  width: 120px;
  height: 160px;
  object-fit: cover;
  border-radius: 4px;
}
.book-info {
  margin-bottom: 15px;
}
.book-info .desc {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}
.book-actions {
  display: flex;
  gap: 10px;
}
.qrcode-container {
  text-align: center;
  padding: 10px;
}
</style>