<template>
    <div class="user-management">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>用户管理</h3>
            <el-button type="primary" @click="handleAdd" v-if="hasPermission('USER_CREATE')">新增用户</el-button>
          </div>
        </template>
        
        <!-- 搜索区域 -->
        <div class="search-container">
          <el-input v-model="searchQuery" placeholder="搜索用户名或真实姓名" clearable @clear="fetchUsers" @keyup.enter="fetchUsers">
            <template #append>
              <el-button @click="fetchUsers">搜索</el-button>
            </template>
          </el-input>
        </div>
        
        <!-- 表格区域 -->
        <el-table :data="filterUsers" v-loading="loading" border style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="username" label="用户名" width="120" />
          <el-table-column prop="realName" label="真实姓名" width="120" />
          <el-table-column prop="email" label="邮箱" />
          <el-table-column prop="phone" label="手机号" width="120" />
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
                {{ scope.row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="角色" width="200">
            <template #default="scope">
              <el-tag v-for="role in scope.row.roles" :key="role.id" type="info" effect="plain" class="role-tag">
                {{ role.name.replace('ROLE_', '') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button type="primary" size="small" @click="handleEdit(scope.row)" v-if="hasPermission('USER_EDIT')">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDelete(scope.row)" v-if="hasPermission('USER_DELETE')">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      
      <!-- 用户表单对话框 -->
      <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
        <el-form ref="userFormRef" :model="userForm" :rules="userRules" label-width="100px">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="userForm.username" placeholder="请输入用户名" :disabled="isEdit"></el-input>
          </el-form-item>
          <el-form-item label="密码" prop="password" v-if="!isEdit">
            <el-input v-model="userForm.password" type="password" placeholder="请输入密码" show-password></el-input>
          </el-form-item>
          <el-form-item label="新密码" prop="password" v-else>
            <el-input v-model="userForm.password" type="password" placeholder="不修改请留空" show-password></el-input>
          </el-form-item>
          <el-form-item label="真实姓名" prop="realName">
            <el-input v-model="userForm.realName" placeholder="请输入真实姓名"></el-input>
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="userForm.email" placeholder="请输入邮箱"></el-input>
          </el-form-item>
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="userForm.phone" placeholder="请输入手机号"></el-input>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-switch v-model="userForm.status" :active-value="1" :inactive-value="0"></el-switch>
          </el-form-item>
          <el-form-item label="角色" prop="roleIds">
            <el-select v-model="userForm.roleIds" multiple placeholder="请选择角色" style="width: 100%">
              <el-option v-for="role in roles" :key="role.id" :label="role.name.replace('ROLE_', '')" :value="role.id"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
        </template>
      </el-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, reactive } from 'vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { getUsers, createUser, updateUser, deleteUser } from '@/api/user';
  import { getRoles } from '@/api/role';
  import { useAuthStore } from '@/store/auth';
  
  const authStore = useAuthStore();
  
  // 数据列表
  const users = ref([]);
  const roles = ref([]);
  const loading = ref(false);
  const searchQuery = ref('');
  
  // 对话框控制
  const dialogVisible = ref(false);
  const dialogTitle = ref('新增用户');
  const isEdit = ref(false);
  const submitLoading = ref(false);
  
  // 表单对象
  const userForm = reactive({
    id: null,
    username: '',
    password: '',
    realName: '',
    email: '',
    phone: '',
    status: 1,
    roleIds: []
  });
  
  // 表单校验规则
  const userRules = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 3, max: 50, message: '用户名长度必须在3-50个字符之间', trigger: 'blur' }
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' }
    ],
    realName: [
      { required: true, message: '请输入真实姓名', trigger: 'blur' }
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
    ],
    roleIds: [
      { required: true, message: '请选择角色', trigger: 'change' }
    ]
  };
  
  // 根据搜索条件过滤用户列表
  const filterUsers = computed(() => {
    if (!searchQuery.value) {
      return users.value;
    }
    const query = searchQuery.value.toLowerCase();
    return users.value.filter(user => {
      return user.username.toLowerCase().includes(query) || 
             (user.realName && user.realName.toLowerCase().includes(query));
    });
  });
  
  // 判断是否有权限
  const hasPermission = (permission) => {
    return authStore.hasPermission(permission);
  };
  
  // 获取用户列表
  const fetchUsers = async () => {
    loading.value = true;
    try {
      const response = await getUsers();
      users.value = response.data || [];
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      loading.value = false;
    }
  };
  
  // 获取角色列表
  const fetchRoles = async () => {
    try {
      const response = await getRoles();
      roles.value = response.data || [];
    } catch (error) {
      console.error('获取角色列表失败:', error);
    }
  };
  
  // 新增用户
  const handleAdd = () => {
    isEdit.value = false;
    dialogTitle.value = '新增用户';
    // 重置表单
    Object.assign(userForm, {
      id: null,
      username: '',
      password: '',
      realName: '',
      email: '',
      phone: '',
      status: 1,
      roleIds: []
    });
    dialogVisible.value = true;
  };
  
  // 编辑用户
  const handleEdit = (row) => {
    isEdit.value = true;
    dialogTitle.value = '编辑用户';
    
    // 填充表单
    Object.assign(userForm, {
      id: row.id,
      username: row.username,
      password: '', // 编辑时密码为空
      realName: row.realName,
      email: row.email,
      phone: row.phone,
      status: row.status,
      roleIds: row.roles ? row.roles.map(role => role.id) : []
    });
    
    dialogVisible.value = true;
  };
  
  // 删除用户
  const handleDelete = (row) => {
    ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        await deleteUser(row.id);
        ElMessage.success('删除成功');
        fetchUsers();
      } catch (error) {
        console.error('删除用户失败:', error);
      }
    }).catch(() => {});
  };
  
  // 提交表单
// 提交表单
const submitForm = async () => {
  // 添加表单验证
  if (userFormRef.value) {
    try {
      await userFormRef.value.validate();
      submitLoading.value = true;
      
      if (isEdit.value) {
        // 更新用户
        await updateUser(userForm.id, userForm);
        ElMessage.success('更新成功');
      } else {
        // 创建用户
        await createUser(userForm);
        ElMessage.success('创建成功');
      }
      dialogVisible.value = false;
      fetchUsers();
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      submitLoading.value = false;
    }
  }
};

  const userFormRef = ref(null);
  
  // 页面加载时获取数据
  onMounted(() => {
    fetchUsers();
    fetchRoles();
  });
  </script>
  
  <style scoped>
  .user-management {
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
  
  .search-container {
    margin-bottom: 20px;
    max-width: 500px;
  }
  
  .role-tag {
    margin-right: 5px;
    margin-bottom: 5px;
  }
  </style>