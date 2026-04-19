<template>
  <div class="transaction">
    <el-page-header 
      content="交易管理" 
      @back="router.back()"
    />

    <div class="operate-bar">
      <el-select 
        v-model="statusFilter" 
        placeholder="按交易状态筛选" 
        style="width: 150px;"
      >
        <el-option label="全部" value="" />
        <el-option label="待确认" value="pending" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancel" />
      </el-select>
    </div>

    <el-card class="record-card">
      <template #header>
        <span>交易记录</span>
      </template>
      <el-table 
        :data="filterTransactionList" 
        border 
        stripe 
        style="width: 100%;"
      >
        <el-table-column prop="createTime" label="交易时间" width="180" />
        <el-table-column prop="bookName" label="书籍名称" width="200" />
        <el-table-column prop="buyer" label="购买人" width="120" />
        <el-table-column prop="seller" label="出售人" width="120" />
        <el-table-column prop="price" label="交易金额(元)" width="120" />
        <el-table-column prop="tradeType" label="交易类型" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.tradeType === 'online' ? 'primary' : 'success'">
              {{ scope.row.tradeType === 'online' ? '线上' : '线下' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="120">
          <template #default="scope">
            <span v-if="scope.row.paymentMethod">
              {{ scope.row.paymentMethod === 'wechat' ? '微信支付' : '支付宝支付' }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="交易状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <!-- 权限控制：学生只能操作自己的交易，管理员可操作所有 -->
            <el-button 
              type="success" 
              size="small" 
              @click="handleComplete(scope.row.id)"
              v-if="scope.row.status === 'pending'"
              v-permission="scope.row.buyer === bookStore.user.username || scope.row.seller === bookStore.user.username ? PERMISSIONS.TRADE_MANAGE_OWN : PERMISSIONS.TRADE_MANAGE_ALL"
            >
              确认完成
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="handleCancel(scope.row.id)"
              v-if="scope.row.status === 'pending'"
              v-permission="scope.row.buyer === bookStore.user.username || scope.row.seller === bookStore.user.username ? PERMISSIONS.TRADE_MANAGE_OWN : PERMISSIONS.TRADE_MANAGE_ALL"
            >
              取消交易
            </el-button>
            <span v-else>无操作</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBookStore, PERMISSIONS } from '../pinia/store'
import { getStatusText, getStatusType } from '../utils/index'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const bookStore = useBookStore()

// 初始化交易记录
onMounted(() => {
  console.log('交易管理页面已挂载')
  console.log('交易记录数量：', bookStore.transactionRecord.length)
})

// 筛选条件
const statusFilter = ref('')

// 筛选后的交易列表
const filterTransactionList = computed(() => {
  return bookStore.transactionRecord.filter(record => {
    return !statusFilter.value || record.status === statusFilter.value
  })
})

// 确认完成交易
const handleComplete = (id) => {
  ElMessageBox.confirm(
    '确认完成该交易？',
    '提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    bookStore.completeTransaction(id)
    ElMessage.success('交易已完成！')
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

// 取消交易
const handleCancel = (id) => {
  ElMessageBox.confirm(
    '确认取消该交易？取消后书籍将恢复为在售状态',
    '提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(() => {
    bookStore.cancelTransaction(id)
    ElMessage.success('交易已取消！')
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}
</script>

<style scoped>
.transaction {
  padding: 0;
}
.operate-bar {
  margin: 15px 0;
}
.record-card {
  min-height: 600px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>