<template>
  <div class="permission-manage">
    <el-page-header 
      content="权限管理" 
      @back="router.back()"
    />

    <el-card>
      <template #header>
        <span>角色权限配置</span>
      </template>
      <el-table 
        :data="permissionTableData" 
        border 
        stripe 
        style="width: 100%;"
      >
        <el-table-column prop="roleName" label="角色" width="120" />
        <el-table-column prop="permissionName" label="权限名称" width="200" />
        <el-table-column prop="permissionCode" label="权限码" width="200" />
        <el-table-column label="是否拥有" width="120">
          <template #default="scope">
            <el-switch 
              v-model="scope.row.hasPermission" 
              @change="handlePermissionChange(scope.row)"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBookStore, PERMISSIONS, ROLE_PERMISSIONS } from '../pinia/store'
import { ElMessage } from 'element-plus'

const router = useRouter()
const bookStore = useBookStore()

// 权限名称映射
const PERMISSION_NAMES = {
  [PERMISSIONS.BOOK_PUBLISH]: '发布书籍',
  [PERMISSIONS.BOOK_EDIT_OWN]: '编辑自己的书籍',
  [PERMISSIONS.BOOK_EDIT_ALL]: '编辑所有书籍',
  [PERMISSIONS.BOOK_OFFSALE_OWN]: '下架自己的书籍',
  [PERMISSIONS.BOOK_OFFSALE_ALL]: '下架所有书籍',
  [PERMISSIONS.BOOK_AUDIT]: '审核书籍',
  [PERMISSIONS.TRADE_CREATE]: '创建交易',
  [PERMISSIONS.TRADE_MANAGE_OWN]: '管理自己的交易',
  [PERMISSIONS.TRADE_MANAGE_ALL]: '管理所有交易',
  [PERMISSIONS.DATA_VIEW]: '查看数据看板',
  [PERMISSIONS.PERMISSION_MANAGE]: '管理权限'
}

// 构造权限表格数据
const permissionTableData = ref([])
const initPermissionTable = () => {
  const data = []
  // 遍历所有角色
  bookStore.roleList.forEach(role => {
    // 遍历所有权限
    Object.entries(PERMISSIONS).forEach(([key, code]) => {
      data.push({
        roleId: role.id,
        roleName: role.name,
        permissionCode: code,
        permissionName: PERMISSION_NAMES[code],
        hasPermission: (ROLE_PERMISSIONS[role.id] || []).includes(code)
      })
    })
  })
  permissionTableData.value = data
}

// 权限修改（模拟，实际项目需对接后端）
const handlePermissionChange = (row) => {
  ElMessage.info(`【${row.roleName}】的【${row.permissionName}】权限已${row.hasPermission ? '开启' : '关闭'}（仅前端模拟，实际需同步后端）`)
}

onMounted(() => {
  initPermissionTable()
})
</script>

<style scoped>
.permission-manage {
  padding: 0;
}
</style>