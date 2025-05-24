import request from './request';

// 获取所有评价
export function getTaskEvaluations() {
  return request({
    url: '/task-evaluations',
    method: 'get'
  });
}

// 获取评价详情
export function getTaskEvaluationById(id) {
  return request({
    url: `/task-evaluations/${id}`,
    method: 'get'
  });
}

// 根据提交ID获取评价
export function getTaskEvaluationsBySubmissionId(submissionId) {
  return request({
    url: `/task-evaluations/submission/${submissionId}`,
    method: 'get'
  });
}

// 获取我创建的评价
export function getMyTaskEvaluations() {
  return request({
    url: '/task-evaluations/evaluator',
    method: 'get'
  });
}

// 创建评价
export function createTaskEvaluation(data) {
  return request({
    url: '/task-evaluations',
    method: 'post',
    data
  });
}

// 更新评价
export function updateTaskEvaluation(id, data) {
  return request({
    url: `/task-evaluations/${id}`,
    method: 'put',
    data
  });
}

// 删除评价
export function deleteTaskEvaluation(id) {
  return request({
    url: `/task-evaluations/${id}`,
    method: 'delete'
  });
}