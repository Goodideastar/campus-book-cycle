import { defineStore } from 'pinia'

// 密码加密工具函数
const hashPassword = (password) => {
  // 使用简单的哈希算法，生产环境建议使用更安全的加密方式
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  return hash.toString(16)
}

// 验证密码
const verifyPassword = (password, hashedPassword) => {
  return hashPassword(password) === hashedPassword
}

// 1. 定义所有权限码（细粒度）
export const PERMISSIONS = {
  // 书籍管理
  BOOK_PUBLISH: 'book:publish',    // 发布书籍
  BOOK_EDIT_OWN: 'book:edit:own',  // 编辑自己的书籍
  BOOK_EDIT_ALL: 'book:edit:all',  // 编辑所有书籍
  BOOK_OFFSALE_OWN: 'book:offsale:own', // 下架自己的书籍
  BOOK_OFFSALE_ALL: 'book:offsale:all', // 下架所有书籍
  BOOK_AUDIT: 'book:audit',        // 审核书籍
  // 交易管理
  TRADE_CREATE: 'trade:create',    // 创建交易
  TRADE_MANAGE_OWN: 'trade:manage:own', // 管理自己的交易
  TRADE_MANAGE_ALL: 'trade:manage:all', // 管理所有交易
  // 数据看板
  DATA_VIEW: 'data:view',          // 查看数据看板
  // 权限管理
  PERMISSION_MANAGE: 'permission:manage' // 管理权限
}

// 2. 角色-权限映射表
// 导出 ROLE_PERMISSIONS 以便其他模块（如权限管理页面）引用
// 先创建对象，再分别赋值，避免在初始化时自引用导致的错误
export const ROLE_PERMISSIONS = {}

ROLE_PERMISSIONS.student = [
  PERMISSIONS.BOOK_PUBLISH,
  PERMISSIONS.BOOK_EDIT_OWN,
  PERMISSIONS.BOOK_OFFSALE_OWN,
  PERMISSIONS.TRADE_CREATE,
  PERMISSIONS.TRADE_MANAGE_OWN
]

ROLE_PERMISSIONS.admin = [
  // 继承学生所有权限
  ...ROLE_PERMISSIONS.student,
  PERMISSIONS.BOOK_EDIT_ALL,
  PERMISSIONS.BOOK_OFFSALE_ALL,
  PERMISSIONS.BOOK_AUDIT,
  PERMISSIONS.TRADE_MANAGE_ALL,
  PERMISSIONS.DATA_VIEW,
  PERMISSIONS.PERMISSION_MANAGE
]

export const useBookStore = defineStore('bookStore', {
  state: () => ({
    // 当前登录用户（扩展权限字段）
    user: null,
    // 当前用户的权限列表（缓存）
    userPermissions: [],
    // 二手书列表（新增审核状态：unaudit-未审核/audited-已审核/rejected-已驳回）
    bookList: [],
    // 交易记录
    transactionRecord: [],
    // 购物车商品列表
    cartItems: [],
    // 轮播书籍列表
    carouselBooks: [],

    // 书籍分类
    bookCate: [
      { id: 1, name: '教材教辅' },
      { id: 2, name: '文学小说' },
      { id: 3, name: '计算机/编程' },
      { id: 4, name: '考研/考公' },
      { id: 5, name: '其他' }
    ],
    // 书籍状态
    bookStatus: [
      { id: 1, name: '全新未拆' },
      { id: 2, name: '9成新' },
      { id: 3, name: '8成新' },
      { id: 4, name: '7成新及以下' }
    ],
    // 角色列表（用于权限配置）
    roleList: [
      { id: 'student', name: '学生' },
      { id: 'admin', name: '管理员' }
    ],
    // 消息通知
    notifications: []
  }),
  getters: {
    // 获取购物车商品总数
    cartItemCount() {
      return this.cartItems.reduce((total, item) => total + item.quantity, 0)
    },
    // 获取购物车商品总价
    cartTotalPrice() {
      return this.cartItems.reduce((total, item) => {
        const book = this.bookList.find(b => b.id === item.bookId)
        return total + (book ? book.salePrice * item.quantity : 0)
      }, 0)
    }
  },
  actions: {
    // 初始化localStorage监听，实现不同端口间的数据同步
    initLocalStorageListener() {
      console.log('LocalStorage listener initialized')
      
      // 监听localStorage变化
      window.addEventListener('storage', (event) => {
        console.log('Storage event triggered:', event.key)
        try {
          // 只处理我们关心的键
          if (event.key === 'campus_book_books') {
            console.log('Books data changed, updating bookList')
            // 当书籍数据变化时，更新内存中的数据
            if (event.newValue) {
              const newBooks = JSON.parse(event.newValue)
              const oldLength = this.bookList.length
              const newLength = newBooks.length
              this.bookList = newBooks
              console.log(`BookList updated: ${oldLength} → ${newLength} books`)
              
              // 显示通知
              if (oldLength < newLength) {
                console.log('New book added, notifying user')
              } else if (oldLength > newLength) {
                console.log('Book removed, notifying user')
              } else {
                console.log('Book updated, notifying user')
              }
            }
          } else if (event.key === 'campus_book_orders') {
            console.log('Orders data changed, updating transactionRecord')
            // 当订单数据变化时，更新内存中的数据
            if (event.newValue) {
              const newOrders = JSON.parse(event.newValue)
              const oldLength = this.transactionRecord.length
              const newLength = newOrders.length
              this.transactionRecord = newOrders
              console.log(`TransactionRecord updated: ${oldLength} → ${newLength} orders`)
            }
          } else if (event.key === 'campus_book_users') {
            console.log('Users data changed, updating user info')
            // 当用户数据变化时，更新内存中的数据
            if (event.newValue) {
              const users = JSON.parse(event.newValue)
              // 只有当当前用户存在时，才更新用户信息
              if (this.user) {
                const currentUser = users.find(user => user.username === this.user.username)
                if (currentUser) {
                  const oldUser = { ...this.user }
                  this.user = { ...currentUser }
                  console.log('User info updated:', this.user.username)
                  
                  // 检查用户信息是否有重要变化
                  if (oldUser.phone !== currentUser.phone || oldUser.email !== currentUser.email) {
                    console.log('User contact info updated')
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error processing storage event:', error)
        }
      })
      
      // 添加轮询机制，定期检查localStorage中的数据是否有变化
      console.log('Starting polling for data synchronization')
      setInterval(() => {
        try {
          // 检查书籍数据
          const storedBooks = localStorage.getItem('campus_book_books')
          if (storedBooks) {
            const parsedBooks = JSON.parse(storedBooks)
            // 只有当数据长度或内容发生变化时，才更新
            if (parsedBooks.length !== this.bookList.length) {
              console.log('Book data changed via polling, updating bookList')
              this.bookList = parsedBooks
            } else {
              // 检查内容是否变化
              const booksEqual = JSON.stringify(parsedBooks) === JSON.stringify(this.bookList)
              if (!booksEqual) {
                console.log('Book content changed via polling, updating bookList')
                this.bookList = parsedBooks
              }
            }
          }
          
          // 检查订单数据
          const storedOrders = localStorage.getItem('campus_book_orders')
          if (storedOrders) {
            const parsedOrders = JSON.parse(storedOrders)
            if (parsedOrders.length !== this.transactionRecord.length) {
              console.log('Order data changed via polling, updating transactionRecord')
              this.transactionRecord = parsedOrders
            } else {
              // 检查订单内容是否变化
              const ordersEqual = JSON.stringify(parsedOrders) === JSON.stringify(this.transactionRecord)
              if (!ordersEqual) {
                console.log('Order content changed via polling, updating transactionRecord')
                this.transactionRecord = parsedOrders
              }
            }
          }
          
          // 检查用户数据
          const storedUsers = localStorage.getItem('campus_book_users')
          if (storedUsers && this.user) {
            const parsedUsers = JSON.parse(storedUsers)
            const currentUser = parsedUsers.find(user => user.username === this.user.username)
            if (currentUser) {
              const userEqual = JSON.stringify(currentUser) === JSON.stringify(this.user)
              if (!userEqual) {
                console.log('User data changed via polling, updating user info')
                this.user = { ...currentUser }
              }
            }
          }
        } catch (error) {
          console.error('Error during polling:', error)
        }
      }, 2000) // 每2秒检查一次，提高实时性
    },
    // 注册新用户
    register(userInfo) {
      // 获取现有用户列表
      const existingUsers = JSON.parse(localStorage.getItem('campus_book_users') || '[]')
      // 检查用户名是否已存在
      if (existingUsers.find(user => user.username === userInfo.username)) {
        throw new Error('用户名已存在')
      }
      // 为新用户生成默认随机头像
      const randomSeed = userInfo.username?.charCodeAt(0) || Math.floor(Math.random() * 1000)
      const defaultAvatar = `https://placehold.co/100x100/666666/ffffff?text=${userInfo.username?.charAt(0) || 'U'}`
      const currentTime = new Date().toLocaleString()
      // 对密码进行加密
      const hashedPassword = hashPassword(userInfo.password)
      // 添加新用户
      const newUser = {
        id: Date.now().toString(),
        ...userInfo,
        password: hashedPassword, // 存储加密后的密码
        userType: userInfo.userType || 'student', // 默认用户类型为学生
        phone: userInfo.phone || '',
        email: userInfo.email || '',
        address: '',
        avatar: defaultAvatar,
        createdAt: currentTime,
        updatedAt: currentTime
      }
      existingUsers.push(newUser)
      // 保存用户列表
      localStorage.setItem('campus_book_users', JSON.stringify(existingUsers))
      return newUser
    },
    // 登录（扩展权限初始化）
    login(userInfo) {
      // 检查用户是否存在
      const existingUsers = JSON.parse(localStorage.getItem('campus_book_users') || '[]')
      const user = existingUsers.find(u => u.username === userInfo.username)
      if (!user) {
        throw new Error('用户不存在')
      }
      // 验证密码
      if (!verifyPassword(userInfo.password, user.password)) {
        throw new Error('密码错误')
      }
      // 检查并替换旧的头像URL
      const isOldAvatar = user.avatar && (user.avatar.includes('picsum.photos') || user.avatar.startsWith('blob:'))
      if (!user.avatar || isOldAvatar) {
        user.avatar = `https://placehold.co/100x100/666666/ffffff?text=${user.username?.charAt(0) || 'U'}`
        user.updatedAt = new Date().toLocaleString()
        // 保存更新后的用户信息
        const userIndex = existingUsers.findIndex(u => u.username === user.username)
        if (userIndex !== -1) {
          existingUsers[userIndex] = user
          localStorage.setItem('campus_book_users', JSON.stringify(existingUsers))
        }
      }
      this.user = { ...user }
      // 确保用户类型存在
      if (!this.user.userType) {
        this.user.userType = 'student'
        console.log('用户类型未设置，默认设置为 student')
      }
      // 根据角色初始化权限列表
      this.userPermissions = ROLE_PERMISSIONS[this.user.userType] || []
      localStorage.setItem('campus_book_login', 'true')
      // 缓存用户信息（含权限）
      localStorage.setItem('campus_book_user', JSON.stringify(this.user))
      console.log('用户登录成功，用户类型：', this.user.userType)
      // 从本地存储加载书籍列表
      const storedBooks = localStorage.getItem('campus_book_books')
      if (storedBooks) {
        this.bookList = JSON.parse(storedBooks)
      }
      // 从本地存储加载订单列表
      const storedOrders = localStorage.getItem('campus_book_orders')
      if (storedOrders) {
        this.transactionRecord = JSON.parse(storedOrders)
      }
      // 初始化当前用户的通知
      this.initNotifications()
    },
    // 退出登录
    logout() {
      this.user = null
      this.userPermissions = []
      localStorage.removeItem('campus_book_login')
      localStorage.removeItem('campus_book_user')
    },
    // 检查权限（核心方法：判断当前用户是否有指定权限）
    hasPermission(permissionCode) {
      // 未登录用户没有任何权限
      if (!this.user) return false
      // 管理员默认拥有所有权限
      if (this.user.userType === 'admin') return true
      return this.userPermissions.includes(permissionCode)
    },
    // 发布二手书（新增审核状态）
    publishBook(book) {
      try {
        if (!this.user) {
          throw new Error('用户未登录')
        }
        console.log('Publishing new book:', book.name)
        const currentTime = new Date().toLocaleString()
        const newBook = {
          id: Date.now().toString(),
          ...book,
          publishTime: currentTime,
          status: 'onSale', // onSale:在售, sold:已售出, offSale:下架
          auditStatus: 'unaudit', // 新增：未审核（仅管理员可审核）
          publisher: this.user.username,
          desc: book.desc || '',
          cover: book.cover || `https://placehold.co/200x280/4A90E2/FFFFFF?text=Book`,
          createdAt: currentTime,
          updatedAt: currentTime
        }
        console.log('New book details:', newBook)
        
        // 添加到本地列表
        this.bookList.push(newBook)
        console.log('Book added to local list, new length:', this.bookList.length)
        
        // 持久化到本地存储
        localStorage.setItem('campus_book_books', JSON.stringify(this.bookList))
        console.log('Book published and saved to localStorage')
        
        // 触发同步通知
        console.log('Book publish event completed, syncing to other users')
        
        // 添加消息通知给发布者
        this.addNotification({
          title: '新的书籍上架',
          description: `您的书籍《${book.name}》已成功上架，等待管理员审核。`
        })
        
        // 添加消息通知给管理员
        const adminNotification = {
          id: Date.now().toString() + '_admin',
          title: '新的书籍审核',
          description: `您有新的书籍《${book.name}》需要审核。`,
          time: new Date().toLocaleString(),
          read: false
        }
        // 保存管理员通知到本地存储
        try {
          const adminNotifications = JSON.parse(localStorage.getItem('campus_book_admin_notifications') || '[]')
          adminNotifications.unshift(adminNotification)
          if (adminNotifications.length > 20) {
            adminNotifications.splice(20)
          }
          localStorage.setItem('campus_book_admin_notifications', JSON.stringify(adminNotifications))
          console.log('管理员通知已创建:', adminNotification)
        } catch (error) {
          console.error('创建管理员通知失败:', error)
        }
        
        return newBook
      } catch (error) {
        console.error('Error publishing book:', error)
        throw new Error(`发布书籍失败: ${error.message}`)
      }
    },
    // 审核书籍（仅管理员）
    auditBook(id, auditStatus, rejectReason = '') {
      const book = this.bookList.find(item => item.id === id)
      if (book) {
        book.auditStatus = auditStatus // audited-通过, rejected-驳回
        book.rejectReason = rejectReason // 驳回原因
        // 驳回后自动下架
        if (auditStatus === 'rejected') book.status = 'offSale'
        book.updatedAt = new Date().toLocaleString()
        // 持久化到本地存储
        localStorage.setItem('campus_book_books', JSON.stringify(this.bookList))
        
        // 添加消息通知给书籍发布者
        if (auditStatus === 'audited') {
          // 为书籍发布者创建通知
          const publisherNotifications = JSON.parse(localStorage.getItem(`campus_book_notifications_${book.publisher}`) || '[]')
          const auditNotification = {
            id: Date.now().toString(),
            title: '书籍审核通过',
            description: `您的书籍《${book.name}》已通过审核，现在可以在平台上展示。`,
            time: new Date().toLocaleString(),
            read: false
          }
          publisherNotifications.unshift(auditNotification)
          if (publisherNotifications.length > 20) {
            publisherNotifications.splice(20)
          }
          localStorage.setItem(`campus_book_notifications_${book.publisher}`, JSON.stringify(publisherNotifications))
          console.log('已发送审核通过通知给:', book.publisher)
        } else if (auditStatus === 'rejected') {
          // 为书籍发布者创建通知
          const publisherNotifications = JSON.parse(localStorage.getItem(`campus_book_notifications_${book.publisher}`) || '[]')
          const rejectNotification = {
            id: Date.now().toString(),
            title: '书籍审核驳回',
            description: `您的书籍《${book.name}》未通过审核，原因：${rejectReason || '不符合平台规定'}`,
            time: new Date().toLocaleString(),
            read: false
          }
          publisherNotifications.unshift(rejectNotification)
          if (publisherNotifications.length > 20) {
            publisherNotifications.splice(20)
          }
          localStorage.setItem(`campus_book_notifications_${book.publisher}`, JSON.stringify(publisherNotifications))
          console.log('已发送审核驳回通知给:', book.publisher)
        }
        
        // 清除管理员通知
        if (this.user && this.user.userType === 'admin') {
          const adminNotifications = JSON.parse(localStorage.getItem('campus_book_admin_notifications') || '[]')
          const filteredAdminNotifications = adminNotifications.filter(n => !n.description.includes(`《${book.name}》`))
          localStorage.setItem('campus_book_admin_notifications', JSON.stringify(filteredAdminNotifications))
        }
      }
    },
    // 更新书籍状态（扩展权限判断）
    updateBookStatus(id, status) {
      const book = this.bookList.find(item => item.id === id)
      if (book) {
        // 学生只能修改自己的书籍，管理员可修改所有
        if (this.user.userType === 'admin' || book.publisher === this.user.username) {
          book.status = status
          book.updatedAt = new Date().toLocaleString()
          // 持久化到本地存储
          localStorage.setItem('campus_book_books', JSON.stringify(this.bookList))
          
          // 发送下架通知给书籍发布者
          if (status === 'offSale') {
            // 检查是否是书籍发布者自己操作
            if (book.publisher !== this.user.username) {
              // 为书籍发布者创建通知
              const publisherNotifications = JSON.parse(localStorage.getItem(`campus_book_notifications_${book.publisher}`) || '[]')
              const offSaleNotification = {
                id: Date.now().toString(),
                title: '书籍已下架',
                description: `您的书籍《${book.name}》已被${this.user.userType === 'admin' ? '管理员' : '您'}下架。`,
                time: new Date().toLocaleString(),
                read: false
              }
              publisherNotifications.unshift(offSaleNotification)
              if (publisherNotifications.length > 20) {
                publisherNotifications.splice(20)
              }
              localStorage.setItem(`campus_book_notifications_${book.publisher}`, JSON.stringify(publisherNotifications))
              console.log('已发送下架通知给:', book.publisher)
            }
            
            // 从所有用户的购物车中移除下架的书籍
            try {
              // 获取所有用户的购物车数据
              const users = JSON.parse(localStorage.getItem('campus_book_users') || '[]')
              users.forEach(user => {
                const cartKey = `campus_book_cart_${user.username}`
                const userCart = JSON.parse(localStorage.getItem(cartKey) || '[]')
                const updatedCart = userCart.filter(item => item.bookId !== id)
                if (updatedCart.length !== userCart.length) {
                  localStorage.setItem(cartKey, JSON.stringify(updatedCart))
                  console.log('已从用户', user.username, '的购物车中移除下架书籍')
                }
              })
            } catch (error) {
              console.error('从购物车中移除下架书籍失败:', error)
            }
          }
        }
      }
    },
    // 删除发布记录（将书籍标记为已删除发布，但保留书籍数据）
    deletePublishRecord(id) {
      const bookIndex = this.bookList.findIndex(item => item.id === id)
      if (bookIndex === -1) {
        throw new Error('书籍不存在')
      }
      
      const book = this.bookList[bookIndex]
      
      // 学生只能删除自己的发布记录，管理员可删除所有
      if (this.user.userType !== 'admin' && book.publisher !== this.user.username) {
        throw new Error('无权删除该发布记录')
      }
      
      // 将书籍标记为已删除发布记录
      book.publishDeleted = true
      book.publishDeletedAt = new Date().toLocaleString()
      book.updatedAt = new Date().toLocaleString()
      
      // 从轮播列表中移除
      const carouselIndex = this.carouselBooks.findIndex(item => item.id === id)
      if (carouselIndex !== -1) {
        this.carouselBooks.splice(carouselIndex, 1)
        localStorage.setItem('campus_book_carousel_books', JSON.stringify(this.carouselBooks))
      }
      
      // 持久化到本地存储
      localStorage.setItem('campus_book_books', JSON.stringify(this.bookList))
      
      // 从所有用户的购物车中移除该书籍
      try {
        const users = JSON.parse(localStorage.getItem('campus_book_users') || '[]')
        users.forEach(user => {
          const cartKey = `campus_book_cart_${user.username}`
          const userCart = JSON.parse(localStorage.getItem(cartKey) || '[]')
          const updatedCart = userCart.filter(item => item.bookId !== id)
          if (updatedCart.length !== userCart.length) {
            localStorage.setItem(cartKey, JSON.stringify(updatedCart))
            console.log('已从用户', user.username, '的购物车中移除删除发布记录的书籍')
          }
        })
      } catch (error) {
        console.error('从购物车中移除删除发布记录的书籍失败:', error)
      }
      
      // 清除管理员通知
      if (this.user && this.user.userType === 'admin') {
        const adminNotifications = JSON.parse(localStorage.getItem('campus_book_admin_notifications') || '[]')
        const filteredAdminNotifications = adminNotifications.filter(n => !n.description.includes(`《${book.name}》`))
        localStorage.setItem('campus_book_admin_notifications', JSON.stringify(filteredAdminNotifications))
      }
    },
    // 更新书籍信息
    updateBookInfo(id, bookInfo) {
      const bookIndex = this.bookList.findIndex(item => item.id === id)
      if (bookIndex === -1) {
        throw new Error('书籍不存在')
      }
      
      const book = this.bookList[bookIndex]
      
      // 学生只能编辑自己的书籍，管理员可编辑所有
      if (this.user.userType !== 'admin' && book.publisher !== this.user.username) {
        throw new Error('无权编辑该书籍')
      }
      
      // 补充分类和状态名称
      const cate = this.bookCate.find(item => item.id === bookInfo.cateId)
      const status = this.bookStatus.find(item => item.id === bookInfo.statusId)
      
      // 更新书籍信息
      this.bookList[bookIndex] = {
        ...book,
        ...bookInfo,
        cateName: cate?.name || book.cateName,
        statusName: status?.name || book.statusName,
        updatedAt: new Date().toLocaleString()
      }
      
      // 持久化到本地存储
      localStorage.setItem('campus_book_books', JSON.stringify(this.bookList))
      
      // 如果书籍在轮播列表中，也更新轮播列表中的书籍信息
      const carouselIndex = this.carouselBooks.findIndex(item => item.id === id)
      if (carouselIndex !== -1) {
        this.carouselBooks[carouselIndex] = this.bookList[bookIndex]
        localStorage.setItem('campus_book_carousel_books', JSON.stringify(this.carouselBooks))
      }
    },
    // 创建交易记录
    createTransaction(record) {
      const currentTime = new Date().toLocaleString()
      const newOrder = {
        id: Date.now().toString(),
        ...record,
        createTime: currentTime,
        status: 'pending', // pending:待确认, completed:已完成, cancel:已取消
        quantity: record.quantity || 1,
        totalPrice: record.totalPrice || (record.price * (record.quantity || 1)),
        phone: record.phone || '',
        address: record.address || '',
        tradeType: record.tradeType || 'offline',
        createdAt: currentTime,
        updatedAt: currentTime
      }
      this.transactionRecord.push(newOrder)
      this.updateBookStatus(record.bookId, 'sold')
      // 持久化到本地存储
      localStorage.setItem('campus_book_orders', JSON.stringify(this.transactionRecord))
      
      // 添加消息通知给卖家（书籍发布者）
      if (record.seller) {
        const sellerNotifications = JSON.parse(localStorage.getItem(`campus_book_notifications_${record.seller}`) || '[]')
        const sellerNotification = {
          id: Date.now().toString(),
          title: '新的订单通知',
          description: `您的书籍《${record.bookName}》已被用户下单，等待确认交易。`,
          time: new Date().toLocaleString(),
          read: false
        }
        sellerNotifications.unshift(sellerNotification)
        if (sellerNotifications.length > 20) {
          sellerNotifications.splice(20)
        }
        localStorage.setItem(`campus_book_notifications_${record.seller}`, JSON.stringify(sellerNotifications))
        console.log('已发送订单通知给卖家:', record.seller)
      }
    },
    // 完成交易
    completeTransaction(id) {
      const record = this.transactionRecord.find(item => item.id === id)
      if (record) {
        record.status = 'completed'
        record.updatedAt = new Date().toLocaleString()
        // 持久化到本地存储
        localStorage.setItem('campus_book_orders', JSON.stringify(this.transactionRecord))
      }
    },
    // 取消交易
    cancelTransaction(id) {
      const record = this.transactionRecord.find(item => item.id === id)
      if (record) {
        record.status = 'cancel'
        record.updatedAt = new Date().toLocaleString()
        this.updateBookStatus(record.bookId, 'onSale')
        // 持久化到本地存储
        localStorage.setItem('campus_book_orders', JSON.stringify(this.transactionRecord))
      }
    },
    // 初始化用户（页面刷新后恢复权限）
    initUser() {
      // 检查并创建默认管理员账号
      const existingUsers = JSON.parse(localStorage.getItem('campus_book_users') || '[]')
      const adminIndex = existingUsers.findIndex(user => user.username === 'admin')
      
      const currentTime = new Date().toLocaleString()
      const defaultAdmin = {
        id: Date.now().toString(),
        username: 'admin',
        password: hashPassword('admin1'),
        userType: 'admin',
        phone: '',
        email: '',
        address: '',
        avatar: `https://placehold.co/100x100/666666/ffffff?text=U`,
        createdAt: currentTime,
        updatedAt: currentTime
      }
      
      if (adminIndex === -1) {
        existingUsers.push(defaultAdmin)
        console.log('默认管理员账号已创建')
      } else {
        // 更新旧的管理员账号，确保密码是加密的
        existingUsers[adminIndex] = defaultAdmin
        console.log('默认管理员账号已更新')
      }
      
      // 为所有没有userType的用户添加默认用户类型为student
      let updatedUsers = false
      existingUsers.forEach(user => {
        if (!user.userType) {
          user.userType = 'student'
          user.updatedAt = currentTime
          updatedUsers = true
          console.log(`为用户 ${user.username} 添加默认用户类型: student`)
        }
      })
      
      if (updatedUsers) {
        localStorage.setItem('campus_book_users', JSON.stringify(existingUsers))
        console.log('已更新所有用户的用户类型')
      }
      
      localStorage.setItem('campus_book_users', JSON.stringify(existingUsers))
      
      // 从本地存储加载书籍列表
      const storedBooks = localStorage.getItem('campus_book_books')
      if (storedBooks) {
        this.bookList = JSON.parse(storedBooks)
      }
      
      // 从本地存储加载订单列表
      const storedOrders = localStorage.getItem('campus_book_orders')
      if (storedOrders) {
        this.transactionRecord = JSON.parse(storedOrders)
      }
      
      // 从本地存储加载轮播书籍列表
      const storedCarouselBooks = localStorage.getItem('campus_book_carousel_books')
      if (storedCarouselBooks) {
        this.carouselBooks = JSON.parse(storedCarouselBooks)
      }
      
      const userStr = localStorage.getItem('campus_book_user')
      if (userStr) {
        this.user = JSON.parse(userStr)
        // 检查并替换旧的头像URL
        const isOldAvatar = this.user.avatar && (this.user.avatar.includes('picsum.photos') || this.user.avatar.startsWith('blob:'))
        if (!this.user.avatar || isOldAvatar) {
          const defaultAvatar = `https://placehold.co/100x100/666666/ffffff?text=${this.user.username?.charAt(0) || 'U'}`
          this.user.avatar = defaultAvatar
          // 更新本地存储中的用户信息
          const existingUsers = JSON.parse(localStorage.getItem('campus_book_users') || '[]')
          const userIndex = existingUsers.findIndex(u => u.username === this.user.username)
          if (userIndex !== -1) {
            existingUsers[userIndex] = this.user
            localStorage.setItem('campus_book_users', JSON.stringify(existingUsers))
            localStorage.setItem('campus_book_user', JSON.stringify(this.user))
          }
        }
        this.userPermissions = ROLE_PERMISSIONS[this.user.userType] || []
      }
    },
    
    // 购物车相关操作
    // 添加到购物车
    addToCart(bookId) {
      // 检查书籍是否存在
      const book = this.bookList.find(b => b.id === bookId)
      if (!book) {
        throw new Error('书籍不存在')
      }
      
      // 检查书籍是否已在售
      if (book.status !== 'onSale') {
        throw new Error('该书籍已下架或已售出')
      }
      
      // 检查是否为自己的书籍
      if (book.publisher === this.user.username) {
        throw new Error('不能购买自己发布的书籍')
      }
      
      // 查找购物车中是否已存在该商品
      const existingItem = this.cartItems.find(item => item.bookId === bookId)
      
      if (existingItem) {
        // 已存在则增加数量
        existingItem.quantity++
      } else {
        // 不存在则添加新商品
        this.cartItems.push({
          bookId,
          quantity: 1
        })
      }
    },
    
    // 从购物车移除
    removeFromCart(bookId) {
      const index = this.cartItems.findIndex(item => item.bookId === bookId)
      if (index !== -1) {
        this.cartItems.splice(index, 1)
      }
    },
    
    // 更新购物车商品数量
    updateCartItemQuantity(bookId, quantity) {
      const item = this.cartItems.find(item => item.bookId === bookId)
      if (item) {
        // 数量必须大于0
        item.quantity = Math.max(1, quantity)
      }
    },
    
    // 清空购物车
    clearCart() {
      this.cartItems = []
    },
    
    // 轮播图管理
    // 添加轮播书籍
    addCarouselBook(bookId) {
      // 检查书籍是否存在
      const book = this.bookList.find(b => b.id === bookId)
      if (!book) {
        throw new Error('书籍不存在')
      }
      
      // 检查书籍是否已在售且已审核
      if (book.status !== 'onSale' || book.auditStatus !== 'audited') {
        throw new Error('只能添加在售且已审核的书籍到轮播图')
      }
      
      // 检查书籍是否已在轮播列表中
      if (this.carouselBooks.some(item => item.id === bookId)) {
        throw new Error('该书籍已在轮播列表中')
      }
      
      // 限制轮播书籍数量
      if (this.carouselBooks.length >= 5) {
        throw new Error('轮播书籍数量不能超过5本')
      }
      
      // 添加到轮播列表
      this.carouselBooks.push(book)
      // 持久化到本地存储
      localStorage.setItem('campus_book_carousel_books', JSON.stringify(this.carouselBooks))
    },
    
    // 从轮播中移除书籍
    removeCarouselBook(bookId) {
      const index = this.carouselBooks.findIndex(item => item.id === bookId)
      if (index !== -1) {
        this.carouselBooks.splice(index, 1)
        // 持久化到本地存储
        localStorage.setItem('campus_book_carousel_books', JSON.stringify(this.carouselBooks))
      }
    },
    
    // 初始化消息通知
    initNotifications() {
      // 先加载当前用户的通知
      const username = this.user?.username || 'guest'
      const storedNotifications = localStorage.getItem(`campus_book_notifications_${username}`)
      if (storedNotifications) {
        try {
          this.notifications = JSON.parse(storedNotifications)
        } catch (error) {
          console.error('加载通知失败:', error)
          this.notifications = []
        }
      } else {
        this.notifications = []
      }
      
      // 管理员加载专门的管理员通知
      if (this.user && this.user.userType === 'admin') {
        try {
          const adminNotifications = localStorage.getItem('campus_book_admin_notifications')
          if (adminNotifications) {
            const parsedAdminNotifications = JSON.parse(adminNotifications)
            // 将管理员通知合并到普通通知中
            this.notifications = [...parsedAdminNotifications, ...this.notifications]
            // 去重并限制数量
            const uniqueNotifications = []
            const seenIds = new Set()
            for (const notification of this.notifications) {
              if (!seenIds.has(notification.id)) {
                seenIds.add(notification.id)
                uniqueNotifications.push(notification)
              }
            }
            this.notifications = uniqueNotifications.slice(0, 20)
            console.log('管理员通知已加载:', parsedAdminNotifications.length, '条')
          }
        } catch (error) {
          console.error('加载管理员通知失败:', error)
        }
      }
    },
    
    // 添加消息通知
    addNotification(notification) {
      const newNotification = {
        id: Date.now().toString(),
        ...notification,
        time: new Date().toLocaleString(),
        read: false
      }
      this.notifications.unshift(newNotification) // 添加到开头
      // 限制通知数量，最多保存20条
      if (this.notifications.length > 20) {
        this.notifications = this.notifications.slice(0, 20)
      }
      // 为每个用户创建独立的通知存储
      const username = this.user?.username || 'guest'
      localStorage.setItem(`campus_book_notifications_${username}`, JSON.stringify(this.notifications))
      return newNotification
    },
    
    // 清空所有消息通知
    clearNotifications() {
      this.notifications = []
      // 为当前用户清空通知
      const username = this.user?.username || 'guest'
      localStorage.removeItem(`campus_book_notifications_${username}`)
      // 清除管理员通知
      if (this.user && this.user.userType === 'admin') {
        localStorage.removeItem('campus_book_admin_notifications')
      }
    },
    
    // 标记消息为已读
    markNotificationAsRead(notificationId) {
      const notification = this.notifications.find(n => n.id === notificationId)
      if (notification) {
        notification.read = true
        // 为当前用户更新通知
        const username = this.user?.username || 'guest'
        localStorage.setItem(`campus_book_notifications_${username}`, JSON.stringify(this.notifications))
        
        // 同时更新管理员通知的已读状态
        if (this.user && this.user.userType === 'admin' && notificationId.includes('_admin')) {
          const adminNotifications = JSON.parse(localStorage.getItem('campus_book_admin_notifications') || '[]')
          const adminNotification = adminNotifications.find(n => n.id === notificationId)
          if (adminNotification) {
            adminNotification.read = true
            localStorage.setItem('campus_book_admin_notifications', JSON.stringify(adminNotifications))
          }
        }
      }
    },
    
    // 结算购物车
    checkoutCart() {
      if (this.cartItems.length === 0) {
        throw new Error('购物车为空')
      }
      
      // 为每个商品创建交易记录
      this.cartItems.forEach(item => {
        const book = this.bookList.find(b => b.id === item.bookId)
        if (book && book.status === 'onSale') {
          // 创建交易记录
          this.createTransaction({
            bookId: book.id,
            bookName: book.name,
            buyer: this.user.username,
            seller: book.publisher,
            price: book.salePrice,
            quantity: item.quantity,
            address: '',
            phone: ''
          })
        }
      })
      
      // 清空购物车
      this.clearCart()
    },
    
    // 更新用户信息
    updateUserInfo(userInfo) {
      if (!this.user) {
        throw new Error('用户未登录')
      }
      
      const { username, phone, email, address, avatar } = userInfo
      const existingUsers = JSON.parse(localStorage.getItem('campus_book_users') || '[]')
      
      // 保存原来的用户名
      const originalUsername = this.user.username
      
      // 找到当前用户在本地存储中的索引
      const userIndex = existingUsers.findIndex(user => user.username === originalUsername)
      if (userIndex === -1) {
        throw new Error('用户不存在')
      }
      
      const currentUser = existingUsers[userIndex]
      
      // 检查新用户名是否已被占用（如果修改了用户名）
      if (username !== originalUsername) {
        if (existingUsers.find(user => user.username === username)) {
          throw new Error('用户名已存在')
        }
      }
      
      // 更新用户信息
      currentUser.username = username
      currentUser.phone = phone
      currentUser.email = email
      currentUser.address = address
      // 检查并替换blob URL头像
      if (avatar && avatar.startsWith('blob:')) {
        currentUser.avatar = `https://placehold.co/100x100/666666/ffffff?text=${username?.charAt(0) || 'U'}`
      } else {
        currentUser.avatar = avatar
      }
      currentUser.updatedAt = new Date().toLocaleString()
      
      // 保存到本地存储
      existingUsers[userIndex] = currentUser
      localStorage.setItem('campus_book_users', JSON.stringify(existingUsers))
      
      // 更新当前登录用户的信息
      this.user = { ...currentUser }
      localStorage.setItem('campus_book_user', JSON.stringify(this.user))
      
      // 更新所有书籍和交易记录中的用户名（如果修改了用户名）
      if (username !== originalUsername) {
        // 更新书籍中的发布者信息
        this.bookList.forEach(book => {
          if (book.publisher === originalUsername) {
            book.publisher = username
          }
        })
        
        // 更新交易记录中的买家和卖家信息
        this.transactionRecord.forEach(record => {
          if (record.buyer === originalUsername) {
            record.buyer = username
          }
          if (record.seller === originalUsername) {
            record.seller = username
          }
        })
      }
    }
  }
})