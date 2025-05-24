<!-- src/views/statistics/StatisticsDashboard.vue -->
<template>
    <div class="statistics-dashboard">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>实训数据统计分析</h3>
            <div class="filter-options">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                @change="handleDateRangeChange"
              ></el-date-picker>
              <el-select v-model="filterType" placeholder="筛选类型" @change="handleFilterChange">
                <el-option label="全部" value="all"></el-option>
                <el-option label="按项目" value="project"></el-option>
                <el-option label="按企业" value="enterprise"></el-option>
              </el-select>
              <el-select 
                v-if="filterType === 'project'" 
                v-model="selectedProjectId" 
                placeholder="选择项目"
                @change="handleProjectChange"
              >
                <el-option v-for="project in projects" :key="project.id" :label="project.name" :value="project.id"></el-option>
              </el-select>
              <el-select 
                v-if="filterType === 'enterprise'" 
                v-model="selectedEnterpriseId" 
                placeholder="选择企业"
                @change="handleEnterpriseChange"
              >
                <el-option v-for="enterprise in enterprises" :key="enterprise.id" :label="enterprise.name" :value="enterprise.id"></el-option>
              </el-select>
            </div>
          </div>
        </template>
        
        <div class="dashboard-container" v-loading="loading">
          <!-- 概览卡片 -->
          <el-row :gutter="20" class="summary-cards">
            <el-col :span="6">
              <el-card shadow="hover" class="summary-card">
                <div class="summary-icon">
                  <el-icon :size="40"><el-icon-folder /></el-icon>
                </div>
                <div class="summary-content">
                  <h4>项目总数</h4>
                  <div class="summary-value">{{ projectStats?.totalProjects || 0 }}</div>
                  <div class="summary-detail">完成率: {{ (projectStats?.completionRate || 0).toFixed(2) }}%</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="summary-card">
                <div class="summary-icon">
                  <el-icon :size="40"><el-icon-tickets /></el-icon>
                </div>
                <div class="summary-content">
                  <h4>任务总数</h4>
                  <div class="summary-value">{{ taskStats?.totalTasks || 0 }}</div>
                  <div class="summary-detail">完成率: {{ (taskStats?.completionRate || 0).toFixed(2) }}%</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="summary-card">
                <div class="summary-icon">
                  <el-icon :size="40"><el-icon-user /></el-icon>
                </div>
                <div class="summary-content">
                  <h4>用户总数</h4>
                  <div class="summary-value">{{ userStats?.totalUsers || 0 }}</div>
                  <div class="summary-detail">企业导师: {{ userStats?.activeEnterpriseMentors || 0 }}</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="summary-card">
                <div class="summary-icon">
                  <el-icon :size="40"><el-icon-star /></el-icon>
                </div>
                <div class="summary-content">
                  <h4>评价总数</h4>
                  <div class="summary-value">{{ evaluationStats?.totalEvaluations || 0 }}</div>
                  <div class="summary-detail">平均分: {{ (evaluationStats?.avgScore || 0).toFixed(1) }}</div>
                </div>
              </el-card>
            </el-col>
          </el-row>
          
          <!-- 图表区域 -->
          <el-tabs v-model="activeTab" class="chart-tabs">
            <el-tab-pane label="项目统计" name="project">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-card class="chart-card">
                    <template #header>
                      <h4>项目状态分布</h4>
                    </template>
                    <div ref="projectStatusChart" class="chart"></div>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card class="chart-card">
                    <template #header>
                      <h4>项目月度趋势</h4>
                    </template>
                    <div ref="projectTrendChart" class="chart"></div>
                  </el-card>
                </el-col>
              </el-row>
              <el-row :gutter="20" class="chart-row">
                <el-col :span="24">
                  <el-card class="chart-card">
                    <template #header>
                      <h4>企业项目数量TOP10</h4>
                    </template>
                    <div ref="enterpriseProjectChart" class="chart"></div>
                  </el-card>
                </el-col>
              </el-row>
            </el-tab-pane>
            
            <el-tab-pane label="任务统计" name="task">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-card class="chart-card">
                    <template #header>
                      <h4>任务状态分布</h4>
                    </template>
                    <div ref="taskStatusChart" class="chart"></div>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card class="chart-card">
                    <template #header>
                      <h4>任务优先级分布</h4>
                    </template>
                    <div ref="taskPriorityChart" class="chart"></div>
                  </el-card>
                </el-col>
              </el-row>
              <el-row :gutter="20" class="chart-row">
                <el-col :span="24">
                  <el-card class="chart-card">
                    <template #header>
                      <h4>项目任务数量TOP10</h4>
                    </template>
                    <div ref="projectTaskChart" class="chart"></div>
                  </el-card>
                </el-col>
              </el-row>
            </el-tab-pane>
            
            <el-tab-pane label="用户统计" name="user">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-card class="chart-card">
                    <template #header>
                      <h4>用户角色分布</h4>
                    </template>
                    <div ref="userRoleChart" class="chart"></div>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card class="chart-card">
                    <template #header>
                      <h4>用户月度增长</h4>
                    </template>
                    <div ref="userGrowthChart" class="chart"></div>
                  </el-card>
                </el-col>
              </el-row>
              <el-row :gutter="20" class="chart-row">
                <el-col :span="24">
                  <el-card class="chart-card">
                    <template #header>
                      <h4>学生参与情况</h4>
                    </template>
                    <div ref="studentParticipationChart" class="chart"></div>
                  </el-card>
                </el-col>
              </el-row>
            </el-tab-pane>
            
            <el-tab-pane label="评价统计" name="evaluation">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-card class="chart-card">
                    <template #header>
                      <h4>评分分布</h4>
                    </template>
                    <div ref="scoreDistributionChart" class="chart"></div>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card class="chart-card">
                    <template #header>
                      <h4>各角色平均评分</h4>
                    </template>
                    <div ref="roleScoreChart" class="chart"></div>
                  </el-card>
                </el-col>
              </el-row>
              <el-row :gutter="20" class="chart-row">
                <el-col :span="24">
                  <el-card class="chart-card">
                    <template #header>
                      <h4>评分月度趋势</h4>
                    </template>
                    <div ref="scoreMonthlyChart" class="chart"></div>
                  </el-card>
                </el-col>
              </el-row>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-card>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted, watch } from 'vue';
  import { getStatistics, getStatisticsByDateRange, getStatisticsByProject, getStatisticsByEnterprise } from '@/api/statistics';
  import { getProjects } from '@/api/project';
  import { getEnterprises } from '@/api/enterprise';
  import * as echarts from 'echarts';
  import { ElMessage } from 'element-plus';
  
  // 数据状态
  const loading = ref(false);
  const activeTab = ref('project');
  const dateRange = ref([]);
  const filterType = ref('all');
  const selectedProjectId = ref(null);
  const selectedEnterpriseId = ref(null);
  const projects = ref([]);
  const enterprises = ref([]);
  
  // 统计数据
  const statistics = ref(null);
  const projectStats = ref(null);
  const taskStats = ref(null);
  const userStats = ref(null);
  const evaluationStats = ref(null);
  
  // 图表引用
  const projectStatusChart = ref(null);
  const projectTrendChart = ref(null);
  const enterpriseProjectChart = ref(null);
  const taskStatusChart = ref(null);
  const taskPriorityChart = ref(null);
  const projectTaskChart = ref(null);
  const userRoleChart = ref(null);
  const userGrowthChart = ref(null);
  const studentParticipationChart = ref(null);
  const scoreDistributionChart = ref(null);
  const roleScoreChart = ref(null);
  const scoreMonthlyChart = ref(null);
  
  // 图表实例
  const charts = {
    projectStatus: null,
    projectTrend: null,
    enterpriseProject: null,
    taskStatus: null,
    taskPriority: null,
    projectTask: null,
    userRole: null,
    userGrowth: null,
    studentParticipation: null,
    scoreDistribution: null,
    roleScore: null,
    scoreMonthly: null
  };
  
  // 获取统计数据
  const fetchStatistics = async () => {
    loading.value = true;
    try {
      let response;
      
      if (filterType.value === 'project' && selectedProjectId.value) {
        response = await getStatisticsByProject(selectedProjectId.value);
      } else if (filterType.value === 'enterprise' && selectedEnterpriseId.value) {
        response = await getStatisticsByEnterprise(selectedEnterpriseId.value);
      } else if (dateRange.value && dateRange.value.length === 2) {
        response = await getStatisticsByDateRange(dateRange.value[0], dateRange.value[1]);
      } else {
        response = await getStatistics();
      }
      
      if (response.code === 200) {
        statistics.value = response.data;
        projectStats.value = response.data.projectStatistics;
        taskStats.value = response.data.taskStatistics;
        userStats.value = response.data.userStatistics;
        evaluationStats.value = response.data.evaluationStatistics;
        
        // 初始化图表
        initCharts();
      } else {
        ElMessage.error(response.message || '获取统计数据失败');
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
      ElMessage.error('获取统计数据失败');
    } finally {
      loading.value = false;
    }
  };
  
  // 获取项目列表
  const fetchProjects = async () => {
    try {
      const response = await getProjects();
      if (response.code === 200) {
        projects.value = response.data || [];
      }
    } catch (error) {
      console.error('获取项目列表失败:', error);
    }
  };
  
  // 获取企业列表
  const fetchEnterprises = async () => {
    try {
      const response = await getEnterprises();
      if (response.code === 200) {
        enterprises.value = response.data || [];
      }
    } catch (error) {
      console.error('获取企业列表失败:', error);
    }
  };
  
  // 初始化所有图表
  const initCharts = () => {
    // 销毁之前的图表实例
    Object.values(charts).forEach(chart => {
      if (chart) {
        chart.dispose();
      }
    });
    
    // 根据当前激活的标签页初始化图表
    if (activeTab.value === 'project') {
      initProjectCharts();
    } else if (activeTab.value === 'task') {
      initTaskCharts();
    } else if (activeTab.value === 'user') {
      initUserCharts();
    } else if (activeTab.value === 'evaluation') {
      initEvaluationCharts();
    }
  };
  
  // 初始化项目相关图表
  const initProjectCharts = () => {
    // 项目状态分布饼图
    if (projectStatusChart.value) {
      charts.projectStatus = echarts.init(projectStatusChart.value);
      const statusData = projectStats.value.statusDistribution;
      const data = Object.keys(statusData).map(key => ({
        name: key,
        value: statusData[key]
      }));
      
      charts.projectStatus.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 10,
          data: Object.keys(statusData)
        },
        series: [
          {
            name: '项目状态',
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: data
          }
        ]
      });
    }
    
    // 项目月度趋势折线图
    if (projectTrendChart.value) {
      charts.projectTrend = echarts.init(projectTrendChart.value);
      const monthlyData = projectStats.value.monthlyDistribution;
      const months = Object.keys(monthlyData).sort();
      const values = months.map(month => monthlyData[month]);
      
      charts.projectTrend.setOption({
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: months
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '项目数量',
            type: 'line',
            data: values,
            smooth: true,
            markPoint: {
              data: [
                { type: 'max', name: '最大值' },
                { type: 'min', name: '最小值' }
              ]
            }
          }
        ]
      });
    }
    
    // 企业项目数量柱状图
    if (enterpriseProjectChart.value) {
      charts.enterpriseProject = echarts.init(enterpriseProjectChart.value);
      const enterpriseData = projectStats.value.enterpriseProjectCount || [];
      const enterprises = enterpriseData.map(item => item.enterprise);
      const counts = enterpriseData.map(item => item.count);
      
      charts.enterpriseProject.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          type: 'category',
          data: enterprises,
          axisLabel: {
            interval: 0,
            rotate: 30
          }
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '项目数量',
            type: 'bar',
            data: counts
          }
        ]
      });
    }
  };
  
  // 初始化任务相关图表
  const initTaskCharts = () => {
    // 任务状态分布饼图
    if (taskStatusChart.value) {
      charts.taskStatus = echarts.init(taskStatusChart.value);
      const statusData = taskStats.value.statusDistribution;
      const data = Object.keys(statusData).map(key => ({
        name: key,
        value: statusData[key]
      }));
      
      charts.taskStatus.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 10,
          data: Object.keys(statusData)
        },
        series: [
          {
            name: '任务状态',
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: data
          }
        ]
      });
    }
    
    // 任务优先级分布饼图
    if (taskPriorityChart.value) {
      charts.taskPriority = echarts.init(taskPriorityChart.value);
      const priorityData = taskStats.value.priorityDistribution;
      const data = Object.keys(priorityData).map(key => ({
        name: key,
        value: priorityData[key]
      }));
      
      charts.taskPriority.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 10,
          data: Object.keys(priorityData)
        },
        series: [
          {
            name: '任务优先级',
            type: 'pie',
            radius: '50%',
            data: data
          }
        ]
      });
    }
    
    // 项目任务数量柱状图
    if (projectTaskChart.value) {
      charts.projectTask = echarts.init(projectTaskChart.value);
      const projectData = taskStats.value.projectTaskCount || [];
      const projects = projectData.map(item => item.project);
      const counts = projectData.map(item => item.count);
      
      charts.projectTask.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          type: 'category',
          data: projects,
          axisLabel: {
            interval: 0,
            rotate: 30
          }
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '任务数量',
            type: 'bar',
            data: counts
          }
        ]
      });
    }
  };
  
  // 初始化用户相关图表
  const initUserCharts = () => {
    // 用户角色分布饼图
    if (userRoleChart.value) {
      charts.userRole = echarts.init(userRoleChart.value);
      const roleData = userStats.value.roleDistribution;
      const data = Object.keys(roleData).map(key => ({
        name: key,
        value: roleData[key]
      }));
      
      charts.userRole.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 10,
          data: Object.keys(roleData)
        },
        series: [
          {
            name: '用户角色',
            type: 'pie',
            radius: '50%',
            data: data
          }
        ]
      });
    }
    
    // 用户月度增长折线图
    if (userGrowthChart.value) {
      charts.userGrowth = echarts.init(userGrowthChart.value);
      const monthlyData = userStats.value.activeUsersByMonth;
      const months = Object.keys(monthlyData).sort();
      const values = months.map(month => monthlyData[month]);
      
      charts.userGrowth.setOption({
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: months
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '用户数量',
            type: 'line',
            data: values,
            smooth: true,
            areaStyle: {}
          }
        ]
      });
    }
    
    // 学生参与情况
    if (studentParticipationChart.value) {
      charts.studentParticipation = echarts.init(studentParticipationChart.value);
      
      charts.studentParticipation.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        radar: {
          indicator: [
            { name: '项目参与', max: 10 },
            { name: '任务完成', max: 10 },
            { name: '文档提交', max: 10 },
            { name: '评价得分', max: 5 },
            { name: '协作能力', max: 5 }
          ]
        },
        series: [
          {
            type: 'radar',
            data: [
              {
                value: [
                  userStats.value.avgProjectsPerStudent || 0,
                  userStats.value.avgTasksPerStudent || 0,
                  3.8, // 模拟数据
                  evaluationStats.value.avgScore || 0,
                  4.2  // 模拟数据
                ],
                name: '学生平均表现'
              }
            ]
          }
        ]
      });
    }
  };
  
  // 初始化评价相关图表
  const initEvaluationCharts = () => {
    // 评分分布柱状图
    if (scoreDistributionChart.value) {
      charts.scoreDistribution = echarts.init(scoreDistributionChart.value);
      const scoreData = evaluationStats.value.scoreDistribution;
      const scores = Object.keys(scoreData);
      const counts = scores.map(score => scoreData[score]);
      
      charts.scoreDistribution.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          type: 'category',
          data: scores
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '评价数量',
            type: 'bar',
            data: counts
          }
        ]
      });
    }
    
    // 各角色平均评分雷达图
    if (roleScoreChart.value) {
      charts.roleScore = echarts.init(roleScoreChart.value);
      const roleScoreData = evaluationStats.value.avgScoreByRole;
      const roles = Object.keys(roleScoreData);
      const scores = roles.map(role => roleScoreData[role]);
      
      charts.roleScore.setOption({
        tooltip: {
          trigger: 'axis'
        },
        radar: {
          indicator: roles.map(role => ({ name: role, max: 5 }))
        },
        series: [
          {
            type: 'radar',
            data: [
              {
                value: scores,
                name: '角色评分'
              }
            ]
          }
        ]
      });
    }
    
    // 评分月度趋势折线图
    if (scoreMonthlyChart.value) {
      charts.scoreMonthly = echarts.init(scoreMonthlyChart.value);
      const monthlyData = evaluationStats.value.avgScoreByMonth;
      const months = Object.keys(monthlyData).sort();
      const values = months.map(month => monthlyData[month]);
      
      charts.scoreMonthly.setOption({
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: months
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 5
        },
        series: [
          {
            name: '平均评分',
            type: 'line',
            data: values,
            smooth: true
          }
        ]
      });
    }
  };
  
  // 事件处理函数
  const handleDateRangeChange = () => {
    if (dateRange.value && dateRange.value.length === 2) {
      fetchStatistics();
    }
  };
  
  const handleFilterChange = () => {
    selectedProjectId.value = null;
    selectedEnterpriseId.value = null;
    fetchStatistics();
  };
  
  const handleProjectChange = () => {
    if (selectedProjectId.value) {
      fetchStatistics();
    }
  };
  
  const handleEnterpriseChange = () => {
    if (selectedEnterpriseId.value) {
      fetchStatistics();
    }
  };
  
  // 监听标签页切换，重新初始化图表
  watch(activeTab, () => {
    setTimeout(() => {
      initCharts();
    }, 200);
  });
  
  // 监听窗口大小变化，调整图表大小
  window.addEventListener('resize', () => {
    Object.values(charts).forEach(chart => {
      if (chart) {
        chart.resize();
      }
    });
  });
  
  // 页面挂载时获取数据
  onMounted(() => {
    fetchStatistics();
    fetchProjects();
    fetchEnterprises();
  });
  </script>
  
  <style scoped>
  .statistics-dashboard {
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
  
  .filter-options {
    display: flex;
    gap: 10px;
  }
  
  .summary-cards {
    margin-bottom: 20px;
  }
  
  .summary-card {
  display: flex;
  height: 140px; /* 增加高度 */
  align-items: center; /* 垂直居中内容 */
}
  
  .summary-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    color: #409EFF;
  }
  
  .summary-content {
    flex: 1;
    padding: 10px;
  }
  
  .summary-content h4 {
    margin: 0 0 10px 0;
    font-size: 16px;
    color: #606266;
  }
  
  .summary-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
  line-height: 1.2; /* 添加合适的行高 */
}
  
  .summary-detail {
    font-size: 14px;
    color: #909399;
  }
  
  .chart-tabs {
    margin-top: 20px;
  }
  
  .chart-row {
    margin-top: 20px;
  }
  
  .chart-card {
    margin-bottom: 20px;
  }
  
  .chart-card h4 {
    margin: 0;
    font-size: 16px;
  }
  
  .chart {
    height: 300px;
  }
  </style>