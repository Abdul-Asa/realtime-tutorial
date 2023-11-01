"use client";
import { useEffect, useState } from "react";
import supabaseClient from "../wrappers/supabase-client";
import { generateRandomName } from "@/lib/utils";
import ThemeSwitch from "@/components/theme-switch";
import { nanoid } from "nanoid";
import { RealtimeClient } from "@supabase/supabase-js";

type User = {
  user_id: string;
  username: string;
  join_time: string;
};

const userId = nanoid();
const userName = generateRandomName();
export default function Home() {
  const [users, setUsers] = useState<any[]>([]);
  const [newUsername, setNewUsername] = useState<string>(userName);

  const handleJoin = ({ newPresences }: any) => {
    setUsers((prevUsers) => {
      const updatedUsers = [...prevUsers];
      newPresences.forEach((presence: any) => {
        const newUser: User = {
          user_id: presence.user_id,
          username: presence.username,
          join_time: presence.join_time,
        };
        updatedUsers.push(newUser);
      });
      return updatedUsers;
    });
  };

  const handleLeave = ({ leftPresences }: any) => {
    setUsers((prevUsers) => {
      const updatedUsers = prevUsers.filter(
        (user) =>
          !leftPresences.some(
            (leftPresence: any) => leftPresence.user_id === user.user_id
          )
      );
      return updatedUsers;
    });
  };

  useEffect(() => {
    const onlineChannel = supabaseClient.channel("online");

    onlineChannel
      .on("presence", { event: "join" }, handleJoin)
      .on("presence", { event: "leave" }, handleLeave)
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") {
          return;
        }
        const userStatus = {
          user_id: userId,
          username: userName,
          join_time: new Date().toLocaleTimeString(),
        };
        await onlineChannel.track(userStatus);
      });

    return () => {
      onlineChannel && supabaseClient.removeChannel(onlineChannel);
    };
  }, []);

  return (
    <main className="relative flex w-screen h-screen max-h-screen p-4 overflow-hidden">
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          opacity: 0.2,
          backgroundSize: "16px 16px",
          backgroundImage:
            "linear-gradient(to right, gray 1px, transparent 1px), linear-gradient(to bottom, gray 1px, transparent 1px)",
        }}
      >
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-gradient-radial-white dark:bg-gradient-radial-black" />
      </div>
      <div className="flex flex-col justify-between w-full h-full">
        <div className="flex justify-between">
          <div className="w-20 h-20 bg-blue-400"></div>
          <div className="">
            List of online users:
            {users.map((user, ind) => (
              <div
                key={user.user_id}
                className={user.user_id === userId ? "text-green-200" : ""}
              >
                {user.username} joined at: {user.join_time}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div className="flex items-center space-x-4">
            <ThemeSwitch />
            <p>Latency: 10ms</p>
          </div>
          <div className="flex justify-end">
            <p>Design by Shehu</p>
          </div>
        </div>
      </div>
    </main>
  );
}
