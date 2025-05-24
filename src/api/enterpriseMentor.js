import request from './request';

// 获取企业导师列表
export function getEnterpriseMentors() {
  return request({
    url: '/enterprise-mentors',
    method: 'get'
  });
}

// 获取企业导师详情
export function getEnterpriseMentorById(id) {
  return request({
    url: `/enterprise-mentors/${id}`,
    method: 'get'
  });
}

// 获取企业下的导师列表
export function getMentorsByEnterpriseId(enterpriseId) {
  return request({
    url: `/enterprise-mentors/enterprise/${enterpriseId}`,
    method: 'get'
  });
}

// 创建企业导师
export function createEnterpriseMentor(data) {
  return request({
    url: '/enterprise-mentors',
    method: 'post',
    data
  });
}

// 更新企业导师
export function updateEnterpriseMentor(id, data) {
  return request({
    url: `/enterprise-mentors/${id}`,
    method: 'put',
    data
  });
}

// 删除企业导师
export function deleteEnterpriseMentor(id) {
  return request({
    url: `/enterprise-mentors/${id}`,
    method: 'delete'
  });
}