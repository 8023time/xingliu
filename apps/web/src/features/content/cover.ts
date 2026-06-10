const defaultCoverUrls = [
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
];

export function getContentCoverUrl(contentId: string, coverUrl: string | null) {
  if (coverUrl) return coverUrl;

  const hash = Array.from(contentId).reduce((total, char) => total + char.charCodeAt(0), 0);
  return defaultCoverUrls[hash % defaultCoverUrls.length];
}
