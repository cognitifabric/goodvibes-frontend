export type Plan = "free" | "pro";

export type UserIdentity = {
  provider: "google" | "apple" | "x";
  providerUserId: string;
  email?: string;
};

export interface Me {
  _id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  plan?: Plan;
  rememberMe?: boolean;
  timezone?: string;
  acceptedTermsAt?: string | Date;
  marketingOptIn?: boolean;
  emailVerified?: boolean;
  emailVerifiedAt?: string | Date;
  spotifyUserId?: string | null;
  spotifyConnected?: boolean;
  sets?: SetDoc[];
  identities?: UserIdentity[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export type SongObject = {
  id: string;
  title: string;
  artists?: string;
  image?: string;
};

export interface SetDoc {
  _id: string;
  name: string;
  description?: string | null;
  songs: SongObject[];
  images?: string[];
  suggestions?: unknown[];
  lovedBy?: string[];
  collaborators?: string[];
  lastCollaboration?: { by: string; at: string; suggestionId?: string };
  tags: string[];
  createdBy: string | { _id: string; username?: string; firstName?: string; lastName?: string };
  createdAt: string;
  updatedAt: string;
}
