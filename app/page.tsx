"use client";
import { useEffect, useRef, useState } from "react";
import supabaseClient from "../wrappers/supabase-client";
import { generateRandomName } from "@/lib/utils";
import ThemeSwitch from "@/components/theme-switch";
import { nanoid } from "nanoid";
import { useMousePosition } from "@/lib/hooks/use-mouse";
import Cursor from "@/components/cursor";
import { handleChange } from "./broo";
import { getRandomColor } from "@/lib/utils";
import UserList from "@/components/user-list";
import { User } from "@/lib/types";
import { set } from "lodash";

const userId = nanoid();
const localName = generateRandomName();
const localColor = getRandomColor();

export default function Home() {
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>({
    join_time: new Date().toLocaleTimeString(),
    user_id: userId,
    username: localName,
    color: localColor,
    latestMessage: "",
  });
  const [newUsername, setNewUsername] = useState<string>(localName);
  const [message, setMessage] = useState<string>("");
  const { x, y } = useMousePosition();
  const [isTyping, setIsTyping] = useState(false);
  const sendNameChange = useRef<(updName: string) => void>();
  const [isCancelled, setIsCancelled] = useState<boolean>(false);
  const [cursorPositions, setCursorPositions] = useState<{
    [key: string]: {
      x: number;
      y: number;
      username: string;
      color: { bg: string; hue: string };
      latestMessage: string;
    };
  }>({});
  const [latency, setLatency] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const onlineChannel = supabaseClient.channel("online");
    onlineChannel
      .on("presence", { event: "sync" }, () => {
        const state = onlineChannel.presenceState();
        const presences = Object.values(state);
        setUsers(presences.flat());
        const myUser = presences
          .flat()
          .find((user: any) => user.user_id === userId);
        setCurrentUser(myUser);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        setCursorPositions((prevPositions) => {
          const updatedPositions = { ...prevPositions };
          delete updatedPositions[leftPresences[0].user_id]; // Remove the cursor position for the user who left
          return updatedPositions;
        });
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") {
          return;
        }
        const userStatus = {
          user_id: userId,
          username: localName,
          join_time: new Date().toLocaleTimeString(),
          color: localColor,
        };
        await onlineChannel.track(userStatus);
      });

    sendNameChange.current = async (updName) => {
      const isColorMatch = users.some(
        (obj) => JSON.stringify(obj.color) === JSON.stringify(currentUser.color)
      );

      console.log("sending name change");
      await onlineChannel.track({
        username: updName,
        join_time: currentUser.join_time,
        user_id: userId,
        color: isColorMatch ? getRandomColor() : currentUser.color,
      });
    };

    const pingChannel = supabaseClient.channel(`ping:${userId}`, {
      config: { broadcast: { ack: true } },
    });

    pingChannel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        const pingIntervalId = setInterval(async () => {
          const start = performance.now();
          const resp = await pingChannel.send({
            type: "broadcast",
            event: "PING",
            payload: {},
          });

          if (resp === "ok") {
            const end = performance.now();
            const newLatency = end - start;
            setLatency(newLatency);
          } else {
            console.log("pingChannel broadcast error");
            setLatency(-1);
          }
        }, 500);

        return () => clearInterval(pingIntervalId);
      }
    });

    return () => {
      onlineChannel.unsubscribe();
      pingChannel.unsubscribe();
      supabaseClient.removeChannel(pingChannel);
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
            username: payload.payload.username,
            x: payload.payload.x,
            y: payload.payload.y,
            color: payload.payload.color,
            latestMessage: payload.payload.latestMessage,
          },
        }));
      })
      .subscribe();

    function logMousePosition() {
      cursorChannel.send({
        type: "broadcast",
        event: "CURSOR",
        payload: {
          user_id: userId,
          x,
          y,
          username: currentUser.username,
          color: currentUser.color,
          latestMessage: currentUser.latestMessage,
        },
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTyping) {
        setIsTyping(true);
      }
      if (e.code === "Enter") {
        setIsTyping(false);
        setIsCancelled(false);
      }
      if (e.code === "Escape") {
        setIsTyping(false);
        setIsCancelled(true);
        setMessage("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isTyping]);

  //move to server
  useEffect(() => {
    // Fetch the initial counter value from Supabase when the component mounts
    const fetchCounterValue = async () => {
      let { data, error } = await supabaseClient
        .from("counter")
        .select("value")
        .single();

      if (error) {
        console.error(error);
      } else {
        setCount(data?.value ?? 0);
      }
    };
    fetchCounterValue();

    // Set up a Supabase real-time subscription to listen for changes to the counter value
    const changes = supabaseClient
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE", // Listen only to UPDATEs
          schema: "public",
          table: "counter",
        },
        (payload) => {
          // Update the counter state if the counter value in the database changes
          if (payload.new && payload.new.value !== undefined) {
            setCount(payload.new.value);
          }
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(changes);
    };
  }, []);

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
            <UserList users={users as User[]} />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          <p>
            my position: {x.toFixed(1)}% and {y.toFixed(1)}%
          </p>
          <div className="flex items-center gap-4">
            <button
              className="relative px-4 py-2 text-white bg-blue-500 rounded-full"
              onClick={() => handleChange("add")}
            >
              Add
            </button>
            <span className="flex items-center justify-center w-6 h-6 text-xs text-white bg-red-500 rounded-full">
              {count}
            </span>
            <button
              className="relative px-4 py-2 text-white bg-blue-500 rounded-full"
              onClick={() => handleChange("minus")}
            >
              Subtract
            </button>
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div className="flex items-center space-x-4">
            <ThemeSwitch />
            <p>Latency: {latency.toFixed(1)}ms</p>
          </div>
          <div className="flex justify-end">
            <p>Design by Shehu</p>
          </div>
        </div>
      </div>
      {Object.entries(cursorPositions).map(([user_id, position]) => (
        <Cursor
          isLocalClient
          key={user_id}
          x={position.x}
          y={position.y}
          username={position.username}
          color={position.color.bg}
          hue={position.color.hue}
          message={message}
          isTyping={isTyping}
          isCancelled={isCancelled}
          onUpdateMessage={setMessage}
        />
      ))}
    </main>
  );
}
