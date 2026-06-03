export type ContentCategory = 'all' | 'beauty' | 'travel' | 'food' | 'tech' | 'life';

export type RankingType = 'hot' | 'viral';

export interface CreatorProfile {
  id: string;
  name: string;
  title: string;
  avatar: string;
  followers: string;
  bio: string;
}

export interface ContentItem {
  id: string;
  title: string;
  excerpt: string;
  body: string[];
  category: Exclude<ContentCategory, 'all'>;
  cover: string;
  gallery: string[];
  imageRatio: 'portrait' | 'square' | 'wide';
  author: CreatorProfile;
  publishedAt: string;
  readCount: number;
  likeCount: number;
  shareCount: number;
  qualityScore: number;
  safetyScore: number;
  tags: string[];
}

export const categoryTabs: { id: string; value: ContentCategory; label: string }[] = [
  { id: 'recommend', value: 'all', label: '推荐' },
  { id: 'outfit', value: 'life', label: '穿搭' },
  { id: 'food', value: 'food', label: '美食' },
  { id: 'makeup', value: 'beauty', label: '彩妆' },
  { id: 'movie', value: 'tech', label: '影视' },
  { id: 'career', value: 'tech', label: '职场' },
  { id: 'emotion', value: 'life', label: '情感' },
  { id: 'home', value: 'life', label: '家居' },
  { id: 'game', value: 'tech', label: '游戏' },
  { id: 'travel', value: 'travel', label: '旅行' },
  { id: 'fitness', value: 'life', label: '健身' },
  { id: 'video', value: 'tech', label: '视频' },
];

export const creators: CreatorProfile[] = [
  {
    id: 'u-01',
    name: '林一然',
    title: '生活方式创作者',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
    followers: '8.6w',
    bio: '记录城市灵感、好物测评和高效生活方式。',
  },
  {
    id: 'u-02',
    name: '阿舟的热榜笔记',
    title: '内容策略观察者',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
    followers: '12.4w',
    bio: '拆解爆文结构，也收藏值得看的 AI 创作案例。',
  },
  {
    id: 'u-03',
    name: '小满实验室',
    title: 'AI 产品体验官',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
    followers: '5.2w',
    bio: '用轻量工具把创作流程做得更顺手。',
  },
];

const images = {
  desk: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
  cafe: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
  flower: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=80',
  street: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=80',
  travel: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
  food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
  makeup: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80',
  product: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
  home: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80',
  brunch: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80',
};

export const contents: ContentItem[] = [
  {
    id: 'note-1001',
    title: '3 个让通勤早晨变轻松的小习惯',
    excerpt: '从包内分区、晨间清单到 12 分钟妆容，把混乱早晨拆成可复制流程。',
    body: [
      '最近把通勤早晨重新整理了一遍，最大的变化不是起得更早，而是把出门前的选择变少。',
      '前一晚只做三件事：包里固定分区、第二天衣服挂在门口、手机备忘录写下第一件要完成的事。这样醒来后不需要临时做太多判断。',
      '妆容也压缩成 12 分钟版本：底妆只处理暗沉区域，眉毛和唇色负责气色，最后用一支浅色腮红把状态拉起来。',
    ],
    category: 'life',
    cover: images.home,
    gallery: [images.home, images.flower, images.cafe],
    imageRatio: 'portrait',
    author: creators[0],
    publishedAt: '2026-06-02 09:20',
    readCount: 48200,
    likeCount: 6120,
    shareCount: 918,
    qualityScore: 91,
    safetyScore: 98,
    tags: ['通勤', '效率', '生活方式'],
  },
  {
    id: 'note-1002',
    title: '一篇看懂爆文标题的情绪钩子',
    excerpt: '不是标题党，而是让读者在 2 秒内知道这篇内容能解决什么焦虑。',
    body: [
      '爆文标题通常不是更夸张，而是更具体。它会同时给出场景、收益和一点点反差。',
      '比如“普通人也能用的选题法”，比“超级好用的选题法”更容易让人停留，因为它降低了门槛。',
      '写标题时可以先列出目标读者正在经历的时刻，再把内容承诺压缩到一句话里。',
    ],
    category: 'tech',
    cover: images.desk,
    gallery: [images.desk, images.product],
    imageRatio: 'wide',
    author: creators[1],
    publishedAt: '2026-06-01 20:45',
    readCount: 86100,
    likeCount: 9940,
    shareCount: 2410,
    qualityScore: 94,
    safetyScore: 97,
    tags: ['内容策略', '爆文', 'AI 创作'],
  },
  {
    id: 'note-1003',
    title: '周末短途旅行：把城市边缘拍得像电影',
    excerpt: '一个下午、两条街、三种构图，让普通街角也有叙事感。',
    body: [
      '短途旅行不一定要去很远。城市边缘的老街、桥下、旧店招，反而更容易拍出生活的质感。',
      '我会优先找有层次的前景，比如树影、窗框、路牌，再等一个人经过画面。',
      '后期只做轻微调整：降低高光、保留一点颗粒，颜色尽量不要过饱和。',
    ],
    category: 'travel',
    cover: images.street,
    gallery: [images.street, images.travel],
    imageRatio: 'portrait',
    author: creators[0],
    publishedAt: '2026-06-01 16:10',
    readCount: 39200,
    likeCount: 4580,
    shareCount: 520,
    qualityScore: 87,
    safetyScore: 99,
    tags: ['摄影', '周末', '城市漫游'],
  },
  {
    id: 'note-1004',
    title: 'AI 工具测评：如何把素材摘要变成可发布笔记',
    excerpt: '从素材读取到标题、正文、标签，一次完整的创作链路复盘。',
    body: [
      '这次测试的重点不是生成速度，而是生成结果能不能被创作者继续编辑。',
      '比较稳定的流程是先让 AI 做素材摘要，再让它按目标平台拆出标题、正文段落和标签。',
      '最后一定要人工检查事实、语气和风险表达。AI 更适合作为第一版，不适合直接替代发布判断。',
    ],
    category: 'tech',
    cover: images.product,
    gallery: [images.product, images.desk],
    imageRatio: 'square',
    author: creators[2],
    publishedAt: '2026-05-31 22:15',
    readCount: 73500,
    likeCount: 7010,
    shareCount: 1388,
    qualityScore: 89,
    safetyScore: 96,
    tags: ['AI 工具', '测评', '创作流程'],
  },
  {
    id: 'note-1005',
    title: '这家社区咖啡店的 brunch 菜单很会照顾独处的人',
    excerpt: '座位、灯光、菜单份量都刚刚好，适合一个人慢慢吃完一顿饭。',
    body: [
      '这家店最舒服的是不催促。靠窗位置有足够的距离，一个人看书、写东西都不会尴尬。',
      '菜单份量偏轻，但搭配很完整：蛋白质、碳水和一点水果，吃完不会困。',
      '如果你想找一个周末上午恢复能量的地方，它比热门打卡店更值得去。',
    ],
    category: 'food',
    cover: images.brunch,
    gallery: [images.brunch, images.cafe, images.food],
    imageRatio: 'wide',
    author: creators[0],
    publishedAt: '2026-05-31 10:30',
    readCount: 31800,
    likeCount: 3920,
    shareCount: 430,
    qualityScore: 84,
    safetyScore: 99,
    tags: ['brunch', '咖啡店', '周末'],
  },
  {
    id: 'note-1006',
    title: '夏天底妆别追求厚，先把质感做好',
    excerpt: '少量遮瑕、局部定妆、保留皮肤光泽，比全脸厚粉更耐看。',
    body: [
      '夏天底妆最大的敌人不是瑕疵，而是闷和斑驳。越想遮住所有东西，越容易让妆面变脏。',
      '我的做法是只遮黑眼圈、鼻翼和痘印，脸颊留一点自然光泽。',
      '定妆也只压在容易出油的位置，最后用喷雾把粉感收掉。',
    ],
    category: 'beauty',
    cover: images.makeup,
    gallery: [images.makeup, images.flower],
    imageRatio: 'portrait',
    author: creators[2],
    publishedAt: '2026-05-30 18:05',
    readCount: 52700,
    likeCount: 7780,
    shareCount: 1090,
    qualityScore: 86,
    safetyScore: 98,
    tags: ['底妆', '夏天', '美妆技巧'],
  },
  {
    id: 'note-1007',
    title: '新手做账号，先别急着追热点',
    excerpt: '稳定的人设、栏目和更新节奏，比偶尔蹭到一个热点更重要。',
    body: [
      '热点能带来短期曝光，但新账号更需要先建立读者预期。',
      '建议先固定三个栏目：经验、清单、复盘。每个栏目都用稳定格式输出，让用户知道关注你能得到什么。',
      '等基础内容足够清楚，再把热点放进自己的栏目里，而不是被热点牵着走。',
    ],
    category: 'tech',
    cover: images.cafe,
    gallery: [images.cafe, images.desk],
    imageRatio: 'square',
    author: creators[1],
    publishedAt: '2026-05-30 12:40',
    readCount: 64400,
    likeCount: 8310,
    shareCount: 1512,
    qualityScore: 92,
    safetyScore: 97,
    tags: ['账号运营', '新手', '内容定位'],
  },
  {
    id: 'note-1008',
    title: '把一顿家常饭拍得有食欲的 4 个小技巧',
    excerpt: '自然光、浅色餐具、斜侧角度和一点留白，已经足够好看。',
    body: [
      '食物照片最怕光线杂乱。靠窗自然光通常比顶灯更柔和，也更容易保留食物质感。',
      '餐具尽量选浅色，背景不要抢走主体。拍摄角度可以从 45 度开始试。',
      '最后留一点桌面空间，让画面有呼吸感，不需要把所有菜都塞进一张图。',
    ],
    category: 'food',
    cover: images.food,
    gallery: [images.food, images.brunch],
    imageRatio: 'portrait',
    author: creators[2],
    publishedAt: '2026-05-29 19:12',
    readCount: 28800,
    likeCount: 3670,
    shareCount: 388,
    qualityScore: 83,
    safetyScore: 99,
    tags: ['家常饭', '拍照', '美食'],
  },
];

export function getContentById(id: string) {
  return contents.find((item) => item.id === id);
}

export function getFeedItems(category: ContentCategory = 'all', keyword = '') {
  const normalizedKeyword = keyword.trim().toLowerCase();

  return contents.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category;
    const matchesKeyword =
      !normalizedKeyword ||
      item.title.toLowerCase().includes(normalizedKeyword) ||
      item.excerpt.toLowerCase().includes(normalizedKeyword) ||
      item.tags.some((tag) => tag.toLowerCase().includes(normalizedKeyword));

    return matchesCategory && matchesKeyword;
  });
}

export function getRankingItems(type: RankingType) {
  return [...contents]
    .sort((left, right) => getRankingScore(right, type) - getRankingScore(left, type))
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      score: getRankingScore(item, type),
      reason: getRankReason(item, type),
    }));
}

export function getUserWorks() {
  return contents.filter((item) => item.author.id === creators[0].id);
}

export function formatNumber(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}w`;
  return value.toLocaleString('zh-CN');
}

export function getPublishedLabel(value: string) {
  const published = new Date(value.replace(' ', 'T'));
  const hours = Math.max(1, Math.round((Date.now() - published.getTime()) / 1000 / 60 / 60));
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.round(hours / 24)} 天前`;
}

function getRankingScore(item: ContentItem, type: RankingType) {
  const hours = Math.max(1, (Date.now() - new Date(item.publishedAt.replace(' ', 'T')).getTime()) / 1000 / 60 / 60);
  const engagementScore = item.readCount + item.likeCount * 5 + item.shareCount * 12;
  const timeDecay = 1 / Math.pow(hours + 2, 1.2);

  if (type === 'hot') {
    return Math.round(engagementScore * timeDecay + item.qualityScore * 0.3 + item.safetyScore * 0.2);
  }

  return Math.round(item.readCount * 0.3 + item.likeCount * 4.5 + item.shareCount * 15 + item.qualityScore * 120);
}

function getRankReason(item: ContentItem, type: RankingType) {
  if (type === 'hot') {
    return `质量分 ${item.qualityScore}，近期阅读热度 ${formatNumber(item.readCount)}，发布时间较新`;
  }

  return `互动增长突出，点赞 ${formatNumber(item.likeCount)}，分享 ${formatNumber(item.shareCount)}，质量分 ${item.qualityScore}`;
}
