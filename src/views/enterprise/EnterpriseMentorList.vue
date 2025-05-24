<template>
    <div class="mentor-list">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>企业导师管理</h3>
            <el-button type="primary" @click="handleAdd" v-if="hasPermission('USER_CREATE')">新增导师</el-button>
          </div>
        </template>
        
        <!-- 搜索区域 -->
        <div class="search-bar">
          <el-input v-model="searchQuery" placeholder="搜索导师姓名或职位" clearable @clear="fetchMentors" @keyup.enter="fetchMentors">
            <template #append>
              <el-button @click="fetchMentors">搜索</el-button>
            </template>
          </el-input>
          <el-select v-model="filterEnterprise" placeholder="所属企业" clearable @change="fetchMentors">
            <el-option v-for="enterprise in enterprises" :key="enterprise.id" :label="enterprise.name" :value="enterprise.id"></el-option>
          </el-select>
        </div>
        
        <!-- 表格区域 -->
        <el-table :data="filteredMentors" v-loading="loading" border style="width: 100%">
          <el-table-column label="导师姓名" min-width="120">
            <template #default="scope">
              {{ scope.row.user ? scope.row.user.realName : '未知' }}
            </template>
          </el-table-column>
          <el-table-column label="所属企业" min-width="150">
            <template #default="scope">
              {{ scope.row.enterprise ? scope.row.enterprise.name : '未知' }}
            </template>
          </el-table-column>
          <el-table-column prop="position" label="职位" min-width="120" />
          <el-table-column prop="expertise" label="专业领域" min-width="150" />
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
                {{ scope.row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" @click="handleEdit(scope.row)" v-if="hasPermission('USER_EDIT')">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDelete(scope.row)" v-if="hasPermission('USER_DELETE')">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      
      <!-- 导师表单对话框 -->
      <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
        <el-form ref="mentorFormRef" :model="mentorForm" :rules="mentorRules" label-width="100px">
          <el-form-item label="所属企业" prop="enterpriseId">
            <el-select v-model="mentorForm.enterpriseId" filterable placeholder="请选择企业" style="width: 100%">
              <el-option v-for="enterprise in enterprises" :key="enterprise.id" :label="enterprise.name" :value="enterprise.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="用户" prop="userId">
            <el-select v-model="mentorForm.userId" filterable placeholder="请选择用户" style="width: 100%">
              <el-option v-for="user in users" :key="user.id" :label="user.realName" :value="user.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="职位" prop="position">
            <el-input v-model="mentorForm.position" placeholder="请输入职位"></el-input>
          </el-form-item>
          <el-form-item label="专业领域" prop="expertise">
            <el-input v-model="mentorForm.expertise" placeholder="请输入专业领域"></el-input>
          </el-form-item>
          <el-form-item label="个人介绍" prop="introduction">
            <el-input v-model="mentorForm.introduction" type="textarea" rows="3" placeholder="请输入个人介绍"></el-input>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-switch v-model="mentorForm.status" :active-value="1" :inactive-value="0"></el-switch>
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
  import { getEnterpriseMentors, createEnterpriseMentor, updateEnterpriseMentor, deleteEnterpriseMentor } from '@/api/enterpriseMentor';
  import { getEnterprises } from '@/api/enterprise';
  import { getUsers } from '@/api/user';
  import { useAuthStore } from '@/store/auth';
  
  const authStore = useAuthStore();
  
  // 数据列表
  const mentors = ref([]);
  const enterprises = ref([]);
  const users = ref([]);
  const loading = ref(false);
  const searchQuery = ref('');
  const filterEnterprise = ref('');
  
  // 对话框控制
  const dialogVisible = ref(false);
  const dialogTitle = ref('新增企业导师');
  const isEdit = ref(false);
  const submitLoading = ref(false);
  
  // 表单对象
  const mentorForm = reactive({
    id: null,
    enterpriseId: null,
    userId: null,
    position: '',
    expertise: '',
    introduction: '',
    status: 1
  });
  
  // 表单校验规则
  const mentorRules = {
    enterpriseId: [
      { required: true, message: '请选择企业', trigger: 'change' }
    ],
    userId: [
      { required: true, message: '请选择用户', trigger: 'change' }
    ],
    position: [
      { required: true, message: '请输入职位', trigger: 'blur' }
    ]
  };
  
  // 表单引用
  const mentorFormRef = ref(null);
  
  // 根据搜索条件过滤导师列表
  const filteredMentors = computed(() => {
    let result = mentors.value;
    
    // 按企业筛选
    if (filterEnterprise.value) {
      result = result.filter(mentor => mentor.enterpriseId === filterEnterprise.value);
    }
    
    // 按关键词搜索
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter(mentor => {
        const userName = mentor.user && mentor.user.realName ? mentor.user.realName.toLowerCase() : '';
        const position = mentor.position ? mentor.position.toLowerCase() : '';
        return userName.includes(query) || position.includes(query);
      });
    }
    
    return result;
  });
  
  // 判断是否有权限
  const hasPermission = (permission) => {
    return authStore.hasPermission(permission);
  };
  
  // 获取导师列表
  const fetchMentors = async () => {
    loading.value = true;
    try {
      const response = await getEnterpriseMentors();
      if (response.code === 200) {
        mentors.value = response.data || [];
      } else {
        ElMessage.error(response.message || '获取企业导师列表失败');
      }
    } catch (error) {
      console.error('获取企业导师列表失败:', error);
      ElMessage.error('获取企业导师列表失败');
    } finally {
      loading.value = false;
    }
  };
  
  // 获取企业列表
  const fetchEnterprises = async () => {
    try {
      const response = await getEnterprises();
      if (response.code === 200) {
        enterprises.value = response.data || [];
      } else {
        ElMessage.error(response.message || '获取企业列表失败');
      }
    } catch (error) {
      console.error('获取企业列表失败:', error);
      ElMessage.error('获取企业列表失败');
    }
  };
  
  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      if (response.code === 200) {
        users.value = response.data || [];
      } else {
        ElMessage.error(response.message || '获取用户列表失败');
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      ElMessage.error('获取用户列表失败');
    }
  };
  
  // 新增导师
  const handleAdd = () => {
    isEdit.value = false;
    dialogTitle.value = '新增企业导师';
    
    // 重置表单
    Object.assign(mentorForm, {
      id: null,
      enterpriseId: null,
      userId: null,
      position: '',
      expertise: '',
      introduction: '',
      status: 1
    });
    
    dialogVisible.value = true;
  };
  
  // 编辑导师
  const handleEdit = (row) => {
    isEdit.value = true;
    dialogTitle.value = '编辑企业导师';
    
    // 填充表单
    Object.assign(mentorForm, {
      id: row.id,
      enterpriseId: row.enterpriseId,
      userId: row.userId,
      position: row.position,
      expertise: row.expertise,
      introduction: row.introduction,
      status: row.status
    });
    
    dialogVisible.value = true;
  };
  
  // 删除导师
  const handleDelete = (row) => {
    ElMessageBox.confirm('确定要删除该企业导师吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        const response = await deleteEnterpriseMentor(row.id);
        if (response.code === 200) {
          ElMessage.success('删除成功');
          fetchMentors();
        } else {
          ElMessage.error(response.message || '删除失败');
        }
      } catch (error) {
        console.error('删除企业导师失败:', error);
        ElMessage.error('删除企业导师失败');
      }
    }).catch(() => {});
  };
  
  // 提交表单
  const submitForm = async () => {
    if (mentorFormRef.value) {
      try {
        await mentorFormRef.value.validate();
        
        submitLoading.value = true;
        
        let response;
        if (isEdit.value) {
          response = await updateEnterpriseMentor(mentorForm.id, mentorForm);
        } else {
          response = await createEnterpriseMentor(mentorForm);
        }
        
        if (response.code === 200) {
          ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
          dialogVisible.value = false;
          fetchMentors();
        } else {
          ElMessage.error(response.message || (isEdit.value ? '更新失败' : '创建失败'));
        }
      } catch (error) {
        console.error('表单提交错误:', error);
        ElMessage.error('操作失败，请检查表单数据');
      } finally {
        submitLoading.value = false;
      }
    }
  };
  
  // 页面加载时获取数据
  onMounted(() => {
    fetchMentors();
    fetchEnterprises();
    fetchUsers();
  });
  </script>
  
  <style scoped>
  .mentor-list {
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
  
  .search-bar {
    display: flex;
    margin-bottom: 20px;
    gap: 10px;
  }
  
  .search-bar .el-input {
    width: 300px;
  }
  </style>