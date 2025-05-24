<!-- 12. TeachingResourceDetail.vue -->
<template>
    <div class="resource-detail">
      <el-page-header @back="goBack" title="返回资源列表">
        <template #content>
          <span class="page-header-title">{{ resource.title || '资源详情' }}</span>
        </template>
      </el-page-header>
      
      <div class="page-content" v-loading="loading">
        <!-- 资源信息卡片 -->
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <h3>资源信息</h3>
              <div class="card-actions">
                <el-button type="primary" @click="handleDownload">下载</el-button>
                <el-button type="info" @click="handleEdit" v-if="hasPermission('USER_EDIT')">编辑</el-button>
                <el-button type="danger" @click="handleDelete" v-if="hasPermission('USER_DELETE')">删除</el-button>
              </div>
            </div>
          </template>
          
          <div class="resource-info">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="资源名称">{{ resource.title }}</el-descriptions-item>
              <el-descriptions-item label="资源类型">
                <el-tag :type="resource.resourceType === 'COURSE' ? 'success' : 'info'">
                  {{ resource.resourceType === 'COURSE' ? '课程资源' : '教学文档' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="文件类型">
                <el-tag>{{ getFileTypeLabel(resource.fileType) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="文件大小">{{ formatFileSize(resource.fileSize) }}</el-descriptions-item>
              <el-descriptions-item label="上传者">{{ resource.uploader ? resource.uploader.realName : '未知' }}</el-descriptions-item>
              <el-descriptions-item label="上传时间">{{ formatDate(resource.createdAt) }}</el-descriptions-item>
              <el-descriptions-item label="资源描述" :span="2">{{ resource.description || '无描述' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
        
        <!-- 文件预览卡片 -->
        <el-card class="box-card preview-card">
          <template #header>
            <div class="card-header">
              <h3>文件预览</h3>
            </div>
          </template>
          
          <div class="file-preview">
            <!-- PDF预览 -->
            <div v-if="resource.fileType === 'application/pdf'" class="pdf-preview">
              <iframe :src="previewUrl" width="100%" height="600" frameborder="0"></iframe>
            </div>
            
            <!-- 图片预览 -->
            <div v-else-if="isImage" class="image-preview">
              <img :src="previewUrl" alt="图片预览" style="max-width: 100%;" />
            </div>
            
            <!-- 视频预览 -->
            <div v-else-if="isVideo" class="video-preview">
              <video controls style="width: 100%;">
                <source :src="previewUrl" :type="resource.fileType">
                您的浏览器不支持视频播放
              </video>
            </div>
            
            <!-- 音频预览 -->
            <div v-else-if="isAudio" class="audio-preview">
              <audio controls style="width: 100%;">
                <source :src="previewUrl" :type="resource.fileType">
                您的浏览器不支持音频播放
              </audio>
            </div>
            
            <!-- 其他文件类型 -->
            <div v-else class="no-preview">
              <el-empty description="暂不支持此文件类型的预览"></el-empty>
              <div class="download-tip">
                <el-button type="primary" @click="handleDownload">下载文件</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>
      
      <!-- 编辑对话框 -->
      <el-dialog title="编辑资源信息" v-model="dialogVisible" width="500px">
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
  import { useRoute, useRouter } from 'vue-router';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import { getTeachingResourceById, updateTeachingResource, deleteTeachingResource, downloadTeachingResource } from '@/api/teachingResource';
  import { useAuthStore } from '@/store/auth';
  
  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();
  const resourceFormRef = ref(null);
  
  // 资源ID
  const resourceId = ref(route.params.id);
  
  // 数据
  const resource = ref({});
  const loading = ref(false);
  const dialogVisible = ref(false);
  const submitLoading = ref(false);
  
  // 表单对象
  const resourceForm = reactive({
    id: null,
    title: '',
    description: '',
    resourceType: ''
  });
  
  // 表单校验规则
  const resourceRules = {
    title: [
      { required: true, message: '请输入资源名称', trigger: 'blur' }
    ],
    resourceType: [
      { required: true, message: '请选择资源类型', trigger: 'change' }
    ]
  };
  
  // 预览URL
  const previewUrl = computed(() => {
    if (!resource.value.id) return '';
    return `/api/teaching-resources/${resource.value.id}/download`;
  });
  
  // 判断文件类型
  const isImage = computed(() => {
    return resource.value.fileType && resource.value.fileType.startsWith('image/');
  });
  
  const isVideo = computed(() => {
    return resource.value.fileType && resource.value.fileType.startsWith('video/');
  });
  
  const isAudio = computed(() => {
    return resource.value.fileType && resource.value.fileType.startsWith('audio/');
  });
  
  // 判断是否有权限
  const hasPermission = (permission) => {
    return authStore.hasPermission(permission);
  };
  
  // 获取资源详情
  const fetchResourceDetail = async () => {
    loading.value = true;
    try {
      const response = await getTeachingResourceById(resourceId.value);
      if (response.code === 200) {
        resource.value = response.data || {};
      } else {
        ElMessage.error(response.message || '获取资源详情失败');
      }
    } catch (error) {
      console.error('获取资源详情失败:', error);
      ElMessage.error('获取资源详情失败');
    } finally {
      loading.value = false;
    }
  };
  
  // 返回上一页
  const goBack = () => {
    router.back();
  };
  
  // 下载资源
  const handleDownload = async () => {
    try {
      const response = await downloadTeachingResource(resourceId.value);
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = resource.value.title;
      link.click();
      URL.revokeObjectURL(link.href);
      ElMessage.success('下载成功');
    } catch (error) {
      console.error('下载资源失败:', error);
      ElMessage.error('下载资源失败');
    }
  };
  
  // 编辑资源
  const handleEdit = () => {
    Object.assign(resourceForm, {
      id: resource.value.id,
      title: resource.value.title,
      description: resource.value.description,
      resourceType: resource.value.resourceType
    });
    
    dialogVisible.value = true;
  };
  
  // 删除资源
  const handleDelete = () => {
    ElMessageBox.confirm('确定要删除该资源吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        const response = await deleteTeachingResource(resourceId.value);
        if (response.code === 200) {
          ElMessage.success('删除成功');
          router.replace('/teaching-resources');
        } else {
          ElMessage.error(response.message || '删除失败');
        }
      } catch (error) {
        console.error('删除资源失败:', error);
        ElMessage.error('删除资源失败');
      }
    }).catch(() => {});
  };
  
  // 提交表单
  const submitForm = async () => {
    if (resourceFormRef.value) {
      try {
        await resourceFormRef.value.validate();
        
        submitLoading.value = true;
        
        const response = await updateTeachingResource(resourceForm.id, {
          title: resourceForm.title,
          description: resourceForm.description,
          resourceType: resourceForm.resourceType
        });
        
        if (response.code === 200) {
          ElMessage.success('更新成功');
          dialogVisible.value = false;
          fetchResourceDetail();
        } else {
          ElMessage.error(response.message || '更新失败');
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
    fetchResourceDetail();
  });
  </script>
  
  <style scoped>
  .resource-detail {
    padding: 20px;
  }
  
  .page-header-title {
    font-weight: bold;
    font-size: 18px;
  }
  
  .page-content {
    margin-top: 20px;
  }
  
  .box-card {
    margin-bottom: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .card-header h3 {
    margin: 0;
  }
  
  .resource-info {
    margin-top: 10px;
  }
  
  .preview-card {
    min-height: 400px;
  }
  
  .file-preview {
    padding: 10px 0;
  }
  
  .no-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
  }
  
  .download-tip {
    margin-top: 20px;
  }
  </style>