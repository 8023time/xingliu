/**
 * 素材类型。
 */
export type AssetType = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LINK' | 'AUDIO';

/**
 * 素材安全审核状态。
 */
export type SafetyStatus = 'PENDING' | 'PASS' | 'REJECT';

/**
 * 素材风险等级。
 */
export type RiskLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * 素材完整字段，作为前后端共享类型的维护入口。
 */
interface Asset {
  id: string;
  userId: string;
  type: AssetType;
  name: string;
  url: string;
  objectPath: string | null;
  originalObjectPath: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  tags: string[] | null;
  aiDescription: string | null;
  metadata: Record<string, unknown> | null;
  safetyStatus: SafetyStatus;
  safetyRiskLevel: RiskLevel | null;
  safetyLabels: string[] | null;
  safetyReason: string | null;
  safetyCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 素材分页查询字段。
 */
interface AssetQuery {
  page: number;
  pageSize: number;
  type: AssetType;
  safetyStatus: SafetyStatus;
}

/**
 * 素材分页响应字段。
 */
interface AssetPageData {
  page: number;
  pageSize: number;
  total: number;
  items: AssetRecord[];
}

/**
 * 素材列表和详情返回记录。
 */
export type AssetRecord = Asset;

/**
 * 素材分页查询参数。
 */
export type AssetQueryRequest = Partial<AssetQuery>;

/**
 * 创建链接素材请求参数。
 */
export type CreateLinkAssetRequest = Pick<Asset, 'name' | 'url'>;

/**
 * 创建素材请求参数，文件上传时 file 字段由 FormData 承载。
 */
export type CreateAssetRequest = Pick<Asset, 'name'> &
  Partial<Pick<Asset, 'type' | 'url'>> & {
    skipModeration?: boolean;
    tags?: string[];
  };

/**
 * 更新素材请求参数。
 */
export type UpdateAssetRequest = Partial<Pick<Asset, 'name' | 'url'>> & {
  tags?: string[];
};

/**
 * 素材分页响应。
 */
export type AssetPage = AssetPageData;
