<template>
    <div class="role-management">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>角色管理</h3>
            <el-button type="primary" @click="handleAdd" v-if="hasPermission('ROLE_ASSIGN')">新增角色</el-button>
          </div>
        </template>
        
        <!-- 表格区域 -->
        <el-table :data="roles" v-loading="loading" border style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="角色名称" width="200">
            <template #default="scope">
              {{ scope.row.name.replace('ROLE_', '') }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" />
          <el-table-column label="权限" min-width="300">
            <template #default="scope">
              <el-tag v-for="permission in scope.row.permissions" :key="permission.id" type="info" effect="plain" class="permission-tag">
                {{ permission.description }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="250">
            <template #default="scope">
              <el-button type="primary" size="small" @click="handleEdit(scope.row)" v-if="hasPermission('ROLE_ASSIGN')">编辑</el-button>
              <el-button type="success" size="small" @click="handlePermissions(scope.row)" v-if="hasPermission('ROLE_ASSIGN')">分配权限</el-button>
              <el-button type="danger" size="small" @click="handleDelete(scope.row)" v-if="hasPermission('ROLE_ASSIGN')">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      
      <!-- 角色表单对话框 -->
      <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
        <el-form ref="roleFormRef" :model="roleForm" :rules="roleRules" label-width="100px">
          <el-form-item label="角色名称" prop="name">
            <el-input v-model="roleForm.name" placeholder="请输入角色名称，如：ROLE_STUDENT"></el-input>
          </el-form-item>
          <el-form-item label="描述" prop="description">
            <el-input v-model="roleForm.description" placeholder="请输入角色描述"></el-input>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitRoleForm" :loading="submitLoading">确定</el-button>
        </template>
      </el-dialog>
      
      <!-- 权限分配对话框 -->
      <el-dialog title="分配权限" v-model="permissionDialogVisible" width="500px">
        <div v-loading="permissionsLoading">
          <el-checkbox-group v-model="selectedPermissions">
            <el-checkbox v-for="permission in permissions" :key="permission.id" :label="permission.id">
              {{ permission.description }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
        <template #footer>
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitPermissions" :loading="submitPermissionsLoading">确定</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted } from 'vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { getRoles, createRole, updateRole, deleteRole, assignPermissions } from '@/api/role';
  import { getPermissions } from '@/api/permission';
  import { useAuthStore } from '@/store/auth';
  
  const authStore = useAuthStore();
  
  // 数据列表
  const roles = ref([]);
  const permissions = ref([]);
  const loading = ref(false);
  const permissionsLoading = ref(false);
  
  // 角色对话框控制
  const dialogVisible = ref(false);
  const dialogTitle = ref('新增角色');
  const isEdit = ref(false);
  const submitLoading = ref(false);
  
  // 权限对话框控制
  const permissionDialogVisible = ref(false);
  const selectedPermissions = ref([]);
  const currentRoleId = ref(null);
  const submitPermissionsLoading = ref(false);
  const roleFormRef = ref(null);
  
  // 角色表单对象
  const roleForm = reactive({
    id: null,
    name: '',
    description: ''
  });
  
  // 表单校验规则
  const roleRules = {
    name: [
      { required: true, message: '请输入角色名称', trigger: 'blur' }
    ],
    description: [
      { required: true, message: '请输入角色描述', trigger: 'blur' }
    ]
  };
  
  // 判断是否有权限
  const hasPermission = (permission) => {
    return authStore.hasPermission(permission);
  };
  
  // 获取角色列表
  const fetchRoles = async () => {
    loading.value = true;
    try {
      const response = await getRoles();
      roles.value = response.data || [];
    } catch (error) {
      console.error('获取角色列表失败:', error);
    } finally {
      loading.value = false;
    }
  };
  
  // 获取权限列表
  const fetchPermissions = async () => {
    permissionsLoading.value = true;
    try {
      const response = await getPermissions();
      permissions.value = response.data || [];
    } catch (error) {
      console.error('获取权限列表失败:', error);
    } finally {
      permissionsLoading.value = false;
    }
  };
  
  // 新增角色
  const handleAdd = () => {
    isEdit.value = false;
    dialogTitle.value = '新增角色';
    // 重置表单
    Object.assign(roleForm, {
      id: null,
      name: '',
      description: ''
    });
    dialogVisible.value = true;
  };
  
  // 编辑角色
  const handleEdit = (row) => {
    isEdit.value = true;
    dialogTitle.value = '编辑角色';
    
    // 填充表单
    Object.assign(roleForm, {
      id: row.id,
      name: row.name,
      description: row.description
    });
    
    dialogVisible.value = true;
  };
  
  // 删除角色
  const handleDelete = (row) => {
    ElMessageBox.confirm('确定要删除该角色吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        await deleteRole(row.id);
        ElMessage.success('删除成功');
        fetchRoles();
      } catch (error) {
        console.error('删除角色失败:', error);
      }
    }).catch(() => {});
  };
  
  // 分配权限
  const handlePermissions = (row) => {
    currentRoleId.value = row.id;
    
    // 初始化已选权限
    selectedPermissions.value = row.permissions ? row.permissions.map(permission => permission.id) : [];
    
    // 确保权限列表已加载
    if (permissions.value.length === 0) {
      fetchPermissions().then(() => {
        permissionDialogVisible.value = true;
      });
    } else {
      permissionDialogVisible.value = true;
    }
  };
  
  // 提交角色表单
// 提交角色表单
const submitRoleForm = async () => {
  // 添加表单验证
  if (roleFormRef.value) {
    try {
      await roleFormRef.value.validate();
      submitLoading.value = true;
      
      if (isEdit.value) {
        // 更新角色
        await updateRole(roleForm.id, roleForm);
        ElMessage.success('更新成功');
      } else {
        // 创建角色
        await createRole(roleForm);
        ElMessage.success('创建成功');
      }
      dialogVisible.value = false;
      fetchRoles();
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      submitLoading.value = false;
    }
  }
};
  
  // 提交权限分配
  const submitPermissions = async () => {
    submitPermissionsLoading.value = true;
    try {
      await assignPermissions(currentRoleId.value, selectedPermissions.value);
      ElMessage.success('权限分配成功');
      permissionDialogVisible.value = false;
      fetchRoles();
    } catch (error) {
      console.error('权限分配失败:', error);
    } finally {
      submitPermissionsLoading.value = false;
    }
  };
  
  // 页面加载时获取数据
  onMounted(() => {
    fetchRoles();
    fetchPermissions();
  });
  </script>
  
  <style scoped>
  .role-management {
    padding: 20px 0;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .card-header h3 {
    margin: 0;
  }
  
  .permission-tag {
    margin-right: 5px;
    margin-bottom: 5px;
  }
  </style>