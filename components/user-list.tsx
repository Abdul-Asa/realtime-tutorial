import { User } from "@/lib/types";
import { FC } from "react";

interface Props {
  users: User[];
}

const UserList: FC<Props> = ({ users }) => {
  return (
    <div className="relative">
      {Object.entries(users).map(([userId, userData], idx) => {
        return (
          <div key={userId} className="relative">
            <div
              key={userId}
              className={[
                "transition-all absolute right-0 h-8 w-8 bg-scale-1200 rounded-full bg-center bg-[length:50%_50%]",
                "bg-no-repeat shadow-md flex items-center justify-center",
              ].join(" ")}
              style={{
                border: `1px solid ${userData.color.hue}`,
                background: userData.color.bg,
                transform: `translateX(${
                  Math.abs(idx - (Object.keys(users).length - 1)) * -20
                }px)`,
              }}
            >
              <div
                style={{ background: userData.color.bg }}
                className="rounded-full w-7 h-7 animate-ping-once"
              />
            </div>
            <div>{userData.username}</div>
          </div>
        );
      })}
    </div>
  );
};

export default UserList;
