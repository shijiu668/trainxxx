<template>
    <div class="enterprise-list">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>企业管理</h3>
            <el-button type="primary" @click="handleAdd" v-if="hasPermission('USER_CREATE')">新增企业</el-button>
          </div>
        </template>
        
        <!-- 搜索区域 -->
        <div class="search-container">
          <el-input v-model="searchQuery" placeholder="搜索企业名称" clearable @clear="fetchEnterprises" @keyup.enter="fetchEnterprises">
            <template #append>
              <el-button @click="fetchEnterprises">搜索</el-button>
            </template>
          </el-input>
        </div>
        
        <!-- 表格区域 -->
        <el-table :data="filteredEnterprises" v-loading="loading" border style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="企业名称" min-width="150" />
          <el-table-column prop="contactPerson" label="联系人" width="120" />
          <el-table-column prop="contactPhone" label="联系电话" width="150" />
          <el-table-column prop="email" label="邮箱" min-width="150" />
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
                {{ scope.row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="250" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" @click="handleView(scope.row)">查看</el-button>
              <el-button type="success" size="small" @click="handleEdit(scope.row)" v-if="hasPermission('USER_EDIT')">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDelete(scope.row)" v-if="hasPermission('USER_DELETE')">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      
      <!-- 企业表单对话框 -->
      <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
        <el-form ref="enterpriseFormRef" :model="enterpriseForm" :rules="enterpriseRules" label-width="100px">
          <el-form-item label="企业名称" prop="name">
            <el-input v-model="enterpriseForm.name" placeholder="请输入企业名称"></el-input>
          </el-form-item>
          <el-form-item label="企业描述" prop="description">
            <el-input v-model="enterpriseForm.description" type="textarea" rows="3" placeholder="请输入企业描述"></el-input>
          </el-form-item>
          <el-form-item label="联系人" prop="contactPerson">
            <el-input v-model="enterpriseForm.contactPerson" placeholder="请输入联系人"></el-input>
          </el-form-item>
          <el-form-item label="联系电话" prop="contactPhone">
            <el-input v-model="enterpriseForm.contactPhone" placeholder="请输入联系电话"></el-input>
          </el-form-item>
          <el-form-item label="企业地址" prop="address">
            <el-input v-model="enterpriseForm.address" placeholder="请输入企业地址"></el-input>
          </el-form-item>
          <el-form-item label="电子邮箱" prop="email">
            <el-input v-model="enterpriseForm.email" placeholder="请输入电子邮箱"></el-input>
          </el-form-item>
          <el-form-item label="企业网站" prop="website">
            <el-input v-model="enterpriseForm.website" placeholder="请输入企业网站"></el-input>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-switch v-model="enterpriseForm.status" :active-value="1" :inactive-value="0"></el-switch>
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
  import { useRouter } from 'vue-router';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { getEnterprises, createEnterprise, updateEnterprise, deleteEnterprise } from '@/api/enterprise';
  import { useAuthStore } from '@/store/auth';
  
  const router = useRouter();
  const authStore = useAuthStore();
  
  // 数据列表
  const enterprises = ref([]);
  const loading = ref(false);
  const searchQuery = ref('');
  
  // 对话框控制
  const dialogVisible = ref(false);
  const dialogTitle = ref('新增企业');
  const isEdit = ref(false);
  const submitLoading = ref(false);
  
  // 表单对象
  const enterpriseForm = reactive({
    id: null,
    name: '',
    description: '',
    contactPerson: '',
    contactPhone: '',
    address: '',
    email: '',
    website: '',
    status: 1
  });
  
  // 表单校验规则
  const enterpriseRules = {
    name: [
      { required: true, message: '请输入企业名称', trigger: 'blur' },
      { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
    ],
    contactPerson: [
      { required: true, message: '请输入联系人', trigger: 'blur' }
    ],
    contactPhone: [
      { required: true, message: '请输入联系电话', trigger: 'blur' }
    ],
    email: [
      { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
    ]
  };
  
  // 表单引用
  const enterpriseFormRef = ref(null);
  
  // 根据搜索条件过滤企业列表
  const filteredEnterprises = computed(() => {
    if (!searchQuery.value) {
      return enterprises.value;
    }
    const query = searchQuery.value.toLowerCase();
    return enterprises.value.filter(enterprise => {
      return enterprise.name.toLowerCase().includes(query);
    });
  });
  
  // 判断是否有权限
  const hasPermission = (permission) => {
    return authStore.hasPermission(permission);
  };
  
  // 获取企业列表
  const fetchEnterprises = async () => {
    loading.value = true;
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
    } finally {
      loading.value = false;
    }
  };
  
  // 新增企业
  const handleAdd = () => {
    isEdit.value = false;
    dialogTitle.value = '新增企业';
    
    // 重置表单
    Object.assign(enterpriseForm, {
      id: null,
      name: '',
      description: '',
      contactPerson: '',
      contactPhone: '',
      address: '',
      email: '',
      website: '',
      status: 1
    });
    
    dialogVisible.value = true;
  };
  
  // 查看企业详情
  const handleView = (row) => {
    router.push(`/enterprises/${row.id}`);
  };
  
  // 编辑企业
  const handleEdit = (row) => {
    isEdit.value = true;
    dialogTitle.value = '编辑企业';
    
    // 填充表单
    Object.assign(enterpriseForm, {
      id: row.id,
      name: row.name,
      description: row.description,
      contactPerson: row.contactPerson,
      contactPhone: row.contactPhone,
      address: row.address,
      email: row.email,
      website: row.website,
      status: row.status
    });
    
    dialogVisible.value = true;
  };
  
  // 删除企业
  const handleDelete = (row) => {
    ElMessageBox.confirm('删除企业将同时删除关联的导师和项目模板，确定要删除吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        const response = await deleteEnterprise(row.id);
        if (response.code === 200) {
          ElMessage.success('删除成功');
          fetchEnterprises();
        } else {
          ElMessage.error(response.message || '删除失败');
        }
      } catch (error) {
        console.error('删除企业失败:', error);
        ElMessage.error('删除企业失败');
      }
    }).catch(() => {});
  };
  
// 提交表单
const submitForm = async () => {
  if (enterpriseFormRef.value) {
    try {
      await enterpriseFormRef.value.validate();
      
      submitLoading.value = true;
      
      let response;
      if (isEdit.value) {
        response = await updateEnterprise(enterpriseForm.id, enterpriseForm);
      } else {
        response = await createEnterprise(enterpriseForm);
      }
      
      if (response.code === 200) {
        ElMessage.success(isEdit.value ? '更新成功' : '创建成功');
        dialogVisible.value = false;
        fetchEnterprises();
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
  fetchEnterprises();
});
</script>

<style scoped>
.enterprise-list {
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
</style>