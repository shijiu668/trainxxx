import request from './request';

// 获取企业列表
export function getEnterprises() {
  return request({
    url: '/enterprises',
    method: 'get'
  });
}

// 获取企业详情
export function getEnterpriseById(id) {
  return request({
    url: `/enterprises/${id}`,
    method: 'get'
  });
}

// 创建企业
export function createEnterprise(data) {
  return request({
    url: '/enterprises',
    method: 'post',
    data
  });
}

// 更新企业
export function updateEnterprise(id, data) {
  return request({
    url: `/enterprises/${id}`,
    method: 'put',
    data
  });
}

// 删除企业
export function deleteEnterprise(id) {
  return request({
    url: `/enterprises/${id}`,
    method: 'delete'
  });
}