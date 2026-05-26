export type ID = string;

export type AttendeeStatus = "active" | "archived";

export interface Attendee {
  id: ID;
  createdAt: string;
  updatedAt: string;
  name: string;
  slug: string;
  bio: string;
  role_title: string;
  company: string;
  location: string;
  avatar_file_id: string;
  cover_file_id: string;
  linkedin_url: string;
  github_url: string;
  website_url: string;
  status: AttendeeStatus;
  user_id: string;
  preferred_stack: string;
  favorite_topic: string;
  level: number;
  tag_ids: string[];
}

export type TagType = "skill" | "interest" | "industry" | "topic";

export interface Tag {
  id: ID;
  name: string;
  type: TagType;
}

export interface Meetup {
  id: ID;
  title: string;
  description: string;
  date: string;
  external_url: string;
}

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface Badge {
  id: ID;
  name: string;
  description: string;
  icon: string;
  rarity: Rarity;
}

export interface AttendeeBadge {
  id: ID;
  attendee_id: ID;
  badge_id: ID;
  awarded_at: string;
}

export interface AttendeeListItem {
  id: ID;
  name: string;
  slug: string;
  role_title: string;
  company: string;
  avatar_url: string;
  status: AttendeeStatus;
  tags: Tag[];
  badge_count: number;
}
