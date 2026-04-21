<template>
  <div class="cart">
    <!-- 页面头部 -->
    <div class="cart-header">
      <el-page-header 
        content="购物车"
        @back="router.back()"
      />
      <el-button 
        type="primary" 
        @click="showAddressDialog = true"
        class="address-btn"
      >
        <el-icon><Location /></el-icon> 收货地址管理
      </el-button>
    </div>

    <!-- 购物车内容 -->
    <div class="cart-content">
      <!-- 购物车为空时的提示 -->
      <div v-if="bookStore.cartItems.length === 0" class="cart-empty">
        <el-empty description="购物车还是空的，去看看有什么想买的吧" />
        <el-button type="primary" @click="router.push('/dashboard/book-manage')" style="margin-top: 20px;">
          去逛逛
        </el-button>
      </div>

      <!-- 购物车有商品时的内容 -->
      <div v-else>
        <!-- 商品列表 -->
        <div class="cart-items">
          <el-card 
            v-for="item in bookStore.cartItems" 
            :key="item.bookId" 
            class="cart-item-card"
            shadow="hover"
          >
            <!-- 商品信息 -->
            <div class="cart-item-info">
              <!-- 商品封面 -->
              <div class="cart-item-cover">
                <img :src="getBook(item.bookId) ? getBook(item.bookId).cover : ''" alt="书籍封面" />
              </div>
              
              <!-- 商品详情 -->
              <div class="cart-item-details">
                <h3>{{ getBook(item.bookId) ? getBook(item.bookId).name : '' }}</h3>
                <p>分类：{{ getBook(item.bookId) ? getBook(item.bookId).cateName : '' }}</p>
                <p>作者：{{ getBook(item.bookId) ? getBook(item.bookId).author : '' }}</p>
                <p>成色：{{ getBook(item.bookId) ? getBook(item.bookId).statusName : '' }}</p>
                <p>发布人：{{ getBook(item.bookId) ? getBook(item.bookId).publisher : '' }}</p>
              </div>
            </div>

            <!-- 商品操作 -->
            <div class="cart-item-actions">
              <!-- 价格 -->
              <div class="cart-item-price">
                <span class="price-label">单价：</span>
                <span class="price-value">¥{{ getBook(item.bookId) ? getBook(item.bookId).salePrice : '0' }}</span>
              </div>
              
              <!-- 数量调整 -->
              <div class="cart-item-quantity">
                <el-input-number 
                  v-model="item.quantity" 
                  :min="1" 
                  @change="handleQuantityChange(item.bookId, item.quantity)"
                  size="small"
                />
              </div>
              
              <!-- 小计 -->
              <div class="cart-item-subtotal">
                <span class="subtotal-label">小计：</span>
                <span class="subtotal-value">¥{{ getBook(item.bookId) ? (getBook(item.bookId).salePrice * item.quantity).toFixed(2) : '0.00' }}</span>
              </div>
              
              <!-- 移除按钮 -->
              <div class="cart-item-remove">
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="handleRemove(item.bookId)"
                >
                  <el-icon><Delete /></el-icon> 移除
                </el-button>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 购物车底部操作栏 -->
        <div class="cart-footer">
          <!-- 清空购物车 -->
          <div class="cart-clear">
            <el-button 
              type="warning" 
              @click="handleClearCart"
            >
              <el-icon><Delete /></el-icon> 清空购物车
            </el-button>
          </div>

          <!-- 结算信息 -->
          <div class="cart-checkout">
            <div class="cart-total">
              <span class="total-label">共 {{ bookStore.cartItemCount }} 件商品，合计：</span>
              <span class="total-value">¥{{ bookStore.cartTotalPrice.toFixed(2) }}</span>
            </div>
            
            <div class="cart-checkout-btn">
              <el-button 
                type="primary" 
                size="large" 
                @click="handleCheckout"
                :disabled="bookStore.cartItems.length === 0"
              >
                <el-icon><ShoppingCart /></el-icon> 结算
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 订单确认弹窗 -->
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
              v-for="item in bookStore.cartItems" 
              :key="item.bookId" 
              class="order-item-card"
              shadow="hover"
            >
              <div class="order-item-info">
                <div class="order-item-cover">
                  <img :src="getBook(item.bookId) ? getBook(item.bookId).cover : ''" alt="书籍封面" />
                </div>
                <div class="order-item-details">
                  <h5>{{ getBook(item.bookId) ? getBook(item.bookId).name : '' }}</h5>
                  <div class="order-item-price">
                    <span class="price">¥{{ getBook(item.bookId) ? getBook(item.bookId).salePrice : '0' }}</span>
                    <span class="quantity">×{{ item.quantity }}</span>
                    <span class="subtotal">小计：¥{{ getBook(item.bookId) ? (getBook(item.bookId).salePrice * item.quantity).toFixed(2) : '0.00' }}</span>
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
            <span class="total-value">¥{{ bookStore.cartTotalPrice.toFixed(2) }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showOrderConfirmDialog = false">取消</el-button>
        <el-button type="primary" @click="handleOrderConfirm">确认支付</el-button>
      </template>
    </el-dialog>

    <!-- 交易方式选择弹窗 -->
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

    <!-- 线下交易详情弹窗 -->
    <el-dialog title="确认购买" v-model="showBuyDialog" width="400px">
      <el-form :model="buyForm" label-width="80px">
        <el-form-item label="购买人" prop="buyer">
          <el-input v-model="buyForm.buyer" placeholder="请输入你的姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="buyForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="交易地点" prop="address">
          <el-input v-model="buyForm.address" placeholder="请输入交易地点（如XX教学楼）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBuyDialog = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmBuy">确认购买</el-button>
      </template>
    </el-dialog>

    <!-- 线上支付方式选择弹窗 -->
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

    <!-- 收货地址管理弹窗 -->
    <el-dialog 
      title="收货地址管理" 
      v-model="showAddressDialog" 
      width="600px"
    >
      <div class="address-manage">
        <!-- 地址列表 -->
        <div class="address-list" v-if="addresses.length > 0">
          <el-card 
            v-for="(address, index) in addresses" 
            :key="address.id" 
            class="address-card"
            shadow="hover"
          >
            <div class="address-content">
              <div class="address-header">
                <h4>{{ address.name }} {{ address.phone }}</h4>
                <div class="address-actions">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="editAddress(address)"
                    style="margin-right: 8px;"
                  >
                    编辑
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="deleteAddress(address.id)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
              <div class="address-detail">
                {{ address.province }}{{ address.city }}{{ address.district }}{{ address.detail }}
              </div>
              <div class="address-default" v-if="address.isDefault">
                <el-tag size="small" type="success">默认地址</el-tag>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 空地址提示 -->
        <div v-else class="empty-address">
          <el-empty description="暂无收货地址，点击下方按钮添加" />
        </div>

        <!-- 添加地址按钮 -->
        <div class="add-address-btn" v-if="addresses.length < 5">
          <el-button 
            type="primary" 
            @click="addAddress"
            class="full-width-btn"
          >
            <el-icon><Plus /></el-icon> 添加收货地址
          </el-button>
        </div>
        <div class="address-limit" v-else>
          <el-alert
            title="已达到最大地址数量限制（5个）"
            type="warning"
            :closable="false"
            show-icon
          />
        </div>
      </div>
    </el-dialog>

    <!-- 编辑/添加地址弹窗 -->
    <el-dialog 
      :title="editingAddress ? '编辑收货地址' : '添加收货地址'" 
      v-model="showEditAddressDialog" 
      width="500px"
    >
      <el-form :model="addressForm" :rules="addressRules" ref="addressFormRef" label-width="80px">
        <el-form-item label="收货人" prop="name">
          <el-input v-model="addressForm.name" placeholder="请输入收货人姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="addressForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="省份" prop="province">
          <el-input v-model="addressForm.province" placeholder="请输入省份" />
        </el-form-item>
        <el-form-item label="城市" prop="city">
          <el-input v-model="addressForm.city" placeholder="请输入城市" />
        </el-form-item>
        <el-form-item label="区县" prop="district">
          <el-input v-model="addressForm.district" placeholder="请输入区县" />
        </el-form-item>
        <el-form-item label="详细地址" prop="detail">
          <el-input 
            v-model="addressForm.detail" 
            placeholder="请输入详细地址" 
            type="textarea" 
            rows="3"
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="addressForm.isDefault">设为默认地址</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditAddressDialog = false">取消</el-button>
        <el-button type="primary" @click="saveAddress">保存</el-button>
      </template>
    </el-dialog>

    <!-- 收货地址选择弹窗 -->
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
                <div class="address-actions">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click.stop="editAddress(address)"
                    style="margin-right: 8px;"
                  >
                    编辑
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click.stop="deleteAddress(address.id)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
              <div class="address-detail">
                {{ address.province }}{{ address.city }}{{ address.district }}{{ address.detail }}
              </div>
              <div class="address-default" v-if="address.isDefault">
                <el-tag size="small" type="success">默认地址</el-tag>
              </div>
              <div class="address-select-check" v-if="selectedAddress?.id === address.id">
                <el-icon class="check-icon"><Check /></el-icon>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 添加地址按钮 -->
        <div class="add-address-btn" v-if="addresses.length < 5">
          <el-button 
            type="primary" 
            @click="addAddress"
            class="full-width-btn"
          >
            <el-icon><Plus /></el-icon> 添加收货地址
          </el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="showAddressSelectDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmAddress"
          :disabled="!selectedAddress"
        >
          确认选择
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, watch, computed } from 'vue'
import { useBookStore } from '../pinia/store'
import { Delete, ShoppingCart, ChatLineSquare, CircleCheck, Loading, Location, Plus, Check } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const bookStore = useBookStore()

// 交易方式选择弹窗相关
const showTradeTypeDialog = ref(false)
const showOrderConfirmDialog = ref(false)
const showBuyDialog = ref(false)
const showPaymentDialog = ref(false)
const tradeType = ref('offline')
const paymentMethod = ref('wechat')
const paymentQrCode = ref('')
const buyForm = ref({
  buyer: '',
  phone: '',
  address: ''
})

// 收货地址相关
const showAddressDialog = ref(false)
const showEditAddressDialog = ref(false)
const showAddressSelectDialog = ref(false)
const editingAddress = ref(null)
const addressFormRef = ref(null)
const selectedAddress = ref(null)
const addressForm = ref({
  id: '',
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false
})

const addressRules = ref({
  name: [{ required: true, message: '请输入收货人姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  province: [{ required: true, message: '请输入省份', trigger: 'blur' }],
  city: [{ required: true, message: '请输入城市', trigger: 'blur' }],
  district: [{ required: true, message: '请输入区县', trigger: 'blur' }],
  detail: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
})

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
const confirmAddress = () => {
  if (!selectedAddress.value) {
    ElMessage.warning('请选择收货地址')
    return
  }
  
  // 显示交易方式选择弹窗
  showAddressSelectDialog.value = false
  showTradeTypeDialog.value = true
}

// 添加收货地址
const addAddress = () => {
  editingAddress.value = null
  addressForm.value = {
    id: '',
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    isDefault: addresses.value.length === 0 // 第一个地址默认设为默认地址
  }
  showEditAddressDialog.value = true
}

// 编辑收货地址
const editAddress = (address) => {
  editingAddress.value = address
  addressForm.value = { ...address }
  showEditAddressDialog.value = true
}

// 保存收货地址
const saveAddress = async () => {
  try {
    // 表单校验
    const valid = await new Promise((resolve) => {
      addressFormRef.value.validate((isValid) => resolve(isValid))
    })

    if (!valid) return

    // 获取当前用户
    const username = bookStore.user?.username
    if (!username) {
      ElMessage.error('用户信息异常')
      return
    }

    // 获取用户列表
    const existingUsers = JSON.parse(localStorage.getItem('campus_book_users') || '[]')
    const userIndex = existingUsers.findIndex(user => user.username === username)

    if (userIndex === -1) {
      ElMessage.error('用户不存在')
      return
    }

    const currentUser = existingUsers[userIndex]
    // 确保地址数组存在
    if (!currentUser.addresses) {
      currentUser.addresses = []
    }

    if (editingAddress.value) {
      // 编辑现有地址
      const addressIndex = currentUser.addresses.findIndex(addr => addr.id === editingAddress.value.id)
      if (addressIndex !== -1) {
        currentUser.addresses[addressIndex] = {
          ...addressForm.value,
          id: editingAddress.value.id
        }
      }
    } else {
      // 添加新地址
      if (currentUser.addresses.length >= 5) {
        ElMessage.warning('已达到最大地址数量限制（5个）')
        return
      }
      
      const newAddress = {
        ...addressForm.value,
        id: Date.now().toString()
      }
      currentUser.addresses.push(newAddress)
    }

    // 如果设置为默认地址，将其他地址设为非默认
    if (addressForm.value.isDefault) {
      currentUser.addresses.forEach(addr => {
        if (addr.id !== addressForm.value.id) {
          addr.isDefault = false
        }
      })
    }

    // 更新用户信息
    existingUsers[userIndex] = currentUser
    localStorage.setItem('campus_book_users', JSON.stringify(existingUsers))
    
    // 更新store中的用户信息
    bookStore.user = currentUser
    localStorage.setItem('campus_book_user', JSON.stringify(currentUser))

    ElMessage.success('地址保存成功')
    showEditAddressDialog.value = false
  } catch (err) {
    console.error('保存地址异常：', err)
    ElMessage.error(err.message || '保存地址失败，请重试')
  }
}

// 删除收货地址
const deleteAddress = (addressId) => {
  ElMessageBox.confirm('确定要删除此收货地址吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    try {
      // 获取当前用户
      const username = bookStore.user?.username
      if (!username) {
        ElMessage.error('用户信息异常')
        return
      }

      // 获取用户列表
      const existingUsers = JSON.parse(localStorage.getItem('campus_book_users') || '[]')
      const userIndex = existingUsers.findIndex(user => user.username === username)

      if (userIndex === -1) {
        ElMessage.error('用户不存在')
        return
      }

      const currentUser = existingUsers[userIndex]
      if (!currentUser.addresses) {
        currentUser.addresses = []
      }

      // 删除地址
      currentUser.addresses = currentUser.addresses.filter(addr => addr.id !== addressId)

      // 更新用户信息
      existingUsers[userIndex] = currentUser
      localStorage.setItem('campus_book_users', JSON.stringify(existingUsers))
      
      // 更新store中的用户信息
      bookStore.user = currentUser
      localStorage.setItem('campus_book_user', JSON.stringify(currentUser))

      ElMessage.success('地址删除成功')
    } catch (err) {
      console.error('删除地址异常：', err)
      ElMessage.error(err.message || '删除地址失败，请重试')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 监听支付方式变化，生成对应二维码
watch(paymentMethod, () => {
  paymentQrCode.value = ''
  generatePaymentQrCode()
})

// 获取书籍信息
const getBook = (bookId) => {
  return bookStore.bookList.find(book => book.id === bookId)
}

// 获取书籍状态文本
const getBookStatusText = (status) => {
  const statusMap = {
    onSale: '在售',
    sold: '已售出',
    offSale: '已下架'
  }
  return statusMap[status] || status
}

// 更新商品数量
const handleQuantityChange = (bookId, quantity) => {
  try {
    bookStore.updateCartItemQuantity(bookId, quantity)
  } catch (error) {
    ElMessage.error(error.message)
  }
}

// 移除商品
const handleRemove = (bookId) => {
  try {
    bookStore.removeFromCart(bookId)
    ElMessage.success('商品已从购物车移除')
  } catch (error) {
    ElMessage.error(error.message)
  }
}

// 清空购物车
const handleClearCart = () => {
  ElMessage.confirm('确定要清空购物车吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    try {
      bookStore.clearCart()
      ElMessage.success('购物车已清空')
    } catch (error) {
      ElMessage.error(error.message)
    }
  }).catch(() => {
    // 取消操作
  })
}

// 结算购物车
const handleCheckout = () => {
  // 检查用户是否有收货地址
  if (addresses.value.length === 0) {
    ElMessage.warning('请先添加收货地址')
    showAddressDialog.value = true
    return
  }
  
  // 初始化默认地址
  initDefaultAddress()
  
  // 显示收货地址选择弹窗
  showAddressSelectDialog.value = true
}

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
      // 为购物车中的每个商品创建交易记录
      bookStore.cartItems.forEach(item => {
        const book = getBook(item.bookId)
        if (book) {
          bookStore.createTransaction({
            bookId: book.id,
            bookName: book.name,
            buyer: bookStore.user?.username || '',
            seller: book.publisher,
            price: book.salePrice,
            quantity: item.quantity,
            tradeType: 'offline',
            // 使用收货地址作为交易地址
            address: selectedAddress.value ? 
              `${selectedAddress.value.province}${selectedAddress.value.city}${selectedAddress.value.district}${selectedAddress.value.detail}` : '',
            phone: selectedAddress.value?.phone || '',
            // 添加收货地址信息
            shippingAddress: selectedAddress.value
          })
        }
      })

      // 清空购物车
      bookStore.clearCart()

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
    // 为购物车中的每个商品创建交易记录
    bookStore.cartItems.forEach(item => {
      const book = getBook(item.bookId)
      if (book) {
        bookStore.createTransaction({
          bookId: book.id,
          bookName: book.name,
          buyer: bookStore.user?.username || '',
          seller: book.publisher,
          price: book.salePrice,
          quantity: item.quantity,
          tradeType: 'online',
          paymentMethod: paymentMethod.value,
          // 添加收货地址信息
          shippingAddress: selectedAddress.value
        })
      }
    })

    // 清空购物车
    bookStore.clearCart()

    showPaymentDialog.value = false
    ElMessage.success('支付成功！已生成交易记录')
    router.push('/dashboard/transaction')
  } catch (error) {
    ElMessage.error(error.message)
  }
}

// 处理线下交易确认购买
const handleConfirmBuy = () => {
  if (!buyForm.value.buyer || !buyForm.value.phone || !buyForm.value.address) {
    ElMessage.warning('请填写完整购买信息！')
    return
  }

  try {
    // 为购物车中的每个商品创建交易记录
    bookStore.cartItems.forEach(item => {
      const book = getBook(item.bookId)
      if (book) {
        bookStore.createTransaction({
          bookId: book.id,
          bookName: book.name,
          buyer: buyForm.value.buyer,
          seller: book.publisher,
          price: book.salePrice,
          quantity: item.quantity,
          address: buyForm.value.address,
          phone: buyForm.value.phone,
          // 添加收货地址信息
          shippingAddress: selectedAddress.value
        })
      }
    })

    // 清空购物车
    bookStore.clearCart()

    showBuyDialog.value = false
    ElMessage.success('下单成功！请等待卖家确认')
    router.push('/dashboard/transaction')
  } catch (error) {
    ElMessage.error(error.message)
  }
}
</script>

<style scoped>
.cart {
  padding: 20px;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.address-btn {
  margin-left: auto;
}

.cart-content {
  margin-top: 20px;
}

.cart-empty {
  text-align: center;
  padding: 60px 0;
}

.cart-items {
  margin-bottom: 20px;
}

.cart-item-card {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
}

.cart-item-info {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
}

.cart-item-cover {
  width: 120px;
  height: 160px;
  overflow: hidden;
  margin-right: 20px;
  border-radius: 4px;
}

.cart-item-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-item-details h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.cart-item-details p {
  margin: 5px 0;
  color: #666;
  font-size: 14px;
}

.cart-item-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.cart-item-price {
  display: flex;
  align-items: center;
}

.cart-item-price .price-label {
  color: #666;
  margin-right: 5px;
}

.cart-item-price .price-value {
  color: #f56c6c;
  font-size: 16px;
  font-weight: 600;
}

.cart-item-quantity {
  margin: 0 20px;
}

.cart-item-subtotal {
  display: flex;
  align-items: center;
  margin-right: 20px;
}

.cart-item-subtotal .subtotal-label {
  color: #666;
  margin-right: 5px;
}

.cart-item-subtotal .subtotal-value {
  color: #f56c6c;
  font-size: 16px;
  font-weight: 600;
}

.cart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #fafafa;
  border-radius: 4px;
  border: 1px solid #eee;
}

.cart-checkout {
  display: flex;
  align-items: center;
}

.cart-total {
  margin-right: 30px;
  display: flex;
  align-items: center;
}

.cart-total .total-label {
  font-size: 16px;
  color: #333;
  margin-right: 10px;
}

.cart-total .total-value {
  font-size: 20px;
  font-weight: 600;
  color: #f56c6c;
}

/* 订单确认弹窗样式 */
.order-confirm {
  padding: 10px 0;
}

.order-section {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.order-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.address-info {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.address-info p {
  margin: 5px 0;
  line-height: 1.4;
}

.no-address {
  padding: 30px 0;
}

.order-items {
  margin-top: 10px;
}

.order-item-card {
  margin-bottom: 10px;
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
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.order-item-price {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
}

.order-item-price .price {
  color: #666;
}

.order-item-price .quantity {
  color: #999;
}

.order-item-price .subtotal {
  color: #f56c6c;
  font-weight: 600;
  margin-left: auto;
}

.order-total {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-top: 10px;
}

.order-total .total-label {
  font-size: 16px;
  color: #333;
  margin-right: 10px;
}

.order-total .total-value {
  font-size: 18px;
  font-weight: 600;
  color: #f56c6c;
}

/* 支付方式选择弹窗样式 */
.payment-methods {
  margin-top: 20px;
}

.payment-qrcode {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
}

.qr-code-image {
  width: 200px;
  height: 200px;
  object-fit: contain;
  border: 1px solid #eee;
  border-radius: 4px;
}

.qr-code-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #666;
}

.qr-code-loading .is-loading {
  font-size: 32px;
  margin-bottom: 10px;
  color: #409eff;
}

/* 收货地址管理样式 */
.address-manage {
  padding: 10px 0;
}

.address-list {
  margin-bottom: 20px;
}

.address-card {
  margin-bottom: 15px;
}

.address-content {
  padding: 10px 0;
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.address-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.address-actions {
  display: flex;
  gap: 8px;
}

.address-detail {
  margin-bottom: 10px;
  color: #666;
  line-height: 1.4;
}

.address-default {
  margin-top: 10px;
}

.empty-address {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 0;
  background-color: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.add-address-btn {
  margin-top: 20px;
}

.full-width-btn {
  width: 100%;
}

.address-limit {
  margin-top: 20px;
}

/* 地址选择弹窗样式 */
.address-select {
  padding: 10px 0;
}

.address-card.selected {
  border: 2px solid #409eff;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.3);
}

.address-select-check {
  position: absolute;
  top: 10px;
  right: 10px;
  color: #409eff;
  font-size: 20px;
}

.check-icon {
  font-weight: bold;
}
</style>