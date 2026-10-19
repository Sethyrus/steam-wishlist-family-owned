export interface SharedApp {
  appid: number;
  owner_steamids: string[];
  exclude_reason: number;
}

export interface MemberProfile {
  name: string;
  avatar: string;
}

/** appid -> dueños de la familia (sin el propio usuario) */
export interface OwnershipEntry {
  owners: string[];
  /** true si Steam excluye el juego del préstamo familiar */
  excluded: boolean;
}
export type OwnershipIndex = Record<string, OwnershipEntry>;

export interface FamilyData {
  fetchedAt: number;
  self: string;
  members: Record<string, MemberProfile>;
  index: OwnershipIndex;
}
