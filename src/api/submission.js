import request from './request';

// 获取所有提交
export function getSubmissions() {
  return request({
    url: '/submissions',
    method: 'get'
  });
}

// 获取提交详情
export function getSubmissionById(id) {
  return request({
    url: `/submissions/${id}`,
    method: 'get'
  });
}

// 根据任务ID获取提交
export function getSubmissionsByTaskId(taskId) {
  return request({
    url: `/submissions/task/${taskId}`,
    method: 'get'
  });
}

// 获取我的提交
export function getMySubmissions() {
  return request({
    url: '/submissions/user',
    method: 'get'
  });
}

// 创建提交
export function createSubmission(data) {
  return request({
    url: '/submissions',
    method: 'post',
    data
  });
}

// 更新提交
export function updateSubmission(id, data) {
  return request({
    url: `/submissions/${id}`,
    method: 'put',
    data
  });
}

// 更新提交状态
export function updateSubmissionStatus(id, status) {
  return request({
    url: `/submissions/${id}/status`,
    method: 'put',
    params: { status }
  });
}

// 删除提交
export function deleteSubmission(id) {
  return request({
    url: `/submissions/${id}`,
    method: 'delete'
  });
}