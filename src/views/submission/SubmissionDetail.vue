<template>
    <div class="submission-detail">
      <el-page-header @back="goBack" :title="submission.title || '提交详情'">
        <template #content>
          <span class="page-header-title">{{ submission.title || '加载中...' }}</span>
        </template>
      </el-page-header>
      
      <div class="page-content" v-loading="loading">
        <!-- 基本信息卡片 -->
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <h3>提交信息</h3>
            </div>
          </template>
          <div class="submission-info">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="提交标题">{{ submission.title }}</el-descriptions-item>
              <el-descriptions-item label="提交状态">
                <el-tag :type="getSubmissionStatusType(submission.status)">
                  {{ getSubmissionStatusLabel(submission.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="提交者">{{ submission.user ? submission.user.realName : '未知' }}</el-descriptions-item>
              <el-descriptions-item label="提交时间">{{ formatDateTime(submission.submittedAt) }}</el-descriptions-item>
              <el-descriptions-item label="任务信息">
                <router-link :to="`/tasks/${submission.taskId}`">{{ submission.task ? submission.task.title : '未知任务' }}</router-link>
              </el-descriptions-item>
              <el-descriptions-item label="文件">
                <a v-if="submission.fileUrl" :href="submission.fileUrl" target="_blank">
                  {{ getFileName(submission.fileUrl) }}
                </a>
                <span v-else>无文件</span>
              </el-descriptions-item>
              <el-descriptions-item label="提交内容" :span="2">
                <div class="submission-content">{{ submission.content }}</div>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
        
        <!-- 评价列表 -->
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <h3>评价列表</h3>
              <el-button type="primary" size="small" @click="handleAddEvaluation" v-if="hasPermission('USER_EDIT') && canEvaluate()">添加评价</el-button>
            </div>
          </template>
          <div class="evaluation-section">
            <el-table :data="evaluationList" border>
              <el-table-column label="评价人" width="120">
                <template #default="scope">
                  {{ scope.row.evaluator ? scope.row.evaluator.realName : '未知' }}
                </template>
              </el-table-column>
              <el-table-column label="评分" width="120">
                <template #default="scope">
                  <el-progress :percentage="scope.row.score" :format="format"></el-progress>
                </template>
              </el-table-column>
              <el-table-column label="评语" prop="comment" min-width="300" show-overflow-tooltip />
              <el-table-column label="评价时间" width="150">
              <template #default="scope">
                {{ formatDateTime(scope.row.evaluatedAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="scope">
                <el-button type="danger" size="small" @click="handleDeleteEvaluation(scope.row)" v-if="hasPermission('USER_DELETE') && isEvaluationOwner(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="empty-state" v-if="evaluationList.length === 0">
            <el-empty description="暂无评价记录"></el-empty>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 评价对话框 -->
    <el-dialog title="添加评价" v-model="evaluationDialogVisible" width="500px">
      <el-form ref="evaluationFormRef" :model="evaluationForm" :rules="evaluationRules" label-width="100px">
        <el-form-item label="评分" prop="score">
          <el-slider v-model="evaluationForm.score" :min="0" :max="100" :step="5"></el-slider>
          <div class="score-display">{{ evaluationForm.score }}分</div>
        </el-form-item>
        <el-form-item label="评语" prop="comment">
          <el-input v-model="evaluationForm.comment" type="textarea" rows="4" placeholder="请输入评语"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="evaluationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEvaluationForm" :loading="evaluationLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getSubmissionById } from '@/api/submission';
import { getTaskEvaluationsBySubmissionId, createTaskEvaluation, deleteTaskEvaluation } from '@/api/taskEvaluation';
import { useAuthStore } from '@/store/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const evaluationFormRef = ref(null);

// 获取提交ID
const submissionId = ref(route.params.id);

// 数据
const submission = ref({});
const evaluationList = ref([]);
const loading = ref(false);

// 对话框控制
const evaluationDialogVisible = ref(false);
const evaluationLoading = ref(false);

// 表单对象
const evaluationForm = reactive({
  submissionId: null,
  score: 80,
  comment: ''
});

// 表单校验规则
const evaluationRules = {
  score: [
    { required: true, message: '请设置评分', trigger: 'change' }
  ],
  comment: [
    { required: true, message: '请输入评语', trigger: 'blur' }
  ]
};

// 判断是否有权限
const hasPermission = (permission) => {
  return authStore.hasPermission(permission);
};

// 判断是否可以评价
const canEvaluate = () => {
  // 只有已通过的提交才可以评价
  return submission.value.status === 1;
};

// 判断是否是评价的创建者
const isEvaluationOwner = (evaluation) => {
  return evaluation.evaluatorId === authStore.user.id;
};

// 获取提交详情
const fetchSubmissionDetail = async () => {
  loading.value = true;
  try {
    const response = await getSubmissionById(submissionId.value);
    if (response.code === 200) {
      submission.value = response.data || {};
    } else {
      ElMessage.error(response.message || '获取提交详情失败');
    }
  } catch (error) {
    console.error('获取提交详情失败:', error);
    ElMessage.error('获取提交详情失败');
  } finally {
    loading.value = false;
  }
};

// 获取评价列表
const fetchEvaluations = async () => {
  try {
    const response = await getTaskEvaluationsBySubmissionId(submissionId.value);
    if (response.code === 200) {
      evaluationList.value = response.data || [];
    } else {
      ElMessage.error(response.message || '获取评价列表失败');
    }
  } catch (error) {
    console.error('获取评价列表失败:', error);
    ElMessage.error('获取评价列表失败');
  }
};

// 返回上一页
const goBack = () => {
  router.back();
};

// 添加评价
const handleAddEvaluation = () => {
  // 重置表单
  Object.assign(evaluationForm, {
    submissionId: submissionId.value,
    score: 80,
    comment: ''
  });
  
  evaluationDialogVisible.value = true;
};

// 删除评价
const handleDeleteEvaluation = (row) => {
  ElMessageBox.confirm('确定要删除该评价吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await deleteTaskEvaluation(row.id);
      if (response.code === 200) {
        ElMessage.success('删除成功');
        fetchEvaluations();
      } else {
        ElMessage.error(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除评价失败:', error);
      ElMessage.error('删除评价失败');
    }
  }).catch(() => {});
};

// 提交评价表单
const submitEvaluationForm = async () => {
  if (evaluationFormRef.value) {
    try {
      await evaluationFormRef.value.validate();
      
      evaluationLoading.value = true;
      
      const response = await createTaskEvaluation(evaluationForm);
      
      if (response.code === 200) {
        ElMessage.success('评价提交成功');
        evaluationDialogVisible.value = false;
        fetchEvaluations();
      } else {
        ElMessage.error(response.message || '评价提交失败');
      }
    } catch (error) {
      console.error('表单提交错误:', error);
      ElMessage.error('操作失败，请检查表单数据');
    } finally {
      evaluationLoading.value = false;
    }
  }
};

// 获取文件名
const getFileName = (url) => {
  if (!url) return '';
  return url.substring(url.lastIndexOf('/') + 1);
};

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 获取提交状态标签
const getSubmissionStatusLabel = (status) => {
  const statusMap = {
    0: '待审核',
    1: '已通过',
    2: '未通过'
  };
  return statusMap[status] || '未知';
};

// 获取提交状态类型
const getSubmissionStatusType = (status) => {
  const typeMap = {
    0: 'info',
    1: 'success',
    2: 'danger'
  };
  return typeMap[status] || '';
};

// 自定义进度条显示格式
const format = (percentage) => {
  return `${percentage}分`;
};

// 页面加载时获取数据
onMounted(() => {
  fetchSubmissionDetail();
  fetchEvaluations();
});
</script>

<style scoped>
.submission-detail {
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

.submission-info {
  margin-top: 10px;
}

.submission-content {
  white-space: pre-wrap;
  line-height: 1.5;
}

.empty-state {
  padding: 20px 0;
}

.score-display {
  text-align: center;
  margin-top: 5px;
  font-size: 16px;
  font-weight: bold;
}
</style>