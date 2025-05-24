<!-- 11. TeachingResourceList.vue -->
<template>
    <div class="teaching-resource-list">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>教学资源管理</h3>
            <el-button type="primary" @click="handleAdd" v-if="hasPermission('USER_EDIT')">上传资源</el-button>
          </div>
        </template>
        
        <!-- 搜索和过滤 -->
        <div class="search-bar">
          <el-input v-model="searchQuery" placeholder="搜索资源名称" clearable @clear="fetchResources" @keyup.enter="search">
            <template #append>
              <el-button @click="search">搜索</el-button>
            </template>
          </el-input>
          <el-select v-model="resourceType" placeholder="资源类型" clearable @change="search">
            <el-option label="全部" value=""></el-option>
            <el-option label="课程资源" value="COURSE"></el-option>
            <el-option label="教学文档" value="DOCUMENT"></el-option>
          </el-select>
        </div>
        
        <!-- 资源列表标签页 -->
        <el-tabs v-model="activeTab" @tab-click="handleTabClick">
          <el-tab-pane label="全部资源" name="all"></el-tab-pane>
          <el-tab-pane label="课程资源" name="COURSE"></el-tab-pane>
          <el-tab-pane label="教学文档" name="DOCUMENT"></el-tab-pane>
        </el-tabs>
        
        <!-- 资源列表 -->
        <el-table :data="resources" v-loading="loading" border style="width: 100%">
          <el-table-column prop="title" label="资源名称" min-width="200" />
          <el-table-column prop="description" label="描述" min-width="300" show-overflow-tooltip />
          <el-table-column label="资源类型" width="120">
            <template #default="scope">
              <el-tag :type="scope.row.resourceType === 'COURSE' ? 'success' : 'info'">
                {{ scope.row.resourceType === 'COURSE' ? '课程资源' : '教学文档' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="文件类型" width="120">
            <template #default="scope">
              <el-tag>{{ getFileTypeLabel(scope.row.fileType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="文件大小" width="120">
            <template #default="scope">
              {{ formatFileSize(scope.row.fileSize) }}
            </template>
          </el-table-column>
          <el-table-column label="上传者" width="120">
            <template #default="scope">
              {{ scope.row.uploader ? scope.row.uploader.realName : '未知' }}
            </template>
          </el-table-column>
          <el-table-column label="上传时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" @click="handleDownload(scope.row)">下载</el-button>
              <el-button type="info" size="small" @click="handleEdit(scope.row)" v-if="hasPermission('USER_EDIT')">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDelete(scope.row)" v-if="hasPermission('USER_DELETE')">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      
      <!-- 资源表单对话框 -->
      <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
        <el-form ref="resourceFormRef" :model="resourceForm" :rules="resourceRules" label-width="100px">
          <el-form-item label="资源名称" prop="title">
            <el-input v-model="resourceForm.title" placeholder="请输入资源名称"></el-input>
          </el-form-item>
          <el-form-item label="资源描述" prop="description">
            <el-input v-model="resourceForm.description" type="textarea" rows="3" placeholder="请输入资源描述"></el-input>
          </el-form-item>
          <el-form-item label="资源类型" prop="resourceType">
            <el-select v-model="resourceForm.resourceType" placeholder="请选择资源类型" style="width: 100%">
              <el-option label="课程资源" value="COURSE"></el-option>
              <el-option label="教学文档" value="DOCUMENT"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="上传文件" prop="file" v-if="!isEdit">
            <el-upload
              class="upload-demo"
              :action="'#'"
              :auto-upload="false"
              :limit="1"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :file-list="fileList"
            >
              <el-button type="primary">选择文件</el-button>
              <template #tip>
                <div class="el-upload__tip">
                  支持各种格式的文件上传，单个文件不超过100MB
                </div>
              </template>
            </el-upload>
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
  import { ref, reactive, onMounted, computed } from 'vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { 
    getTeachingResources, 
    createTeachingResource, 
    updateTeachingResource, 
    deleteTeachingResource,
    downloadTeachingResource 
  } from '@/api/teachingResource';
  import { useAuthStore } from '@/store/auth';
  
  const authStore = useAuthStore();
  const resourceFormRef = ref(null);
  
  // 数据列表
  const resources = ref([]);
  const loading = ref(false);
  const searchQuery = ref('');
  const resourceType = ref('');
  const activeTab = ref('all');
  
  // 对话框控制
  const dialogVisible = ref(false);
  const dialogTitle = ref('上传资源');
  const isEdit = ref(false);
  const submitLoading = ref(false);
  const fileList = ref([]);
  
  // 表单对象
  const resourceForm = reactive({
    id: null,
    title: '',
    description: '',
    resourceType: 'DOCUMENT',
    file: null
  });
  
  // 表单校验规则
  const resourceRules = {
    title: [
      { required: true, message: '请输入资源名称', trigger: 'blur' }
    ],
    resourceType: [
      { required: true, message: '请选择资源类型', trigger: 'change' }
    ],
    file: [
      { required: true, message: '请上传文件', trigger: 'change' }
    ]
  };
  
  // 判断是否有权限
  const hasPermission = (permission) => {
    return authStore.hasPermission(permission);
  };
  
  // 获取资源列表
  const fetchResources = async () => {
    loading.value = true;
    try {
      const params = {};
      
      if (searchQuery.value) {
        params.keyword = searchQuery.value;
      }
      
      if (activeTab.value !== 'all') {
        params.resourceType = activeTab.value;
      }
      
      const response = await getTeachingResources(params);
      if (response.code === 200) {
        resources.value = response.data || [];
      } else {
        ElMessage.error(response.message || '获取资源列表失败');
      }
    } catch (error) {
      console.error('获取资源列表失败:', error);
      ElMessage.error('获取资源列表失败');
    } finally {
      loading.value = false;
    }
  };
  
  // 搜索资源
  const search = () => {
    fetchResources();
  };
  
  // 处理标签页切换
  const handleTabClick = () => {
    resourceType.value = activeTab.value === 'all' ? '' : activeTab.value;
    fetchResources();
  };
  
  // 添加资源
  const handleAdd = () => {
    isEdit.value = false;
    dialogTitle.value = '上传资源';
    
    // 重置表单
    Object.assign(resourceForm, {
      id: null,
      title: '',
      description: '',
      resourceType: 'DOCUMENT',
      file: null
    });
    
    fileList.value = [];
    dialogVisible.value = true;
  };
  
  // 编辑资源
  const handleEdit = (row) => {
    isEdit.value = true;
    dialogTitle.value = '编辑资源';
    
    // 填充表单
    Object.assign(resourceForm, {
      id: row.id,
      title: row.title,
      description: row.description,
      resourceType: row.resourceType,
      file: null
    });
    
    dialogVisible.value = true;
  };
  
  // 删除资源
  const handleDelete = (row) => {
    ElMessageBox.confirm('确定要删除该资源吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        const response = await deleteTeachingResource(row.id);
        if (response.code === 200) {
          ElMessage.success('删除成功');
          fetchResources();
        } else {
          ElMessage.error(response.message || '删除失败');
        }
      } catch (error) {
        console.error('删除资源失败:', error);
        ElMessage.error('删除资源失败');
      }
    }).catch(() => {});
  };
  
  // 下载资源
  const handleDownload = async (row) => {
    try {
      const response = await downloadTeachingResource(row.id);
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = row.title;
      link.click();
      URL.revokeObjectURL(link.href);
      ElMessage.success('下载成功');
    } catch (error) {
      console.error('下载资源失败:', error);
      ElMessage.error('下载资源失败');
    }
  };
  
  // 文件上传相关处理
  const handleFileChange = (file) => {
    resourceForm.file = file.raw;
  };
  
  const handleFileRemove = () => {
    resourceForm.file = null;
  };
  
// 继续 TeachingResourceList.vue 的 script 部分

// 提交表单
const submitForm = async () => {
  if (resourceFormRef.value) {
    try {
      await resourceFormRef.value.validate();
      
      submitLoading.value = true;
      
      if (isEdit.value) {
        // 更新资源信息
        const response = await updateTeachingResource(resourceForm.id, {
          title: resourceForm.title,
          description: resourceForm.description,
          resourceType: resourceForm.resourceType
        });
        
        if (response.code === 200) {
          ElMessage.success('更新成功');
          dialogVisible.value = false;
          fetchResources();
        } else {
          ElMessage.error(response.message || '更新失败');
        }
      } else {
        // 上传新资源
        if (!resourceForm.file) {
          ElMessage.warning('请选择要上传的文件');
          submitLoading.value = false;
          return;
        }
        
        const formData = new FormData();
        formData.append('file', resourceForm.file);
        formData.append('title', resourceForm.title);
        formData.append('description', resourceForm.description);
        formData.append('resourceType', resourceForm.resourceType);
        
        const response = await createTeachingResource(formData);
        
        if (response.code === 200) {
          ElMessage.success('上传成功');
          dialogVisible.value = false;
          fetchResources();
        } else {
          ElMessage.error(response.message || '上传失败');
        }
      }
    } catch (error) {
      console.error('表单提交错误:', error);
    } finally {
      submitLoading.value = false;
    }
  }
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 获取文件类型显示名称
const getFileTypeLabel = (fileType) => {
  if (!fileType) return '未知';
  
  const typeMap = {
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'application/vnd.ms-powerpoint': 'PPT',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'text/plain': 'TXT',
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'video/mp4': 'MP4',
    'audio/mpeg': 'MP3'
  };
  
  return typeMap[fileType] || fileType.split('/')[1].toUpperCase();
};

// 页面加载时获取数据
onMounted(() => {
  fetchResources();
});
</script>

<style scoped>
.teaching-resource-list {
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

.el-tabs {
  margin-bottom: 20px;
}

.el-upload {
  width: 100%;
}

.el-upload-dragger {
  width: 100%;
}
</style>