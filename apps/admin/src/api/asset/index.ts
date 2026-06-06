import type {
  AssetPage,
  AssetQueryRequest,
  AssetRecord,
  CreateLinkAssetRequest,
} from '@xingliu/shared/asset';
import type { ResponseFormat } from '@xingliu/shared/common';
import http from '@/configs/request';

export type {
  AssetPage,
  AssetQueryRequest,
  AssetRecord,
  AssetType,
  CreateAssetRequest,
  CreateLinkAssetRequest,
  RiskLevel,
  SafetyStatus,
  UpdateAssetRequest,
} from '@xingliu/shared/asset';

/**
 * 获取素材列表接口
 * GET /api/assets
 */
export async function getAssetsApi(query: AssetQueryRequest): Promise<ResponseFormat<AssetPage>> {
  return http.get('/assets', {
    params: {
      page: query.page,
      pageSize: query.pageSize,
      type: query.type,
      safetyStatus: query.safetyStatus,
    },
  });
}

/**
 * 上传文件素材接口
 * POST /api/assets
 */
export async function uploadAssetApi(file: File): Promise<ResponseFormat<AssetRecord>> {
  const data = new FormData();
  data.append('file', file);
  data.append('name', file.name);
  return http.post('/assets', data);
}

/**
 * 创建链接素材接口
 * POST /api/assets
 */
export async function createLinkAssetApi(data: CreateLinkAssetRequest): Promise<ResponseFormat<AssetRecord>> {
  return http.post('/assets', { ...data, type: 'LINK' });
}

/**
 * 重新审核素材接口
 * POST /api/assets/:id/moderation
 */
export async function moderateAssetApi(id: string): Promise<ResponseFormat<AssetRecord>> {
  return http.post(`/assets/${id}/moderation`);
}

/**
 * 删除素材接口
 * DELETE /api/assets/:id
 */
export async function deleteAssetApi(id: string): Promise<ResponseFormat<null>> {
  return http.delete(`/assets/${id}`);
}
