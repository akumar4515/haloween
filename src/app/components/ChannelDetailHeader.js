"use client";

import FollowButton from "./FollowButton";

export default function ChannelDetailHeader({ channel }) {
  if (!channel || !channel.id) return null;

  return (
    <div style={{ marginTop: "12px" }}>
      <FollowButton type="channel" id={channel.id} />
    </div>
  );
}

