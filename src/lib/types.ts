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
  plan?: "free" | "pro";
  rememberMe?: boolean;
  timezone?: string;
  acceptedTermsAt?: string | Date;
  marketingOptIn?: boolean;
  emailVerified?: boolean;
  emailVerifiedAt?: string | Date;

  // Spotify
  spotifyUserId?: string | null;
  spotifyLinked?: boolean;

  // populated references
  sets?: SetDoc[];        // populated Set documents (if backend returns)
  identities?: UserIdentity[];

  // metadata
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
  // now an array of song objects
  songs: SongObject[];
  images?: string[]; // persisted images urls
  suggestions?: any[];
  lovedBy?: string[];
  collaborators?: string[];
  lastCollaboration?: { by: string; at: string; suggestionId?: string };
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
