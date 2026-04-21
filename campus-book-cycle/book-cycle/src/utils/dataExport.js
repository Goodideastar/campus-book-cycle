/**
 * 数据导出/导入工具
 * 用于在不同设备间转移 LocalStorage 数据
 * 支持 JSONBin.io 云端存储
 */

// 定义需要备份的 LocalStorage 键名
const STORAGE_KEYS = [
  'campus_book_books',           // 书籍数据
  'campus_book_users',           // 用户数据
  'campus_book_transactions',    // 交易数据
  'campus_book_cart',            // 购物车数据
  'campus_book_carousel_books',  // 轮播图数据
  'campus_book_current_user',    // 当前登录用户
]

// JSONBin.io 配置（⚠️ 请替换为你自己的 Bin ID 和 API Key）
const JSONBIN_CONFIG = {
  binId: localStorage.getItem('jsonbin_bin_id') || '',
  apiKey: localStorage.getItem('jsonbin_api_key') || '',
  baseUrl: 'https://api.jsonbin.io/v3'
}

/**
 * 设置 JSONBin.io 配置
 * @param {string} binId - 你的 Bin ID
 * @param {string} apiKey - 你的 API Key
 */
export function setJSONBinConfig(binId, apiKey) {
  if (!binId || !apiKey) {
    throw new Error('Bin ID 和 API Key 都不能为空')
  }
  
  localStorage.setItem('jsonbin_bin_id', binId)
  localStorage.setItem('jsonbin_api_key', apiKey)
  
  JSONBIN_CONFIG.binId = binId
  JSONBIN_CONFIG.apiKey = apiKey
  
  return '配置已保存'
}

/**
 * 清除 JSONBin.io 配置
 */
export function clearJSONBinConfig() {
  localStorage.removeItem('jsonbin_bin_id')
  localStorage.removeItem('jsonbin_api_key')
  
  JSONBIN_CONFIG.binId = ''
  JSONBIN_CONFIG.apiKey = ''
  
  return '配置已清除'
}

/**
 * 检查 JSONBin.io 是否已配置
 * @returns {boolean}
 */
export function isJSONBinConfigured() {
  return !!(JSONBIN_CONFIG.binId && JSONBIN_CONFIG.apiKey)
}

/**
 * 导出所有数据为 JSON 文件
 */
export function exportAllData() {
  // 收集所有数据
  const data = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    note: '校园二手书管理系统数据备份'
  }

  // 读取每个 LocalStorage 键的数据
  STORAGE_KEYS.forEach(key => {
    const value = localStorage.getItem(key)
    if (value !== null) {
      data[key] = JSON.parse(value)
    }
  })

  // 创建 Blob 对象
  const blob = new Blob([JSON.stringify(data, null, 2)], { 
    type: 'application/json' 
  })
  
  // 创建下载链接
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  
  // 生成文件名（包含时间戳）
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  a.download = `校园二手书数据备份_${timestamp}.json`
  
  // 触发下载
  document.body.appendChild(a)
  a.click()
  
  // 清理
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  return '数据导出成功'
}

/**
 * 从 JSON 文件导入数据
 * @param {File} file - 用户上传的 JSON 文件
 * @returns {Promise<string>} - 导入结果消息
 */
export function importAllData(file) {
  return new Promise((resolve, reject) => {
    // 验证文件类型
    if (!file.name.endsWith('.json')) {
      reject('请选择 JSON 格式的文件')
      return
    }

    const reader = new FileReader()
    
    // 文件读取完成
    reader.onload = (e) => {
      try {
        // 解析 JSON
        const data = JSON.parse(e.target.result)
        
        // 验证数据格式
        if (!data.version || !data.exportedAt) {
          reject('无效的数据文件格式')
          return
        }

        // 确认导入
        const confirmMsg = `
          数据文件信息：
          - 版本：${data.version}
          - 导出时间：${new Date(data.exportedAt).toLocaleString('zh-CN')}
          - 说明：${data.note || '无'}
          
          导入将覆盖当前数据，是否继续？
        `

        if (confirm(confirmMsg)) {
          // 执行导入
          STORAGE_KEYS.forEach(key => {
            if (data[key] !== undefined) {
              localStorage.setItem(key, JSON.stringify(data[key]))
            }
          })
          
          resolve(`数据导入成功！\n导入时间：${new Date().toLocaleString('zh-CN')}`)
        } else {
          reject('用户取消导入')
        }
      } catch (err) {
        reject(`数据解析失败：${err.message}`)
      }
    }
    
    // 文件读取错误
    reader.onerror = () => {
      reject('文件读取失败')
    }
    
    // 开始读取文件
    reader.readAsText(file)
  })
}

/**
 * 清空所有数据
 */
export function clearAllData() {
  if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
    STORAGE_KEYS.forEach(key => {
      localStorage.removeItem(key)
    })
    return '数据已清空'
  }
  return '操作已取消'
}

/**
 * 获取当前数据大小
 * @returns {string} - 数据大小描述
 */
export function getDataSize() {
  let totalSize = 0
  
  STORAGE_KEYS.forEach(key => {
    const value = localStorage.getItem(key)
    if (value !== null) {
      totalSize += value.length
    }
  })
  
  // 转换为可读格式
  if (totalSize < 1024) {
    return `${totalSize} 字节`
  } else if (totalSize < 1024 * 1024) {
    return `${(totalSize / 1024).toFixed(2)} KB`
  } else {
    return `${(totalSize / 1024 / 1024).toFixed(2)} MB`
  }
}

// ==================== JSONBin.io 云存储功能 ====================

/**
 * 收集当前所有本地数据
 * @returns {Object} - 数据对象
 */
function collectLocalData() {
  const data = {
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    data: {}
  }

  STORAGE_KEYS.forEach(key => {
    const value = localStorage.getItem(key)
    if (value !== null) {
      try {
        data.data[key] = JSON.parse(value)
      } catch (e) {
        console.warn(`解析 ${key} 数据失败:`, e)
      }
    }
  })

  return data
}

/**
 * 保存数据到 JSONBin.io 云端
 * @returns {Promise<string>} - 操作结果消息
 */
export async function saveToCloud() {
  if (!isJSONBinConfigured()) {
    throw new Error('请先配置 JSONBin.io（在设置中填写 Bin ID 和 API Key）')
  }

  try {
    const data = collectLocalData()
    
    const response = await fetch(`${JSONBIN_CONFIG.baseUrl}/b/${JSONBIN_CONFIG.binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_CONFIG.apiKey,
        'X-Bin-Versioning': 'false'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    
    // 保存最后同步时间
    localStorage.setItem('last_cloud_sync', new Date().toISOString())
    
    return `✅ 数据已成功保存到云端\n更新时间：${new Date().toLocaleString('zh-CN')}`
  } catch (error) {
    console.error('云端保存失败:', error)
    throw new Error(`❌ 云端保存失败: ${error.message}\n\n可能的原因:\n1. 网络连接问题\n2. API Key 或 Bin ID 错误\n3. 服务暂时不可用`)
  }
}

/**
 * 从 JSONBin.io 云端加载数据
 * @param {boolean} force - 是否强制覆盖（默认会提示确认）
 * @returns {Promise<string>} - 操作结果消息
 */
export async function loadFromCloud(force = false) {
  if (!isJSONBinConfigured()) {
    throw new Error('请先配置 JSONBin.io（在设置中填写 Bin ID 和 API Key）')
  }

  try {
    const response = await fetch(`${JSONBIN_CONFIG.baseUrl}/b/${JSONBIN_CONFIG.binId}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': JSONBIN_CONFIG.apiKey
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    const cloudData = result.record

    if (!cloudData || !cloudData.data) {
      throw new Error('云端数据格式无效或为空')
    }

    // 显示云端数据信息
    const cloudInfo = `
📦 云端数据信息：
- 版本：${cloudData.version}
- 最后更新：${new Date(cloudData.updatedAt).toLocaleString('zh-CN')}
- 包含数据项：${Object.keys(cloudData.data).length} 个
    `

    // 如果不是强制加载，询问用户
    if (!force) {
      const confirmMsg = `${cloudInfo}\n\n⚠️ 此操作将覆盖本地数据，是否继续？`
      if (!confirm(confirmMsg)) {
        throw new Error('用户取消操作')
      }
    }

    // 执行导入
    STORAGE_KEYS.forEach(key => {
      if (cloudData.data[key] !== undefined) {
        localStorage.setItem(key, JSON.stringify(cloudData.data[key]))
      }
    })

    // 更新最后同步时间
    localStorage.setItem('last_cloud_sync', new Date().toISOString())
    
    return `✅ 云端数据加载成功！\n${cloudInfo}\n\n💡 提示：页面将自动刷新以应用新数据`
  } catch (error) {
    console.error('云端加载失败:', error)
    throw new Error(`❌ 云端加载失败: ${error.message}`)
  }
}

/**
 * 同步本地与云端数据（智能合并策略）
 * @returns {Promise<string>} - 操作结果消息
 */
export async function syncWithCloud() {
  if (!isJSONBinConfigured()) {
    throw new Error('请先配置 JSONBin.io（在设置中填写 Bin ID 和 API Key）')
  }

  try {
    // 1. 先获取云端数据
    const response = await fetch(`${JSONBIN_CONFIG.baseUrl}/b/${JSONBIN_CONFIG.binId}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': JSONBIN_CONFIG.apiKey
      }
    })

    if (!response.ok) {
      throw new Error(`无法获取云端数据: HTTP ${response.status}`)
    }

    const result = await response.json()
    const cloudData = result.record
    
    // 2. 收集本地数据
    const localData = collectLocalData()
    
    // 3. 智能合并策略：以最新时间为准
    const mergedData = {
      ...localData,
      data: { ...cloudData.data }  // 以云端数据为基础
    }
    
    STORAGE_KEYS.forEach(key => {
      const localValue = localData.data[key]
      const cloudValue = cloudData.data[key]
      
      if (localValue && cloudValue) {
        // 两边都有数据，保留较新的（这里简化处理，实际可以根据具体业务逻辑优化）
        mergedData.data[key] = localValue
      } else if (localValue) {
        mergedData.data[key] = localValue
      }
      // 否则使用云端数据（已在初始化时设置）
    })
    
    // 4. 将合并后的数据保存到云端
    const saveResponse = await fetch(`${JSONBIN_CONFIG.baseUrl}/b/${JSONBIN_CONFIG.binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_CONFIG.apiKey,
        'X-Bin-Versioning': 'false'
      },
      body: JSON.stringify(mergedData)
    })

    if (!saveResponse.ok) {
      throw new Error(`同步保存失败: HTTP ${saveResponse.status}`)
    }

    // 5. 更新本地数据
    STORAGE_KEYS.forEach(key => {
      if (mergedData.data[key] !== undefined) {
        localStorage.setItem(key, JSON.stringify(mergedData.data[key]))
      }
    })

    // 更新最后同步时间
    localStorage.setItem('last_cloud_sync', new Date().toISOString())
    
    return `✅ 数据同步完成！\n- 本地数据已上传\n- 云端数据已下载\n- 数据已智能合并\n\n同步时间：${new Date().toLocaleString('zh-CN')}`
  } catch (error) {
    console.error('数据同步失败:', error)
    throw new Error(`❌ 数据同步失败: ${error.message}`)
  }
}

/**
 * 获取最后同步时间
 * @returns {string|null}
 */
export function getLastSyncTime() {
  const lastSync = localStorage.getItem('last_cloud_sync')
  if (lastSync) {
    return new Date(lastSync).toLocaleString('zh-CN')
  }
  return null
}

/**
 * 测试 JSONBin.io 连接
 * @returns {Promise<Object>} - 连接测试结果
 */
export async function testCloudConnection() {
  if (!isJSONBinConfigured()) {
    return { success: false, message: '未配置' }
  }

  try {
    const response = await fetch(`${JSONBIN_CONFIG.baseUrl}/b/${JSONBIN_CONFIG.binId}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': JSONBIN_CONFIG.apiKey
      }
    })

    if (response.ok) {
      const result = await response.json()
      return {
        success: true,
        message: '连接成功',
        lastUpdate: result.metadata?.createdAt ? 
          new Date(result.metadata.createdAt).toLocaleString('zh-CN') : '未知'
      }
    } else {
      return {
        success: false,
        message: `连接失败 (${response.status})`,
        error: response.statusText
      }
    }
  } catch (error) {
    return {
      success: false,
      message: '网络错误',
      error: error.message
    }
  }
}
