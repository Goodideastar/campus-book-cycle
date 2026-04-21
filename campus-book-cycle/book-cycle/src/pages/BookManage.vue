<template>
  <div class="book-manage">
    <!-- 页面头部 -->
    <el-page-header 
      content="二手书管理" 
      @back="router.back()"
    />

    <!-- 轮播图 -->
    <div class="carousel-container" v-if="carouselBooks.length > 0">
      <el-carousel :interval="5000" type="card" height="300px">
        <el-carousel-item v-for="book in carouselBooks" :key="book.id">
          <div class="carousel-item" @click="handleCarouselClick(book.id)">
            <img :src="book.cover" :alt="book.name" class="book-cover" />
            <div class="book-info">
              <h3>{{ book.name }}</h3>
              <p class="book-author">作者：{{ book.author }}</p>
              <p class="book-price">
                <span class="original-price">¥{{ book.originalPrice }}</span>
                <span class="sale-price">¥{{ book.salePrice }}</span>
              </p>
              <p class="book-desc">{{ book.desc || '暂无描述' }}</p>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- 操作栏 -->
    <div class="operate-bar">
      <!-- 发布书籍按钮（权限控制） -->
      <el-button type="primary" @click="showAddDialog = true" v-permission="PERMISSIONS.BOOK_PUBLISH">
        <el-icon><Plus /></el-icon> 发布二手书
      </el-button>
      
      <!-- 审核状态筛选（仅管理员可见） -->
      <el-select 
        v-permission="PERMISSIONS.BOOK_AUDIT"
        v-model="auditFilter" 
        placeholder="按审核状态筛选" 
        style="width: 150px; margin-left: 10px;"
      >
        <el-option label="全部" value="" />
        <el-option label="未审核" value="unaudit" />
        <el-option label="已审核" value="audited" />
        <el-option label="已驳回" value="rejected" />
      </el-select>
      
      <!-- 分类筛选 -->
      <el-select 
        v-model="cateFilter" 
        placeholder="按分类筛选" 
        style="width: 150px; margin-left: 10px;"
      >
        <el-option label="全部" value="" />
        <el-option 
          v-for="cate in bookStore.bookCate" 
          :key="cate.id" 
          :label="cate.name" 
          :value="cate.id"
        />
      </el-select>
      
      <!-- 关键词搜索 -->
      <el-input 
        v-model="keyword" 
        placeholder="搜索书籍名称/作者" 
        style="width: 200px; margin-left: 10px;"
        prefix-icon="Search"
      />
    </div>

    <!-- 书籍列表 -->
    <div class="book-list">
      <el-card 
        v-for="book in filterBookList" 
        :key="book.id" 
        class="book-card" 
        shadow="hover"
        :data-book-id="book.id"
      >
        <!-- 书籍封面 -->
        <div class="book-cover">
          <img :src="book.cover" alt="书籍封面" />
        </div>
        
        <!-- 书籍信息 -->
        <div class="book-info">
          <h3>
            {{ book.name }}
            <el-tag :type="getStatusType(book.status)">{{ getStatusText(book.status) }}</el-tag>
            <!-- 审核状态标签（仅管理员可见） -->
            <el-tag 
              v-permission="PERMISSIONS.BOOK_AUDIT"
              :type="getAuditStatusType(book.auditStatus)" 
              style="margin-left: 5px;"
            >
              {{ getAuditStatusText(book.auditStatus) }}
            </el-tag>
          </h3>
          <p>分类：{{ book.cateName }} | 作者：{{ book.author }}</p>
          <p>出版社：{{ book.publishingHouse }}</p>
          <p>原价：¥{{ book.originalPrice }} | 售价：¥{{ book.salePrice }}</p>
          <p>成色：{{ book.statusName }} | 发布人：{{ book.publisher }}</p>
          <p class="desc" v-if="book.desc">{{ book.desc }}</p>
          
          <!-- 驳回原因（仅管理员可见） -->
          <p v-if="book.auditStatus === 'rejected' && bookStore.hasPermission(PERMISSIONS.BOOK_AUDIT)" class="reject-reason">
            驳回原因：{{ book.rejectReason }}
          </p>
        </div>
        
        <!-- 操作按钮 -->
        <div class="book-actions">
          <!-- 购买按钮（仅学生+审核通过+在售可见） -->
          <el-button 
            type="primary" 
            size="small" 
            @click="handleBuy(book)"
            v-if="book.status === 'onSale' && book.auditStatus === 'audited' && bookStore.user && bookStore.user.userType === 'student'"
            v-permission="PERMISSIONS.TRADE_CREATE"
          >
            立即购买
          </el-button>
          
          <!-- 加入购物车按钮（仅审核通过+在售可见） -->
          <el-button 
            type="success" 
            size="small" 
            @click="handleAddToCart(book)"
            v-if="book.status === 'onSale' && book.auditStatus === 'audited' && bookStore.user && bookStore.user.userType === 'student'"
            v-permission="PERMISSIONS.TRADE_CREATE"
          >
            <el-icon><ShoppingCart /></el-icon> 加入购物车
          </el-button>
          
          <!-- 二维码按钮 -->
          <el-button 
            type="info" 
            size="small" 
            @click="showQrCodeDialog = true; currentQrBook = book"
          >
            <span class="qr-emoji" aria-hidden="true">🔳</span> 书籍码
          </el-button>
          
          <!-- 下架按钮（仅书籍发布者可见） -->
          <el-button 
            type="danger" 
            size="small" 
            @click="handleOffSale(book.id)"
            v-if="book.status === 'onSale' && book.publisher === bookStore.user?.username"
          >
            下架
          </el-button>
          
          <!-- 审核按钮（仅管理员可见） -->
          <el-button 
            type="primary" 
            size="small" 
            @click="handleOpenAuditDialog(book)"
            v-permission="PERMISSIONS.BOOK_AUDIT"
          >
            审核
          </el-button>
        </div>
      </el-card>
      
      <!-- 空数据提示 -->
      <div v-if="filterBookList.length === 0" class="empty-text">
        <el-empty description="暂无二手书数据" />
      </div>
    </div>

    <!-- 1. 审核书籍弹窗 -->
    <el-dialog 
      :title="isEditingAuditBook ? '编辑书籍' : '审核书籍'" 
      v-model="showAuditDialog" 
      width="700px"
      destroy-on-close
    >
      <div v-if="currentAuditBook" class="audit-book-content">
        <div v-if="!isEditingAuditBook">
          <div class="audit-book-header">
            <div class="audit-book-cover">
              <img :src="currentAuditBook.cover" alt="书籍封面" />
            </div>
            <div class="audit-book-info">
              <h3>{{ currentAuditBook.name }}</h3>
              <p>分类：{{ currentAuditBook.cateName }} | 作者：{{ currentAuditBook.author }}</p>
              <p>出版社：{{ currentAuditBook.publishingHouse }}</p>
              <p>原价：¥{{ currentAuditBook.originalPrice }} | 售价：¥{{ currentAuditBook.salePrice }}</p>
              <p>成色：{{ currentAuditBook.statusName }} | 发布人：{{ currentAuditBook.publisher }}</p>
              <p>发布时间：{{ currentAuditBook.createdAt }}</p>
            </div>
          </div>
          
          <div class="audit-book-desc">
            <h4>书籍描述</h4>
            <p>{{ currentAuditBook.desc }}</p>
          </div>
          
          <div v-if="currentAuditBook.auditStatus === 'rejected'" class="audit-reject-reason">
            <h4>驳回原因</h4>
            <p>{{ currentAuditBook.rejectReason }}</p>
          </div>
          
          <div v-if="currentAuditBook.auditStatus === 'unaudit'" class="audit-reject-form">
            <h4>驳回原因（如果需要）</h4>
            <el-input 
              v-model="rejectForm.reason" 
              type="textarea" 
              rows="3" 
              placeholder="请输入驳回原因"
            />
          </div>
        </div>
        
        <div v-else>
          <el-form 
            :model="editAuditForm" 
            :rules="addRules" 
            ref="editAuditFormRef" 
            label-width="100px"
          >
            <el-form-item label="书籍名称" prop="name">
              <el-input v-model="editAuditForm.name" placeholder="请输入书籍名称" />
            </el-form-item>
            <el-form-item label="书籍分类" prop="cateId">
              <el-select 
                v-model="editAuditForm.cateId" 
                placeholder="请选择书籍分类"
                style="width: 100%;"
              >
                <el-option 
                  v-for="cate in bookStore.bookCate" 
                  :key="cate.id" 
                  :label="cate.name" 
                  :value="cate.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="作者" prop="author">
              <el-input v-model="editAuditForm.author" placeholder="请输入书籍作者" />
            </el-form-item>
            <el-form-item label="出版社" prop="publishingHouse">
              <el-input v-model="editAuditForm.publishingHouse" placeholder="请输入出版社" />
            </el-form-item>
            <el-form-item label="原价（元）" prop="originalPrice">
              <el-input 
                v-model.number="editAuditForm.originalPrice" 
                type="number" 
                min="1" 
                placeholder="请输入书籍原价"
              />
            </el-form-item>
            <el-form-item label="书籍成色" prop="statusId">
              <el-select 
                v-model="editAuditForm.statusId" 
                placeholder="请选择书籍成色"
                style="width: 100%;"
              >
                <el-option 
                  v-for="status in bookStore.bookStatus" 
                  :key="status.id" 
                  :label="status.name" 
                  :value="status.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="售价（元）" prop="salePrice">
              <el-input 
                v-model.number="editAuditForm.salePrice" 
                type="number" 
                min="1" 
                placeholder="请输入售价"
              />
            </el-form-item>
            <el-form-item label="书籍封面">
              <el-upload 
                action="#" 
                :auto-upload="false" 
                :on-change="handleEditCoverChange"
                list-type="picture-card"
              >
                <img v-if="editAuditForm.cover" :src="editAuditForm.cover" style="width: 100%; height: 100%;" />
                <el-icon v-else><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            <el-form-item label="书籍描述" prop="desc">
              <el-input 
                v-model="editAuditForm.desc" 
                type="textarea" 
                rows="4" 
                placeholder="请输入书籍描述（如成色、笔记情况等）"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template v-slot:footer>
        <div v-if="!isEditingAuditBook">
          <el-button @click="showAuditDialog = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleEditAuditBook"
            v-permission="PERMISSIONS.BOOK_EDIT_ALL"
          >
            编辑
          </el-button>
          <el-button 
            type="danger" 
            @click="handleAuditOffSale(currentAuditBook.id)"
            v-if="currentAuditBook && currentAuditBook.status === 'onSale'"
          >
            下架
          </el-button>
          <el-button 
            type="warning" 
            @click="handleAuditReject(currentAuditBook.id)"
            v-if="currentAuditBook && currentAuditBook.auditStatus === 'unaudit'"
          >
            驳回
          </el-button>
          <el-button 
            type="success" 
            @click="handleAuditPass(currentAuditBook.id)"
            v-if="currentAuditBook && currentAuditBook.auditStatus === 'unaudit'"
          >
            通过
          </el-button>
        </div>
        <div v-else>
          <el-button @click="handleCancelEditAuditBook">取消</el-button>
          <el-button type="primary" @click="handleSaveAuditBook">保存</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 2. 驳回书籍弹窗 -->
    <el-dialog title="驳回书籍" v-model="showRejectDialog" width="400px">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="驳回原因" prop="reason">
          <el-input 
            v-model="rejectForm.reason" 
            type="textarea" 
            rows="4" 
            placeholder="请输入驳回原因"
          />
        </el-form-item>
      </el-form>
      <template v-slot:footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="primary" @click="handleReject">确认驳回</el-button>
      </template>
    </el-dialog>

    <!-- 2. 发布二手书弹窗 -->
    <el-dialog 
      title="发布二手书" 
      v-model="showAddDialog" 
      width="600px"
      destroy-on-close
    >
      <el-form 
        :model="addForm" 
        :rules="addRules" 
        ref="addFormRef" 
        label-width="100px"
      >
        <el-form-item label="书籍名称" prop="name">
          <el-input v-model="addForm.name" placeholder="请输入书籍名称" />
        </el-form-item>
        <el-form-item label="书籍分类" prop="cateId">
          <el-select 
            v-model="addForm.cateId" 
            placeholder="请选择书籍分类"
            style="width: 100%;"
          >
            <el-option 
              v-for="cate in bookStore.bookCate" 
              :key="cate.id" 
              :label="cate.name" 
              :value="cate.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="作者" prop="author">
          <el-input v-model="addForm.author" placeholder="请输入书籍作者" />
        </el-form-item>
        <el-form-item label="出版社" prop="publishingHouse">
          <el-input v-model="addForm.publishingHouse" placeholder="请输入出版社" />
        </el-form-item>
        <el-form-item label="原价（元）" prop="originalPrice">
          <el-input 
            v-model.number="addForm.originalPrice" 
            type="number" 
            min="1" 
            placeholder="请输入书籍原价"
            @change="handleOriginalPriceChange"
          />
        </el-form-item>
        <el-form-item label="书籍成色" prop="statusId">
          <el-select 
            v-model="addForm.statusId" 
            placeholder="请选择书籍成色"
            style="width: 100%;"
          >
            <el-option 
              v-for="status in bookStore.bookStatus" 
              :key="status.id" 
              :label="status.name" 
              :value="status.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="定价参考">
          <price-calculator 
            ref="priceCalcRef" 
            :init-original-price="addForm.originalPrice"
          />
        </el-form-item>
        <el-form-item label="售价（元）" prop="salePrice">
          <el-input 
            v-model.number="addForm.salePrice" 
            type="number" 
            min="1" 
            placeholder="请输入售价"
          />
        </el-form-item>
        <el-form-item label="书籍封面">
          <el-upload 
            action="#" 
            :auto-upload="false" 
            :on-change="handleCoverChange"
            list-type="picture-card"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="书籍描述" prop="desc">
          <el-input 
            v-model="addForm.desc" 
            type="textarea" 
            rows="4" 
            placeholder="请输入书籍描述（如成色、笔记情况等）"
          />
        </el-form-item>
      </el-form>
      <template v-slot:footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddBook">确认发布</el-button>
      </template>
    </el-dialog>

    <!-- 3. 收货地址选择弹窗 -->
    <el-dialog 
      title="选择收货地址" 
      v-model="showAddressSelectDialog" 
      width="600px"
    >
      <div class="address-select">
        <!-- 地址列表 -->
        <div class="address-list">
          <el-card 
            v-for="address in addresses" 
            :key="address.id" 
            class="address-card"
            :class="{ 'selected': selectedAddress?.id === address.id }"
            shadow="hover"
            @click="selectedAddress = address"
          >
            <div class="address-content">
              <div class="address-header">
                <h4>{{ address.name }} {{ address.phone }}</h4>
              </div>
              <div class="address-detail">
                {{ address.province }}{{ address.city }}{{ address.district }}{{ address.detail }}
              </div>
              <div class="address-select-check" v-if="selectedAddress?.id === address.id">
                <el-icon class="check-icon"><Check /></el-icon>
              </div>
            </div>
          </el-card>
        </div>
        <!-- 空地址提示 -->
        <div v-if="addresses.length === 0" class="empty-address">
          <el-empty description="暂无收货地址，请先添加收货地址" />
        </div>
      </div>
      <template #footer>
        <el-button @click="showAddressSelectDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleAddressConfirm"
          :disabled="!selectedAddress"
        >
          确认选择
        </el-button>
      </template>
    </el-dialog>

    <!-- 4. 交易方式选择弹窗 -->
    <el-dialog 
      title="选择交易方式" 
      v-model="showTradeTypeDialog" 
      width="400px"
    >
      <div class="trade-type-select">
        <el-radio-group v-model="tradeType" style="width: 100%;">
          <el-radio-button label="offline" style="width: 100%; margin-bottom: 10px;">
            线下交易
          </el-radio-button>
          <el-radio-button label="online" style="width: 100%;">
            线上交易
          </el-radio-button>
        </el-radio-group>
      </div>
      <template #footer>
        <el-button @click="showTradeTypeDialog = false">取消</el-button>
        <el-button type="primary" @click="handleTradeTypeConfirm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 5. 订单确认弹窗 -->
    <el-dialog 
      title="订单确认" 
      v-model="showOrderConfirmDialog" 
      width="600px"
    >
      <!-- 收货地址信息 -->
      <div class="order-confirm">
        <div class="order-section">
          <h4>收货地址</h4>
          <div class="address-info" v-if="selectedAddress">
            <p><strong>{{ selectedAddress.name }} {{ selectedAddress.phone }}</strong></p>
            <p>{{ selectedAddress.province }}{{ selectedAddress.city }}{{ selectedAddress.district }}{{ selectedAddress.detail }}</p>
          </div>
          <div v-else class="no-address">
            <el-empty description="未选择收货地址" />
          </div>
        </div>

        <!-- 购买清单 -->
        <div class="order-section">
          <h4>购买清单</h4>
          <div class="order-items">
            <el-card 
              v-if="currentBuyBook" 
              class="order-item-card"
              shadow="hover"
            >
              <div class="order-item-info">
                <div class="order-item-cover">
                  <img :src="currentBuyBook.cover" alt="书籍封面" />
                </div>
                <div class="order-item-details">
                  <h5>{{ currentBuyBook.name }}</h5>
                  <div class="order-item-price">
                    <span class="price">¥{{ currentBuyBook.salePrice }}</span>
                    <span class="quantity">×1</span>
                    <span class="subtotal">小计：¥{{ currentBuyBook.salePrice }}</span>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 订单总计 -->
        <div class="order-section">
          <div class="order-total">
            <span class="total-label">总计：</span>
            <span class="total-value">¥{{ currentBuyBook ? currentBuyBook.salePrice : '0' }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showOrderConfirmDialog = false">取消</el-button>
        <el-button type="primary" @click="handleOrderConfirm">确认支付</el-button>
      </template>
    </el-dialog>

    <!-- 6. 线上支付方式选择弹窗 -->
    <el-dialog title="选择支付方式" v-model="showPaymentDialog" width="400px">
      <div class="payment-methods">
        <el-radio-group v-model="paymentMethod" style="width: 100%;">
          <el-radio-button label="wechat" style="width: 100%; margin-bottom: 10px;">
            <el-icon><ChatLineSquare /></el-icon> 微信支付
          </el-radio-button>
          <el-radio-button label="alipay" style="width: 100%;">
            <el-icon><CircleCheck /></el-icon> 支付宝支付
          </el-radio-button>
        </el-radio-group>
        <!-- 支付二维码/链接区域 -->
        <div v-if="paymentMethod" class="payment-qrcode">
          <img v-if="paymentQrCode" :src="paymentQrCode" alt="支付二维码" class="qr-code-image" />
          <div v-else class="qr-code-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>生成支付二维码中...</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPaymentDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmPayment">确认支付</el-button>
      </template>
    </el-dialog>

    <!-- 7. 二维码弹窗 -->
      <el-dialog title="书籍信息二维码" v-model="showQrCodeDialog" width="300px">
        <div class="qrcode-container">
          <img v-if="qrcodeDataUrl" :src="qrcodeDataUrl" alt="二维码" />
          <div v-else style="padding: 20px; color: #999">二维码生成中或无数据</div>
        </div>
      </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBookStore, PERMISSIONS } from '../pinia/store'
import PriceCalculator from '../components/PriceCalculator.vue'
import { Check, ChatLineSquare, CircleCheck, Loading } from '@element-plus/icons-vue'

const router = useRouter()
const bookStore = useBookStore()

// 轮播图数据：从store中获取
const carouselBooks = computed(() => {
  return bookStore.carouselBooks.length > 0 ? bookStore.carouselBooks : 
    bookStore.bookList
      .filter(book => book.status === 'onSale' && book.auditStatus === 'audited' && !book.publishDeleted)
      .slice(0, 5) // 最多显示5本
})
import QRCode from 'qrcode'
import { getStatusText, getStatusType, calcSalePrice } from '../utils/index'
import { ElMessage, ElMessageBox } from 'element-plus'


const addFormRef = ref(null)
const priceCalcRef = ref(null)

// 收货地址相关
const showAddressSelectDialog = ref(false)
const selectedAddress = ref(null)

// 计算属性：获取用户的收货地址
const addresses = computed(() => {
  if (!bookStore.user) return []
  return bookStore.user.addresses || []
})

// 初始化默认选中的地址
const initDefaultAddress = () => {
  // 优先选择默认地址
  const defaultAddress = addresses.value.find(addr => addr.isDefault)
  if (defaultAddress) {
    selectedAddress.value = defaultAddress
  } else if (addresses.value.length > 0) {
    // 如果没有默认地址，选择第一个地址
    selectedAddress.value = addresses.value[0]
  }
}

// 确认地址选择
const handleAddressConfirm = () => {
  if (!selectedAddress.value) {
    ElMessage.warning('请选择收货地址')
    return
  }
  
  // 显示交易方式选择弹窗
  showAddressSelectDialog.value = false
  showTradeTypeDialog.value = true
}

// 交易方式选择弹窗相关
const showTradeTypeDialog = ref(false)
const showOrderConfirmDialog = ref(false)
const showPaymentDialog = ref(false)
const tradeType = ref('offline')
const paymentMethod = ref('wechat')
const paymentQrCode = ref('')

// 处理交易方式选择确认
const handleTradeTypeConfirm = () => {
  showTradeTypeDialog.value = false
  
  // 显示订单确认弹窗
  showOrderConfirmDialog.value = true
}

// 处理订单确认
const handleOrderConfirm = () => {
  showOrderConfirmDialog.value = false
  
  if (tradeType.value === 'offline') {
    // 线下交易，直接使用收货地址创建交易记录
    try {
      if (currentBuyBook.value) {
        bookStore.createTransaction({
          bookId: currentBuyBook.value.id,
          bookName: currentBuyBook.value.name,
          buyer: bookStore.user?.username || '',
          seller: currentBuyBook.value.publisher,
          price: currentBuyBook.value.salePrice,
          quantity: 1,
          tradeType: 'offline',
          // 使用收货地址作为交易地址
          address: selectedAddress.value ? 
            `${selectedAddress.value.province}${selectedAddress.value.city}${selectedAddress.value.district}${selectedAddress.value.detail}` : '',
          phone: selectedAddress.value?.phone || '',
          // 添加收货地址信息
          shippingAddress: selectedAddress.value
        })
      }

      ElMessage.success('下单成功！请等待卖家确认')
      router.push('/dashboard/transaction')
    } catch (error) {
      ElMessage.error(error.message)
    }
  } else {
    // 线上交易，显示支付方式选择弹窗
    showPaymentDialog.value = true
    // 重置支付相关变量
    paymentMethod.value = 'wechat'
    paymentQrCode.value = ''
    // 生成初始支付二维码
    generatePaymentQrCode()
  }
}

// 生成支付二维码
const generatePaymentQrCode = () => {
  // 模拟生成支付二维码（实际项目中应调用真实的支付API）
  setTimeout(() => {
    if (paymentMethod.value === 'wechat') {
      // 微信支付二维码（使用随机图片模拟）
      paymentQrCode.value = `https://placehold.co/200x200/4A90E2/FFFFFF?text=QR`
    } else {
      // 支付宝支付二维码（使用随机图片模拟）
      paymentQrCode.value = `https://placehold.co/200x200/16777215/000000?text=QR`
    }
  }, 1000)
}

// 处理线上支付确认
const confirmPayment = () => {
  if (!paymentMethod.value) {
    ElMessage.warning('请选择支付方式！')
    return
  }

  try {
    if (currentBuyBook.value) {
      bookStore.createTransaction({
        bookId: currentBuyBook.value.id,
        bookName: currentBuyBook.value.name,
        buyer: bookStore.user?.username || '',
        seller: currentBuyBook.value.publisher,
        price: currentBuyBook.value.salePrice,
        quantity: 1,
        tradeType: 'online',
        paymentMethod: paymentMethod.value,
        // 添加收货地址信息
        shippingAddress: selectedAddress.value
      })
    }

    showPaymentDialog.value = false
    ElMessage.success('支付成功！已生成交易记录')
    router.push('/dashboard/transaction')
  } catch (error) {
    ElMessage.error(error.message)
  }
}

// 监听支付方式变化，生成对应二维码
watch(paymentMethod, () => {
  paymentQrCode.value = ''
  generatePaymentQrCode()
})

// 初始化书籍列表
onMounted(() => {
  // 移除模拟数据初始化，只使用用户上架的真实书籍
  // 书籍数据会在store初始化时从本地存储加载
})

// 筛选条件
const auditFilter = ref('')
const cateFilter = ref('')
const keyword = ref('')

// 筛选后的书籍列表
const filterBookList = computed(() => {
  return bookStore.bookList.filter(book => {
    // 过滤掉下架的书籍和已删除发布记录的书籍
    if (book.status === 'offSale' || book.publishDeleted) return false
    // 审核状态筛选（仅管理员可见）
    const auditMatch = !auditFilter.value || book.auditStatus === auditFilter.value
    // 分类筛选
    const cateMatch = !cateFilter.value || book.cateId === cateFilter.value
    // 关键词筛选
    const keywordMatch = !keyword.value || 
      book.name.includes(keyword.value) || 
      book.author.includes(keyword.value)
    return auditMatch && cateMatch && keywordMatch
  })
})

// 审核状态映射
const getAuditStatusText = (status) => {
  const map = {
    unaudit: '未审核',
    audited: '已审核',
    rejected: '已驳回'
  }
  return map[status] || '未审核'
}

const getAuditStatusType = (status) => {
  const map = {
    unaudit: 'warning',
    audited: 'success',
    rejected: 'danger'
  }
  return map[status] || 'warning'
}

// 驳回相关
const showRejectDialog = ref(false)
const currentRejectBookId = ref('')
const rejectForm = ref({
  reason: ''
})

// 审核弹窗相关
const showAuditDialog = ref(false)
const currentAuditBook = ref(null)
const isEditingAuditBook = ref(false)
const editAuditFormRef = ref(null)
const editAuditForm = ref({
  name: '',
  cateId: '',
  author: '',
  publishingHouse: '',
  originalPrice: 0,
  statusId: '',
  salePrice: 0,
  cover: '',
  desc: ''
})

// 发布弹窗相关
const showAddDialog = ref(false)
const addForm = ref({
  name: '',
  cateId: '',
  author: '',
  publishingHouse: '',
  originalPrice: 0,
  statusId: '',
  salePrice: 0,
  cover: '',
  desc: ''
})

// 发布表单校验规则
const addRules = ref({
  name: [{ required: true, message: '请输入书籍名称', trigger: 'blur' }],
  cateId: [{ required: true, message: '请选择书籍分类', trigger: 'change' }],
  author: [{ required: true, message: '请输入书籍作者', trigger: 'blur' }],
  originalPrice: [{ required: true, message: '请输入书籍原价', trigger: 'blur' }],
  statusId: [{ required: true, message: '请选择书籍成色', trigger: 'change' }],
  salePrice: [{ required: true, message: '请输入售价', trigger: 'blur' }],
  desc: [{ required: true, message: '请输入书籍描述', trigger: 'blur' }]
})

// 当前购买书籍
const currentBuyBook = ref(null)

// 二维码弹窗相关
const showQrCodeDialog = ref(false)
const currentQrBook = ref(null)
const qrcodeDataUrl = ref('')

// 修复：原价变化处理（空值保护）
const handleOriginalPriceChange = () => {
  // 先判断组件是否挂载，避免null调用
  if (priceCalcRef.value) {
    setTimeout(() => {
      priceCalcRef.value.calcSalePrice()
    }, 0)
  }
}

// 监听发布弹窗显示，初始化定价计算
watch(showAddDialog, (isShow) => {
  if (isShow && priceCalcRef.value) {
    setTimeout(() => {
      priceCalcRef.value.form.originalPrice = addForm.value.originalPrice
      priceCalcRef.value.calcSalePrice()
    }, 100)
  }
})

// 打开审核弹窗
const handleOpenAuditDialog = (book) => {
  currentAuditBook.value = book
  rejectForm.value.reason = ''
  isEditingAuditBook.value = false
  showAuditDialog.value = true
}

// 编辑审核书籍
const handleEditAuditBook = () => {
  if (!currentAuditBook.value) return
  
  // 初始化编辑表单
  editAuditForm.value = {
    name: currentAuditBook.value.name,
    cateId: currentAuditBook.value.cateId,
    author: currentAuditBook.value.author,
    publishingHouse: currentAuditBook.value.publishingHouse,
    originalPrice: currentAuditBook.value.originalPrice,
    statusId: currentAuditBook.value.statusId,
    salePrice: currentAuditBook.value.salePrice,
    cover: currentAuditBook.value.cover,
    desc: currentAuditBook.value.desc
  }
  
  isEditingAuditBook.value = true
}

// 取消编辑审核书籍
const handleCancelEditAuditBook = () => {
  isEditingAuditBook.value = false
  editAuditForm.value = {
    name: '',
    cateId: '',
    author: '',
    publishingHouse: '',
    originalPrice: 0,
    statusId: '',
    salePrice: 0,
    cover: '',
    desc: ''
  }
}

// 保存编辑的审核书籍
const handleSaveAuditBook = async () => {
  try {
    // 表单校验
    const valid = await new Promise((resolve) => {
      editAuditFormRef.value.validate((isValid) => resolve(isValid))
    })

    if (!valid) return

    // 更新书籍信息
    bookStore.updateBookInfo(currentAuditBook.value.id, editAuditForm.value)
    
    ElMessage.success('书籍信息更新成功！')
    
    // 更新当前书籍信息
    currentAuditBook.value = {
      ...currentAuditBook.value,
      ...editAuditForm.value
    }
    
    // 退出编辑模式
    isEditingAuditBook.value = false
    
    // 重置编辑表单
    editAuditForm.value = {
      name: '',
      cateId: '',
      author: '',
      publishingHouse: '',
      originalPrice: 0,
      statusId: '',
      salePrice: 0,
      cover: '',
      desc: ''
    }
  } catch (error) {
    ElMessage.error(error.message || '更新失败，请重试')
  }
}

// 处理编辑封面上传
const handleEditCoverChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    editAuditForm.value.cover = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

// 审核通过
const handleAuditPass = (id) => {
  bookStore.auditBook(id, 'audited')
  ElMessage.success('书籍审核通过！')
  showAuditDialog.value = false
  currentAuditBook.value = null
}

// 处理审核弹窗中的驳回
const handleAuditReject = (id) => {
  if (!rejectForm.value.reason) {
    ElMessage.warning('请输入驳回原因！')
    return
  }
  bookStore.auditBook(id, 'rejected', rejectForm.value.reason)
  ElMessage.info('书籍已驳回并下架！')
  showAuditDialog.value = false
  currentAuditBook.value = null
  rejectForm.value.reason = ''
}

// 处理审核弹窗中的下架
const handleAuditOffSale = (id) => {
  ElMessageBox.confirm(
    '确认下架该书籍？',
    '提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    bookStore.updateBookStatus(id, 'offSale')
    ElMessage.success('书籍已下架！')
    showAuditDialog.value = false
    currentAuditBook.value = null
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

// 驳回书籍
const handleReject = () => {
  if (!rejectForm.value.reason) {
    ElMessage.warning('请输入驳回原因！')
    return
  }
  bookStore.auditBook(currentRejectBookId.value, 'rejected', rejectForm.value.reason)
  showRejectDialog.value = false
  ElMessage.info('书籍已驳回并下架！')
  rejectForm.value.reason = ''
}

// 下架书籍
const handleOffSale = (id) => {
  ElMessageBox.confirm(
    '确认下架该书籍？',
    '提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    bookStore.updateBookStatus(id, 'offSale')
    ElMessage.success('书籍已下架！')
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

// 上传封面
const handleCoverChange = (file) => {
  // 读取文件并转换为DataURL
  const reader = new FileReader()
  reader.onload = (e) => {
    addForm.value.cover = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

// 监听二维码弹窗或当前二维码书籍，生成 dataURL
watch([showQrCodeDialog, currentQrBook], async ([show, book]) => {
  if (show && book) {
    try {
      const payload = JSON.stringify({
        id: book.id,
        name: book.name,
        cate: book.cateName,
        price: book.salePrice,
        publisher: book.publisher
      })
      qrcodeDataUrl.value = await QRCode.toDataURL(payload, { width: 200, margin: 1 })
    } catch (e) {
      console.error('二维码生成失败', e)
      qrcodeDataUrl.value = ''
    }
  } else {
    qrcodeDataUrl.value = ''
  }
})

// 发布书籍
const handleAddBook = () => {
  addFormRef.value.validate((valid) => {
    if (valid) {
      // 补充分类和状态名称
      const cate = bookStore.bookCate.find(item => item.id === addForm.value.cateId)
      const status = bookStore.bookStatus.find(item => item.id === addForm.value.statusId)
      
      bookStore.publishBook({
        ...addForm.value,
        cateName: cate?.name || '',
        statusName: status?.name || '',
        cover: addForm.value.cover || 'https://placehold.co/200x280/4A90E2/FFFFFF?text=Book'
      })
      
      showAddDialog.value = false
      ElMessage.success('发布二手书成功！请等待管理员审核')
      
      // 重置表单
      addForm.value = {
        name: '',
        cateId: '',
        author: '',
        originalPrice: 0,
        statusId: '',
        salePrice: 0,
        cover: '',
        desc: ''
      }
    }
  })
}

// 处理购买
const handleBuy = (book) => {
  currentBuyBook.value = book
  
  // 检查用户是否有收货地址
  if (addresses.value.length === 0) {
    ElMessage.warning('请先添加收货地址')
    return
  }
  
  // 初始化默认地址
  initDefaultAddress()
  
  // 显示收货地址选择弹窗
  showAddressSelectDialog.value = true
}

// 加入购物车
const handleAddToCart = (book) => {
  try {
    bookStore.addToCart(book.id)
    ElMessage.success('已加入购物车')
  } catch (error) {
    ElMessage.error(error.message)
  }
}

// 处理轮播图点击
const handleCarouselClick = (bookId) => {
  // 查找对应的书籍卡片
  const bookCard = document.querySelector(`[data-book-id="${bookId}"]`)
  if (bookCard) {
    // 平滑滚动到书籍卡片
    bookCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // 添加高亮效果
    bookCard.style.transition = 'box-shadow 0.3s ease'
    bookCard.style.boxShadow = '0 0 20px rgba(64, 158, 255, 0.6)'
    // 2秒后移除高亮效果
    setTimeout(() => {
      bookCard.style.boxShadow = ''
    }, 2000)
  } else {
    ElMessage.warning('未找到对应的书籍卡片')
  }
}
</script>

<style scoped>
/* 页面容器 */
.book-manage {
  padding: 0;
}

/* 操作栏 */
.operate-bar {
  margin: 15px 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

/* 书籍列表 */
.book-list {
  margin-top: 20px;
  min-height: 600px;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: flex-start;
}

/* 空数据提示 */
.empty-text {
  text-align: center;
  padding: 50px;
  color: #999;
  width: 100%;
}

/* 书籍卡片 */
.book-card {
  width: 320px;
  margin: 0;
  display: flex;
  flex-direction: column;
}

/* 书籍封面 */
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

/* 书籍信息 */
.book-info {
  margin-bottom: 15px;
  flex: 1;
}
.book-info h3 {
  font-size: 16px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
}
.book-info p {
  font-size: 14px;
  color: #666;
  margin: 4px 0;
}
.book-info .desc {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.book-info .reject-reason {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 5px;
  background: #fef0f0;
  padding: 5px;
  border-radius: 4px;
}

/* 操作按钮 */
.book-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: auto;
}

/* 二维码容器 */
.qrcode-container {
  text-align: center;
  padding: 10px;
  display: flex;
  justify-content: center;
}

/* 轮播图样式 */
.carousel-container {
  margin-bottom: 30px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.carousel-item {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: #f5f7fa;
  height: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.carousel-item:hover {
  background-color: #e8f0fe;
  transform: translateY(-2px);
}

.carousel-item .book-cover {
  width: 150px;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.carousel-item .book-info {
  flex: 1;
  color: #333;
}

.carousel-item .book-info h3 {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #2c3e50;
}

.carousel-item .book-author {
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
}

.carousel-item .book-price {
  margin-bottom: 15px;
}

.carousel-item .original-price {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
  margin-right: 10px;
}

.carousel-item .sale-price {
  font-size: 24px;
  font-weight: bold;
  color: #ff4d4f;
}

.carousel-item .book-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

/* 审核弹窗样式 */
.audit-book-content {
  padding: 10px 0;
}

.audit-book-header {
  display: flex;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.audit-book-cover {
  width: 150px;
  height: 210px;
  overflow: hidden;
  margin-right: 20px;
  flex-shrink: 0;
}

.audit-book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.audit-book-info {
  flex: 1;
}

.audit-book-info h3 {
  margin: 0 0 15px 0;
  font-size: 20px;
  font-weight: 600;
}

.audit-book-info p {
  margin: 8px 0;
  font-size: 14px;
  color: #666;
}

.audit-book-desc {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.audit-book-desc h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.audit-book-desc p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #666;
  white-space: pre-wrap;
}

.audit-reject-reason {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fef0f0;
  border-radius: 4px;
}

.audit-reject-reason h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 600;
  color: #f56c6c;
}

.audit-reject-reason p {
  margin: 0;
  font-size: 14px;
  color: #f56c6c;
}

.audit-reject-form {
  margin-top: 20px;
}

.audit-reject-form h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

/* 收货地址选择弹窗样式 */
.address-select {
  max-height: 400px;
  overflow-y: auto;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.address-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.address-card.selected {
  border: 2px solid #409eff;
  background-color: #ecf5ff;
}

.address-content {
  position: relative;
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.address-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.address-detail {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.address-select-check {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  color: #409eff;
}

.check-icon {
  font-size: 20px;
}

.empty-address {
  text-align: center;
  padding: 40px 0;
}

/* 订单确认弹窗样式 */
.order-confirm {
  padding: 10px 0;
}

.order-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.order-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.order-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.address-info p {
  margin: 5px 0;
  font-size: 14px;
  color: #606266;
}

.no-address {
  text-align: center;
  padding: 20px 0;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.order-item-card {
  margin: 0;
}

.order-item-info {
  display: flex;
  align-items: flex-start;
}

.order-item-cover {
  width: 80px;
  height: 100px;
  overflow: hidden;
  margin-right: 15px;
  border-radius: 4px;
  flex-shrink: 0;
}

.order-item-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.order-item-details {
  flex: 1;
}

.order-item-details h5 {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.order-item-price {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 14px;
}

.order-item-price .price {
  color: #f56c6c;
  font-weight: 600;
  font-size: 16px;
}

.order-item-price .quantity {
  color: #909399;
}

.order-item-price .subtotal {
  color: #606266;
}

.order-total {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  font-size: 18px;
}

.order-total .total-label {
  color: #606266;
  margin-right: 10px;
}

.order-total .total-value {
  color: #f56c6c;
  font-weight: 600;
  font-size: 24px;
}

/* 支付方式选择弹窗样式 */
.payment-methods {
  padding: 10px 0;
}

.payment-qrcode {
  margin-top: 20px;
  text-align: center;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.qr-code-image {
  width: 200px;
  height: 200px;
  object-fit: contain;
}

.qr-code-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #909399;
}

.qr-code-loading .el-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .book-card {
    width: 100%;
  }
  .operate-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  .operate-bar el-select, .operate-bar el-input {
    width: 100% !important;
    margin-left: 0 !important;
  }
  .carousel-item {
    flex-direction: column;
    text-align: center;
  }
  .carousel-item .book-cover {
    margin-right: 0;
    margin-bottom: 15px;
  }
}
</style>