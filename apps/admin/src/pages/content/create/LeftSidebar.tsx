import { useMemo, useState } from 'react';
import { Alert, Button, Card, Checkbox, Empty, Flex, Input, Select, Space, Tag, Typography, Upload } from 'antd';
import { CloudSyncOutlined, CloudUploadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { ContentRecord, SafetyReviewRecord } from '@/api/content';
import type { PromptRecord } from '@/api/prompt';
import type { AssetRecord } from '@/api/asset';
import { useCreateContentContext, type CreateContentContextValue, type CloudStatus } from './CreateContentContext';
import chatIcon from '@/assets/images/chat.svg';
import settingIcon from '@/assets/images/setting.svg';
import promptIcon from '@/assets/images/prompt.svg';
import assetsIcon from '@/assets/images/assets.svg';

const { Paragraph, Text } = Typography;

type SidebarPanel = 'chat' | 'setting' | 'prompt' | 'assets';
type LeftSidebarState = CreateContentContextValue;
type LoadedLeftSidebarState = Omit<LeftSidebarState, 'content'> & { content: ContentRecord };
const PANEL_SURFACE_CLASS = 'rounded-lg border border-slate-200/80 bg-white shadow-none';
const LIST_ITEM_CLASS = 'w-full cursor-pointer rounded-lg border bg-white p-3 text-left transition-all';

const panels: Array<{ key: SidebarPanel; label: string; icon: string }> = [
  { key: 'chat', label: 'AI 对话', icon: chatIcon },
  { key: 'setting', label: '设置', icon: settingIcon },
  { key: 'prompt', label: '提示词', icon: promptIcon },
  { key: 'assets', label: '素材', icon: assetsIcon },
];

export function LeftSidebar() {
  const props = useCreateContentContext();
  const [activePanel, setActivePanel] = useState<SidebarPanel>('chat');
  const activePrompt = props.prompts.find((prompt) => prompt.id === props.promptId) ?? null;
  const selectedAssets = useMemo(
    () => props.approvedAssets.filter((asset) => props.selectedAssetIds.includes(asset.id)),
    [props.approvedAssets, props.selectedAssetIds],
  );

  if (!props.content) return null;
  const loadedProps: LoadedLeftSidebarState = { ...props, content: props.content };

  return (
    <aside className="grid h-full min-h-0 grid-cols-[72px_minmax(0,1fr)] overflow-hidden rounded-xl border border-slate-200 bg-white">
      <nav className="border-r border-slate-200 bg-[#fbfbfc] px-2 py-3" aria-label="创作侧边栏">
        <Flex vertical gap={6}>
          {panels.map((panel) => {
            const selected = activePanel === panel.key;
            return (
              <button
                key={panel.key}
                type="button"
                aria-label={panel.label}
                aria-pressed={selected}
                onClick={() => setActivePanel(panel.key)}
                className={[
                  'group flex min-h-[68px] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-0 px-1 py-2 text-xs transition-all',
                  selected
                    ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200'
                    : 'bg-transparent text-slate-500 hover:bg-white/80 hover:text-slate-900',
                ].join(' ')}
              >
                <img
                  src={panel.icon}
                  alt=""
                  aria-hidden="true"
                  className={[
                    'h-6 w-6 transition-opacity',
                    selected ? 'opacity-100' : 'opacity-70 group-hover:opacity-90',
                  ].join(' ')}
                />
                <span className="leading-5">{panel.label}</span>
                <span
                  className={[
                    'h-0.5 rounded-full transition-all',
                    selected ? 'w-6 bg-slate-900' : 'w-0 bg-transparent',
                  ].join(' ')}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </Flex>
      </nav>

      <div className="min-h-0 overflow-auto bg-[#f7f7f8] px-3 py-3">
        {activePanel === 'chat' && (
          <ChatPanel {...loadedProps} activePrompt={activePrompt} selectedAssets={selectedAssets} />
        )}
        {activePanel === 'setting' && <SettingPanel {...loadedProps} />}
        {activePanel === 'prompt' && <PromptPanel {...loadedProps} />}
        {activePanel === 'assets' && <AssetsPanel {...loadedProps} selectedAssets={selectedAssets} />}
      </div>
    </aside>
  );
}

function ChatPanel({
  topic,
  activePrompt,
  selectedAssets,
  generating,
  actions,
}: LoadedLeftSidebarState & { activePrompt: PromptRecord | null; selectedAssets: AssetRecord[] }) {
  return (
    <Flex vertical gap={12}>
      <PanelHeader title="AI 对话" description="输入创作需求，AI 会实时写入右侧编辑器。" />
      <div className={['p-3', PANEL_SURFACE_CLASS].join(' ')}>
        <Input.TextArea
          value={topic}
          onChange={(event) => actions.setTopic(event.target.value)}
          placeholder="告诉 AI 你想写什么"
          maxLength={1000}
          autoSize={{ minRows: 8, maxRows: 12 }}
          className="rounded-lg"
        />
      </div>
      <div className={['px-3 py-2', PANEL_SURFACE_CLASS].join(' ')}>
        <Space wrap size={[6, 6]}>
          <Tag color={activePrompt ? 'processing' : 'default'}>{activePrompt?.name ?? '未选择提示词'}</Tag>
          <Tag color={selectedAssets.length ? 'success' : 'default'}>素材 {selectedAssets.length}</Tag>
        </Space>
      </div>
      <Button
        type="primary"
        block
        size="large"
        icon={<ThunderboltOutlined />}
        loading={generating}
        onClick={actions.generateContent}
      >
        生成并写入编辑器
      </Button>
      {generating && <Alert type="info" showIcon message="AI 正在实时写入编辑器" />}
    </Flex>
  );
}

function SettingPanel(props: LoadedLeftSidebarState) {
  return (
    <Flex vertical gap={12}>
      <PanelHeader title="设置" description="管理草稿状态、封面、受众和发布流程。" />
      <StatusCard {...props} />
      <CoverCard {...props} />
      <GenerationOptionsCard {...props} />
      <ReviewCards {...props} />
      <RewriteCard {...props} />
      <ConflictCard {...props} />
    </Flex>
  );
}

function PromptPanel({ prompts, promptId, actions }: LoadedLeftSidebarState) {
  return (
    <Flex vertical gap={12}>
      <PanelHeader title="提示词" description="选择一个模板作为本次生成的写作策略。" />
      {prompts.length ? (
        prompts.map((prompt) => {
          const selected = prompt.id === promptId;
          return (
            <button
              key={prompt.id}
              type="button"
              aria-pressed={selected}
              onClick={() => actions.setPromptId(prompt.id)}
              className={[
                LIST_ITEM_CLASS,
                selected
                  ? 'border-slate-900 shadow-sm ring-1 ring-slate-900/5'
                  : 'border-slate-200/80 hover:border-slate-400 hover:shadow-sm',
              ].join(' ')}
            >
              <Flex vertical gap={6}>
                <Space wrap>
                  <Text strong>{prompt.name}</Text>
                  {selected && <Tag color="processing">当前</Tag>}
                </Space>
                <Text type="secondary" className="text-xs">
                  {prompt.category}
                </Text>
                {prompt.description && (
                  <Paragraph ellipsis={{ rows: 2 }} className="mb-0! text-sm text-slate-600">
                    {prompt.description}
                  </Paragraph>
                )}
              </Flex>
            </button>
          );
        })
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无提示词模板" />
      )}
    </Flex>
  );
}

function AssetsPanel({
  approvedAssets,
  selectedAssetIds,
  selectedAssets,
  actions,
}: LoadedLeftSidebarState & { selectedAssets: AssetRecord[] }) {
  const toggleAsset = (assetId: string, checked: boolean) => {
    if (checked) {
      actions.setSelectedAssetIds([...new Set([...selectedAssetIds, assetId])]);
      return;
    }
    actions.setSelectedAssetIds(selectedAssetIds.filter((id) => id !== assetId));
  };

  return (
    <Flex vertical gap={12}>
      <PanelHeader title="素材" description="选择审核通过的素材作为 AI 写作上下文。" />
      <Card size="small" variant="borderless" className={PANEL_SURFACE_CLASS}>
        <Text type="secondary">已选择 {selectedAssets.length} 个素材</Text>
      </Card>
      {approvedAssets.length ? (
        approvedAssets.map((asset) => {
          const checked = selectedAssetIds.includes(asset.id);
          return (
            <button
              key={asset.id}
              type="button"
              aria-pressed={checked}
              onClick={() => toggleAsset(asset.id, !checked)}
              className={[
                LIST_ITEM_CLASS,
                checked
                  ? 'border-slate-900 shadow-sm ring-1 ring-slate-900/5'
                  : 'border-slate-200/80 hover:border-slate-400 hover:shadow-sm',
              ].join(' ')}
            >
              <Flex align="start" gap={10}>
                <Checkbox checked={checked} onChange={(event) => toggleAsset(asset.id, event.target.checked)} />
                <Flex vertical gap={4} className="min-w-0">
                  <Text strong ellipsis>
                    {asset.name}
                  </Text>
                  <Space wrap size={[4, 4]}>
                    <Tag>{asset.type}</Tag>
                    <Tag color="success">已审核</Tag>
                  </Space>
                  {asset.aiDescription && (
                    <Paragraph ellipsis={{ rows: 2 }} className="mb-0! text-sm text-slate-600">
                      {asset.aiDescription}
                    </Paragraph>
                  )}
                </Flex>
              </Flex>
            </button>
          );
        })
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无审核通过的素材" />
      )}
    </Flex>
  );
}

function StatusCard({
  content,
  cloudSaving,
  reviewing,
  qualityEvaluating,
  publishing,
  isOnline,
  cloudStatus,
  conflict,
  actions,
}: LoadedLeftSidebarState) {
  return (
    <Card variant="borderless" className={PANEL_SURFACE_CLASS}>
      <Flex vertical gap={12}>
        <Space wrap>
          <Tag>{getTypeLabel(content.contentType)}</Tag>
          <Tag>{content.publishedVersionId ? '线上：已发布' : '线上：未发布'}</Tag>
          <Tag color={getContentStatusColor(content.status)}>编辑版本：{getContentStatusLabel(content.status)}</Tag>
          <Tag color={getCloudStatusColor(isOnline, cloudStatus, Boolean(conflict))}>
            {getCloudStatusLabel(isOnline, cloudStatus, Boolean(conflict))}
          </Tag>
        </Space>
        <Button
          icon={<CloudSyncOutlined />}
          loading={cloudSaving}
          disabled={Boolean(conflict)}
          onClick={actions.saveCloudNow}
        >
          立即保存云端草稿
        </Button>
        <Button onClick={actions.leave}>暂存离开</Button>
        <Button
          type="primary"
          loading={reviewing}
          disabled={Boolean(conflict) || !isOnline}
          onClick={actions.submitForReview}
        >
          提交审核
        </Button>
        {content.safetyStatus === 'PASS' && !content.qualityScore && (
          <Button loading={qualityEvaluating} onClick={actions.retryQualityEvaluation}>
            重试质量评分
          </Button>
        )}
        {content.status === 'APPROVED' && (
          <Button type="primary" loading={publishing} onClick={actions.publishContent}>
            发布内容
          </Button>
        )}
        {content.publishedVersionId && (
          <Button danger loading={publishing} onClick={actions.offlineContent}>
            下线内容
          </Button>
        )}
      </Flex>
    </Card>
  );
}

function CoverCard({
  content,
  selectedCover,
  coverSaving,
  coverUploadProps,
  imageAssets,
  actions,
}: LoadedLeftSidebarState) {
  return (
    <Card title="背景与封面" variant="borderless" className={PANEL_SURFACE_CLASS}>
      <Flex vertical gap={10}>
        <div className="aspect-[16/9] overflow-hidden rounded-lg bg-slate-100">
          {selectedCover ? (
            <img src={selectedCover.url} alt={selectedCover.name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center px-4 text-center text-sm text-slate-400">
              未设置封面，发布后将展示默认随机封面
            </div>
          )}
        </div>
        <Upload {...coverUploadProps}>
          <Button block icon={<CloudUploadOutlined />} loading={coverSaving}>
            上传封面
          </Button>
        </Upload>
        <Select
          allowClear
          value={content.coverAssetId ?? undefined}
          loading={coverSaving}
          disabled={coverSaving}
          onChange={(value) => actions.updateCover(value ?? null)}
          placeholder="选择已上传的图片素材"
          options={imageAssets.map((asset) => ({ value: asset.id, label: asset.name }))}
          notFoundContent="暂无图片素材"
        />
        {content.coverAssetId && (
          <Button loading={coverSaving} onClick={() => actions.updateCover(null)}>
            清除封面
          </Button>
        )}
      </Flex>
    </Card>
  );
}

function GenerationOptionsCard({ audience, style, keywords, actions }: LoadedLeftSidebarState) {
  return (
    <Card title="生成偏好" variant="borderless" className={PANEL_SURFACE_CLASS}>
      <Flex vertical gap={10}>
        <Input
          value={audience}
          onChange={(event) => actions.setAudience(event.target.value)}
          placeholder="目标受众（可选）"
          maxLength={200}
        />
        <Input
          value={style}
          onChange={(event) => actions.setStyle(event.target.value)}
          placeholder="表达风格（可选）"
          maxLength={200}
        />
        <Input
          value={keywords.join('、')}
          onChange={(event) => actions.setKeywords(parseKeywords(event.target.value))}
          placeholder="关键词（可选，用逗号或空格分隔）"
          maxLength={300}
        />
      </Flex>
    </Card>
  );
}

function ReviewCards({ reviewResult, qualityResult }: LoadedLeftSidebarState) {
  return (
    <>
      {reviewResult && (
        <Alert
          type={
            reviewResult.decision === 'PASS'
              ? 'success'
              : reviewResult.decision === 'NEED_REWRITE'
                ? 'warning'
                : 'error'
          }
          showIcon
          message={`审核结果：${getReviewDecisionLabel(reviewResult.decision)}`}
          description={`风险等级：${reviewResult.riskLevel}；安全分：${reviewResult.safetyScore}${reviewResult.reason ? `；${reviewResult.reason}` : ''}`}
        />
      )}
      {qualityResult && (
        <Alert
          type="success"
          showIcon
          message={`质量评分：${qualityResult.totalScore} / ${qualityResult.level}`}
          description={qualityResult.summary ?? '质量评分已完成'}
        />
      )}
    </>
  );
}

function RewriteCard({
  content,
  rewriteInstruction,
  rewriting,
  rewriteCandidate,
  acceptingRewrite,
  isOnline,
  actions,
}: LoadedLeftSidebarState) {
  if (content.status !== 'NEED_REWRITE') return null;

  return (
    <Card title="合规改写" variant="borderless" className={PANEL_SURFACE_CLASS}>
      <Flex vertical gap={12}>
        <Input.TextArea
          value={rewriteInstruction}
          onChange={(event) => actions.setRewriteInstruction(event.target.value)}
          placeholder="补充改写要求（可选）"
          maxLength={500}
          autoSize={{ minRows: 2, maxRows: 3 }}
        />
        <Button loading={rewriting} disabled={!isOnline} onClick={actions.createComplianceRewrite}>
          生成合规改写
        </Button>
        {rewriteCandidate && (
          <Flex vertical gap={8}>
            <Text strong>{rewriteCandidate.rewrittenTitle}</Text>
            <Paragraph ellipsis={{ rows: 6 }} className="mb-0! whitespace-pre-wrap">
              {rewriteCandidate.rewrittenBody}
            </Paragraph>
            {rewriteCandidate.reason && <Text type="secondary">{rewriteCandidate.reason}</Text>}
            <Button
              type="primary"
              loading={acceptingRewrite}
              disabled={rewriteCandidate.accepted || !isOnline}
              onClick={actions.acceptComplianceRewrite}
            >
              采纳并重审
            </Button>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

function ConflictCard({ conflict, actions }: LoadedLeftSidebarState) {
  if (!conflict) return null;

  return (
    <Alert
      type="warning"
      showIcon
      message="存在云端草稿冲突"
      description="云端草稿已被其他会话更新。当前本地内容不会静默覆盖云端。"
      action={
        <Space direction="vertical">
          <Button size="small" onClick={actions.keepLocalDraft}>
            保留本地
          </Button>
          <Button size="small" onClick={actions.useCloudDraft}>
            保留云端
          </Button>
          <Button size="small" type="primary" onClick={actions.copyAsNewDraft}>
            复制为新草稿
          </Button>
        </Space>
      }
    />
  );
}

function PanelHeader({ title, description }: { title: string; description: string }) {
  return (
    <Flex vertical gap={3} className="px-0 pt-0 pb-1">
      <Text strong className="text-base">
        {title}
      </Text>
      <Text type="secondary" className="text-xs">
        {description}
      </Text>
    </Flex>
  );
}

function getTypeLabel(value: ContentRecord['contentType']) {
  return { ARTICLE: '长文', IMAGE_TEXT: '短图文', SHORT_POST: '短内容' }[value];
}

function getContentStatusLabel(value: ContentRecord['status']) {
  return {
    DRAFT: '草稿',
    REVIEWING: '审核中',
    NEED_REWRITE: '需改写',
    REJECTED: '已拒绝',
    APPROVED: '已通过',
    PUBLISHED: '已发布',
    OFFLINE: '已下线',
  }[value];
}

function getContentStatusColor(value: ContentRecord['status']) {
  if (value === 'APPROVED' || value === 'PUBLISHED') return 'success';
  if (value === 'NEED_REWRITE') return 'warning';
  if (value === 'REJECTED') return 'error';
  if (value === 'REVIEWING') return 'processing';
  return 'default';
}

function getReviewDecisionLabel(value: SafetyReviewRecord['decision']) {
  return { PASS: '通过', NEED_REWRITE: '需改写', REJECT: '拒绝' }[value];
}

function getCloudStatusLabel(isOnline: boolean, status: CloudStatus, conflict: boolean) {
  if (conflict) return '存在冲突';
  if (!isOnline) return '离线编辑中';
  if (status === 'saved') return '云端已保存';
  if (status === 'pending') return '等待云端同步';
  if (status === 'error') return '同步失败';
  return '本地草稿';
}

function getCloudStatusColor(isOnline: boolean, status: CloudStatus, conflict: boolean) {
  if (conflict || status === 'error') return 'error';
  if (!isOnline || status === 'pending') return 'warning';
  if (status === 'saved') return 'success';
  return 'default';
}

function parseKeywords(value: string) {
  return value
    .split(/[\s,，、;；]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.slice(0, 30))
    .slice(0, 20);
}
