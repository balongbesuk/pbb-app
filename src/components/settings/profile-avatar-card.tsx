"use client";

import { AvatarUpload } from "@/components/settings/avatar-upload";

interface ProfileAvatarCardProps {
  name: string | null;
  username: string;
  avatarUrl: string | null;
}

export function ProfileAvatarCard({ name, username, avatarUrl }: ProfileAvatarCardProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-white/30 p-6 dark:bg-black/20">
      <AvatarUpload initialAvatarUrl={avatarUrl} userName={name} />
      <div className="text-center">
        <h3 className="text-lg font-bold">{name}</h3>
        <p className="text-muted-foreground text-sm">@{username}</p>
      </div>
    </div>
  );
}
