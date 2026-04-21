/**
 * Supabase 云端数据同步模块
 * 用于在不同设备间同步 LocalStorage 数据
 * 
 * 使用教程：
 * 1. 访问 https://supabase.com/ 注册账号
 * 2. 创建项目，获取 Project URL 和 anon key
 * 3. 在个人中心配置凭证
 * 4. 使用上传/下载/同步功能
 */

import { createClient } from '@supabase/supabase-js'

// Supabase 配置
const SUPABASE_CONFIG = {
  url: localStorage.getItem('supabase_url') || '',
  anonKey: localStorage.getItem('supabase_anon_key') || ''
}

// 定义需要备份的 LocalStorage 键名
const STORAGE_KEYS = [
  'campus_book_books',           // 书籍数据
  'campus_book_users',           // 用户数据
  'campus_book_transactions',    // 交易数据
  'campus_book_cart',            // 购物车数据
  'campus_book_carousel_books',  // 轮播图数据
  'campus_book_current_user',    // 当前登录用户
]

// Supabase 客户端实例
let supabase = null

/**
 * 初始化 Supabase 客户端
 */
function initSupabase() {
  if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
    throw new Error('请先配置 Supabase（在设置中填写 Project URL 和 anon key）')
  }
  
  try {
    supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
    console.log('✅ Supabase 初始化成功')
  } catch (error) {
    console.error('❌ Supabase 初始化失败:', error)
    throw new Error(`Supabase 初始化失败: ${error.message}`)
  }
}

/**
 * 设置 Supabase 配置
 * @param {string} url - 你的 Project URL
 * @param {string} anonKey - 你的 anon key
 */
export function setSupabaseConfig(url, anonKey) {
  if (!url || !anonKey) {
    throw new Error('Project URL 和 anon key 都不能为空')
  }
  
  localStorage.setItem('supabase_url', url)
  localStorage.setItem('supabase_anon_key', anonKey)
  
  SUPABASE_CONFIG.url = url
  SUPABASE_CONFIG.anonKey = anonKey
  
  // 重新初始化
  supabase = null
  initSupabase()
  
  return '配置已保存'
}

/**
 * 清除 Supabase 配置
 */
export function clearSupabaseConfig() {
  localStorage.removeItem('supabase_url')
  localStorage.removeItem('supabase_anon_key')
  
  SUPABASE_CONFIG.url = ''
  SUPABASE_CONFIG.anonKey = ''
  
  supabase = null
  
  return '配置已清除'
}

/**
 * 检查 Supabase 是否已配置
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
  return !!(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey)
}

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
 * 保存数据到 Supabase 云端
 * @returns {Promise<string>} - 操作结果消息
 */
export async function saveToCloud() {
  if (!supabase) initSupabase()
  
  try {
    const localData = collectLocalData()
    
    // 先查询是否已存在数据
    const { data: existingData, error: queryError } = await supabase
      .from('app_data')
      .select('id')
      .eq('data_type', 'main')
      .single()
    
    if (queryError && queryError.code !== 'PGRST116') {
      // PGRST116 表示未找到数据，这是正常的
      throw queryError
    }
    
    const record = {
      data_type: 'main',
      data: localData.data,
      version: localData.version,
      updated_at: new Date().toISOString()
    }
    
    let error
    if (existingData) {
      // 更新现有记录
      const { error: updateError } = await supabase
        .from('app_data')
        .update(record)
        .eq('id', existingData.id)
      error = updateError
    } else {
      // 插入新记录
      const { error: insertError } = await supabase
        .from('app_data')
        .insert(record)
      error = insertError
    }
    
    if (error) throw error
    
    // 保存最后同步时间
    localStorage.setItem('last_cloud_sync', new Date().toISOString())
    
    return `✅ 数据已成功保存到云端\n更新时间：${new Date().toLocaleString('zh-CN')}`
  } catch (error) {
    console.error('云端保存失败:', error)
    throw new Error(`❌ 云端保存失败: ${error.message}\n\n可能的原因:\n1. 网络连接问题\n2. Project URL 或 anon key 错误\n3. 数据库表未创建`)
  }
}

/**
 * 从 Supabase 云端加载数据
 * @param {boolean} force - 是否强制覆盖（默认会提示确认）
 * @returns {Promise<string>} - 操作结果消息
 */
export async function loadFromCloud(force = false) {
  if (!supabase) initSupabase()
  
  try {
    const { data: cloudData, error } = await supabase
      .from('app_data')
      .select('*')
      .eq('data_type', 'main')
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('云端暂无数据，请先上传数据')
      }
      throw error
    }
    
    if (!cloudData || !cloudData.data) {
      throw new Error('云端数据格式无效或为空')
    }
    
    // 显示云端数据信息
    const cloudInfo = `
📦 云端数据信息：
- 版本：${cloudData.version || '未知'}
- 最后更新：${cloudData.updated_at ? new Date(cloudData.updated_at).toLocaleString('zh-CN') : '未知'}
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
  if (!supabase) initSupabase()
  
  try {
    // 1. 先获取云端数据
    const { data: cloudData, error } = await supabase
      .from('app_data')
      .select('*')
      .eq('data_type', 'main')
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    // 2. 收集本地数据
    const localData = collectLocalData()
    
    // 3. 智能合并策略：以本地数据为优先
    let mergedData
    if (!cloudData) {
      // 云端没有数据，直接上传本地数据
      mergedData = localData.data
    } else {
      mergedData = { ...cloudData.data }  // 以云端数据为基础
      
      STORAGE_KEYS.forEach(key => {
        const localValue = localData.data[key]
        const cloudValue = cloudData.data[key]
        
        if (localValue && cloudValue) {
          // 两边都有数据，保留本地的（假设本地是最新的）
          mergedData[key] = localValue
        } else if (localValue) {
          mergedData[key] = localValue
        }
        // 否则使用云端数据（已在初始化时设置）
      })
    }
    
    // 4. 将合并后的数据保存到云端
    const record = {
      data_type: 'main',
      data: mergedData,
      version: localData.version,
      updated_at: new Date().toISOString()
    }
    
    if (cloudData) {
      const { error: updateError } = await supabase
        .from('app_data')
        .update(record)
        .eq('id', cloudData.id)
      if (updateError) throw updateError
    } else {
      const { error: insertError } = await supabase
        .from('app_data')
        .insert(record)
      if (insertError) throw insertError
    }
    
    // 5. 更新本地数据
    STORAGE_KEYS.forEach(key => {
      if (mergedData[key] !== undefined) {
        localStorage.setItem(key, JSON.stringify(mergedData[key]))
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
 * 测试 Supabase 连接
 * @returns {Promise<Object>} - 连接测试结果
 */
export async function testCloudConnection() {
  if (!isSupabaseConfigured()) {
    return { success: false, message: '未配置' }
  }
  
  try {
    if (!supabase) initSupabase()
    
    // 尝试查询数据
    const { data, error } = await supabase
      .from('app_data')
      .select('*')
      .eq('data_type', 'main')
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    return {
      success: true,
      message: '连接成功',
      hasData: !!data,
      lastUpdate: data && data.updated_at ? 
        new Date(data.updated_at).toLocaleString('zh-CN') : '暂无数据'
    }
  } catch (error) {
    return {
      success: false,
      message: `连接失败: ${error.message}`,
      error: error.message
    }
  }
}

/**
 * 获取云端数据大小
 * @returns {Promise<string>} - 数据大小描述
 */
export async function getCloudDataSize() {
  if (!supabase) initSupabase()
  
  try {
    const { data, error } = await supabase
      .from('app_data')
      .select('data')
      .eq('data_type', 'main')
      .single()
    
    if (error || !data) {
      return '云端暂无数据'
    }
    
    const dataSize = JSON.stringify(data.data).length
    
    // 转换为可读格式
    if (dataSize < 1024) {
      return `${dataSize} 字节`
    } else if (dataSize < 1024 * 1024) {
      return `${(dataSize / 1024).toFixed(2)} KB`
    } else {
      return `${(dataSize / 1024 / 1024).toFixed(2)} MB`
    }
  } catch (error) {
    return `获取失败: ${error.message}`
  }
}
