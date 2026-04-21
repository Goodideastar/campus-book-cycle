// 模拟二手书数据
export const mockBookList = [
  {
    id: 1700000000001,
    name: 'Vue3从入门到精通',
    cateId: 3,
    cateName: '计算机/编程',
    author: '张三',
    originalPrice: 89,
    salePrice: 45,
    statusId: 2,
    statusName: '9成新',
    publisher: '学生A',
    publishTime: '2025-11-10 14:30:00',
    status: 'onSale',
    cover: 'https://placehold.co/200x280/4A90E2/FFFFFF?text=Book',
    desc: '几乎全新，无笔记无划线'
  },
  {
    id: 1700000000002,
    name: '高等数学（同济7版）',
    cateId: 1,
    cateName: '教材教辅',
    author: '同济大学数学系',
    originalPrice: 56,
    salePrice: 20,
    statusId: 3,
    statusName: '8成新',
    publisher: '学生B',
    publishTime: '2025-11-15 10:20:00',
    status: 'onSale',
    cover: 'https://placehold.co/200x280/4A90E2/FFFFFF?text=Book',
    desc: '少量笔记，不影响阅读'
  },
  {
    id: 1700000000003,
    name: '考研英语真题大全',
    cateId: 4,
    cateName: '考研/考公',
    author: '考研英语命题组',
    originalPrice: 78,
    salePrice: 35,
    statusId: 2,
    statusName: '9成新',
    publisher: '学生C',
    publishTime: '2025-11-20 09:15:00',
    status: 'sold',
    cover: 'https://placehold.co/200x280/4A90E2/FFFFFF?text=Book',
    desc: '仅做了2套真题，几乎全新'
  }
]

// 模拟交易记录
export const mockTransactionRecord = [
  {
    id: 1700000001001,
    bookId: 1700000000003,
    bookName: '考研英语真题大全',
    buyer: '学生D',
    seller: '学生C',
    price: 35,
    createTime: '2025-11-22 15:40:00',
    status: 'completed'
  }
]

// 模拟书籍分类统计
export const mockCateData = [
  { name: '教材教辅', value: 45 },
  { name: '文学小说', value: 20 },
  { name: '计算机/编程', value: 15 },
  { name: '考研/考公', value: 15 },
  { name: '其他', value: 5 }
]

// 模拟月度交易数据
export const mockTradeData = [
  { month: '1月', count: 12 },
  { month: '2月', count: 18 },
  { month: '3月', count: 25 },
  { month: '4月', count: 20 },
  { month: '5月', count: 30 },
  { month: '6月', count: 35 }
]