import Dexie, { type EntityTable } from 'dexie';

export interface LocalDraft {
  contentId: string;
  title: string;
  summary: string;
  body: string;
  bodyJson: Record<string, unknown>;
  clientRevision: number;
  serverRevision: number;
  baseVersionId: string | null;
  updatedAt: number;
}

const database = new Dexie('xingliu-creator') as Dexie & {
  localDrafts: EntityTable<LocalDraft, 'contentId'>;
};

database.version(1).stores({
  localDrafts: 'contentId, updatedAt',
});

export const localDrafts = database.localDrafts;
