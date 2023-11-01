"use client";
import { useEffect, useRef, useState } from "react";
import supabaseClient from "../wrappers/supabase-client";
import { generateRandomName } from "@/lib/utils";
import ThemeSwitch from "@/components/theme-switch";
import { nanoid } from "nanoid";
import { useMousePosition } from "@/lib/hooks/use-mouse";

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
    [key: string]: { x: number; y: number; username: string };
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
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        console.log(leftPresences[0].user_id);
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
          },
        }));
      })
      .subscribe();

    function logMousePosition() {
      cursorChannel.send({
        type: "broadcast",
        event: "CURSOR",
        payload: { user_id: userId, x, y, username: newUsername },
      });
    }

    window.addEventListener("mousemove", logMousePosition);

    return () => {
      window.removeEventListener("mousemove", logMousePosition);
      cursorChannel.unsubscribe();
      supabaseClient.removeChannel(cursorChannel);
    };
  }, [newUsername, x, y]);

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
  const handleChange = async (operation: "add" | "minus") => {
    // Fetch the current counter value from Supabase
    const { data, error } = await supabaseClient
      .from("counter")
      .select("value")
      .single();

    if (error) {
      console.error(error);
      return;
    }

    // Determine the new counter value based on the operation
    const currentCounterValue = data?.value ?? 0;
    const newCounterValue =
      operation === "add" ? currentCounterValue + 1 : currentCounterValue - 1;

    // Update the counter value in Supabase
    const updateResponse = await supabaseClient
      .from("counter")
      .update({ value: newCounterValue })
      .match({ id: 1 }); // Assuming your counter has an id of 1

    console.log(updateResponse);
    if (updateResponse.error) {
      console.error(updateResponse.error);
    }
  };

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
          console.log(payload);
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
                className={
                  user.user_id === userId
                    ? "text-green-900 dark:text-green-200"
                    : ""
                }
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
        <div
          key={user_id}
          className="absolute w-4 h-4 bg-red-400 rounded-full select-none"
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          <p className="absolute left-5 top-2">{position.username}</p>
        </div>
      ))}
    </main>
  );
}





