import type { ProjectMember } from "@/lib/types";

interface MemberAvatarsProps {
  members: ProjectMember[];
  max?: number;
  size?: "sm" | "md";
}

export function MemberAvatars({ members, max = 5, size = "sm" }: MemberAvatarsProps) {
  if (members.length === 0) return null;

  const visible = members.slice(0, max);
  const overflow = members.length - max;
  const dim = size === "sm" ? "size-7 text-xs" : "size-9 text-sm";

  return (
    <div className="flex items-center">
      {visible.map((m, i) => (
        <span
          key={m.userId}
          title={m.name}
          className={`${dim} -ml-1.5 first:ml-0 grid shrink-0 place-items-center rounded-full border-2 border-canvas font-bold text-white`}
          style={{ backgroundColor: m.color, zIndex: visible.length - i }}
        >
          {m.name[0]?.toUpperCase() ?? "?"}
        </span>
      ))}
      {overflow > 0 && (
        <span
          className={`${dim} -ml-1.5 grid shrink-0 place-items-center rounded-full border-2 border-canvas bg-stone-200 font-bold text-stone-600`}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

/** Single avatar circle used inline next to an entry. */
export function UserAvatar({
  name,
  color,
  size = "sm",
}: {
  name: string;
  color: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "size-6 text-xs" : "size-8 text-sm";
  return (
    <span
      title={name}
      className={`${dim} grid shrink-0 place-items-center rounded-full font-bold text-white`}
      style={{ backgroundColor: color }}
    >
      {name[0]?.toUpperCase() ?? "?"}
    </span>
  );
}
