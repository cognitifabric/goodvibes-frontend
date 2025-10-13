export type Plan = "free" | "pro";

export type Me = {
  id: string;
  username: string;
  plan: Plan;
  spotifyLinked?: boolean;
};

export type SetDoc = {
  _id: string;
  name: string;
  description?: string | null;
  tags?: string[];
  songs: string[];            // spotify track IDs
  collaborators: string[];
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
};
