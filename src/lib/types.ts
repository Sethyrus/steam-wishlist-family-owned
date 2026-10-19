export interface SharedApp {
  appid: number;
  name?: string;
  owner_steamids: string[];
  exclude_reason: number;
}

export interface MemberProfile {
  name: string;
  avatar: string;
}

/** appid -> dueños de la familia (sin el propio usuario) */
export interface OwnershipEntry {
  name: string;
  owners: string[];
  /** true si Steam excluye el juego del préstamo familiar */
  excluded: boolean;
}
export type OwnershipIndex = Record<string, OwnershipEntry>;

/** Súbelo cuando cambie la forma de FamilyData para invalidar cachés antiguas. */
export const DATA_VERSION = 2;

export interface FamilyData {
  version: number;
  fetchedAt: number;
  self: string;
  members: Record<string, MemberProfile>;
  index: OwnershipIndex;
}
