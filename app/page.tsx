"use client";
import { useEffect, useState } from "react";
import supabaseClient from "../wrappers/supabase-client";
import { generateRandomName } from "@/lib/utils";
import ThemeSwitch from "@/components/theme-switch";
import { RealtimePresence, RealtimePresenceState } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

type User = {
  id: string;
  username: string;
};

const userId = nanoid();

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const roomOne = supabaseClient.channel("room-one");

    roomOne
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("join", key, newPresences);
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") {
          return;
        }

        await roomOne.track({
          message: "joined",
          user_id: userId,
          join_time: new Date().toLocaleTimeString(),
        });
      });

    return () => {
      roomOne && supabaseClient.removeChannel(roomOne);
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
          <div className="w-20 h-20 bg-blue-400">chatbox</div>
          <div className="">
            List of online users:
            {users.map((user) => (
              <div key={user.id}>{user.username}</div>
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
