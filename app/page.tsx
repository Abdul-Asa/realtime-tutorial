"use client";
import { use, useEffect, useRef, useState } from "react";
import supabaseClient from "../wrappers/supabase-client";
import { generateRandomName } from "@/lib/utils";
import ThemeSwitch from "@/components/theme-switch";
import { nanoid } from "nanoid";
import _ from "lodash";
import { useMousePosition } from "@/lib/hooks/use-mouse";
import { on } from "events";
import { set } from "lodash";
type User = {
  user_id: string;
  username: string;
  join_time: string;
};

const userId = nanoid();
const localName = generateRandomName();
export default function Home() {
  const [users, setUsers] = useState<any[]>([]);
  const [myJoinTime, setMyJoinTime] = useState<any>(
    new Date().toLocaleTimeString()
  );
  const [newUsername, setNewUsername] = useState<string>(localName);
  const { x, y } = useMousePosition();
  const sendNameChange = useRef<(updName: string) => void>();
  const [cursorPositions, setCursorPositions] = useState<{
    [key: string]: { x: number; y: number };
  }>({});

  useEffect(() => {
    const onlineChannel = supabaseClient.channel("online");
    onlineChannel
      .on("presence", { event: "sync" }, () => {
        const state = onlineChannel.presenceState();
        const presences = Object.values(state);
        setUsers(presences.flat());
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") {
          return;
        }
        const userStatus = {
          user_id: userId,
          username: localName,
          join_time: new Date().toLocaleTimeString(),
        };
        await onlineChannel.track(userStatus);
      });

    sendNameChange.current = async (updName) => {
      console.log("sending name change");
      console.log(myJoinTime, updName);
      await onlineChannel.track({
        username: updName,
        join_time: myJoinTime,
        user_id: userId,
      });
    };

    return () => {
      onlineChannel.unsubscribe();
      supabaseClient.removeChannel(onlineChannel);
    };
  }, []);

  useEffect(() => {
    const cursorChannel = supabaseClient.channel("cursor");
    cursorChannel
      .on("broadcast", { event: "CURSOR" }, (payload) => {
        setCursorPositions((prevPositions) => ({
          ...prevPositions,
          [payload.payload.user_id]: {
            x: payload.payload.x,
            y: payload.payload.y,
          },
        }));
      })
      .subscribe();

    function logMousePosition() {
      cursorChannel.send({
        type: "broadcast",
        event: "CURSOR",
        payload: { user_id: userId, x, y },
      });
    }

    window.addEventListener("mousemove", logMousePosition);

    return () => {
      window.removeEventListener("mousemove", logMousePosition);
      cursorChannel.unsubscribe();
      supabaseClient.removeChannel(cursorChannel);
    };
  }, [x, y]);

  useEffect(() => {
    if (users.length === 0) return;
    const myUser = users.find((user) => user.user_id === userId);
    if (!myUser) return;
    setMyJoinTime(myUser.join_time);
  }, [users]);

  const handleNameChange = () => {
    const isNameTaken = users.some((user) => user.username === newUsername);
    if (isNameTaken) {
      alert("Name is taken");
      return;
    }
    sendNameChange.current?.(newUsername);
  };

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
          <div className="w-20 h-20 bg-blue-400">
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter new username"
            />
            <button onClick={handleNameChange}>Change Username</button>
          </div>
          <div className="">
            List of online users:
            {users.map((user) => (
              <p
                key={user.user_id}
                className={user.user_id === userId ? "text-green-200" : ""}
              >
                {user.username} joined at: {user.join_time}
              </p>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <p>
            my position: {x} and {y}
          </p>
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
      {Object.entries(cursorPositions).map(([user_id, position]) => (
        <div
          key={user_id}
          className="absolute w-4 h-4 bg-red-400 rounded-full"
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          <p className="">{user_id}</p>
        </div>
      ))}
    </main>
  );
}
