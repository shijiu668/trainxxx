// src/api/statistics.js
import request from './request';

export function getStatistics() {
  return request({
    url: '/statistics',
    method: 'get'
  });
}

export function getStatisticsByDateRange(startDate, endDate) {
  return request({
    url: `/statistics/date-range`,
    method: 'get',
    params: { startDate, endDate }
  });
}

export function getStatisticsByProject(projectId) {
  return request({
    url: `/statistics/project/${projectId}`,
    method: 'get'
  });
}

export function getStatisticsByEnterprise(enterpriseId) {
  return request({
    url: `/statistics/enterprise/${enterpriseId}`,
    method: 'get'
  });
}