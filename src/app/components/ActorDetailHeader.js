"use client";

import FollowButton from "./FollowButton";

export default function ActorDetailHeader({ actor }) {
  if (!actor || !actor.id) return null;

  return (
    <div style={{ marginTop: "12px" }}>
      <FollowButton type="actor" id={actor.id} />
    </div>
  );
}

