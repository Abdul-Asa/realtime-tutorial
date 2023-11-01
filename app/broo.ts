"use server";
import { headers } from "next/headers";

export const getHeaders = async () => {
  const info = headers();
  return info;
};

// "use client";
// import { useEffect, useRef, useState } from "react";
// import supabaseClient from "../wrappers/supabase-client";
// import { generateRandomName } from "@/lib/utils";
// import ThemeSwitch from "@/components/theme-switch";
// import { nanoid } from "nanoid";
// import { useRouter } from "next/router";
// import {
//   PostgrestResponse,
//   RealtimeChannel,
//   RealtimeChannelSendResponse,
// } from "@supabase/supabase-js";

// export interface Coordinates {
//   x: number | undefined;
//   y: number | undefined;
// }

// export interface Message {
//   id: number;
//   user_id: string;
//   message: string;
// }

// export interface Payload<T> {
//   type: string;
//   event: string;
//   payload?: T;
// }

// export interface User extends Coordinates {
//   color: string;
//   nickName: string;
//   isTyping?: boolean;
//   message?: string;
// }
// export const removeFirst = (src: any[], element: any) => {
//   const index = src.indexOf(element)
//   if (index === -1) return src
//   return [...src.slice(0, index), ...src.slice(index + 1)]
// }

// const userId = nanoid();

// export default function Home() {
//   const router = useRouter();
//   const localName = generateRandomName();

//   const chatboxRef = useRef<any>();
//   const chatInputFix = useRef<boolean>(true);

//   const usersRef = useRef<{ [key: string]: User }>({});
//   const isTypingRef = useRef<boolean>(false);
//   const isCancelledRef = useRef<boolean>(false);
//   const messageRef = useRef<string>();
//   const messagesInTransitRef = useRef<string[]>();
//   const mousePositionRef = useRef<Coordinates>();

//   const joinTimestampRef = useRef<number>();
//   const insertMsgTimestampRef = useRef<number>();

//   const [isTyping, _setIsTyping] = useState<boolean>(false);
//   const [isCancelled, _setIsCancelled] = useState<boolean>(false);
//   const [message, _setMessage] = useState<string>("");
//   const [messagesInTransit, _setMessagesInTransit] = useState<string[]>([]);
//   const [mousePosition, _setMousePosition] = useState<Coordinates>();

//   const [areMessagesFetched, setAreMessagesFetched] = useState<boolean>(false);
//   const [isInitialStateSynced, setIsInitialStateSynced] =
//     useState<boolean>(false);
//   const [latency, setLatency] = useState<number>(0);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [users, setUsers] = useState<{ [key: string]: User }>({});

//   const setIsTyping = (value: boolean) => {
//     isTypingRef.current = value;
//     _setIsTyping(value);
//   };

//   const setIsCancelled = (value: boolean) => {
//     isCancelledRef.current = value;
//     _setIsCancelled(value);
//   };

//   const setMessage = (value: string) => {
//     messageRef.current = value;
//     _setMessage(value);
//   };

//   const setMousePosition = (coordinates: Coordinates) => {
//     mousePositionRef.current = coordinates;
//     _setMousePosition(coordinates);
//   };

//   const setMessagesInTransit = (messages: string[]) => {
//     messagesInTransitRef.current = messages;
//     _setMessagesInTransit(messages);
//   };

//   const mapInitialUsers = (userChannel: RealtimeChannel, roomId: string) => {
//     const state = userChannel.presenceState();
//     const _users = state[roomId];

//     if (!_users) return;

//     // Deconflict duplicate colours at the beginning of the browser session
//     const name = localName;

//     if (_users) {
//       setUsers((existingUsers) => {
//         const updatedUsers = _users.reduce(
//           (acc: { [key: string]: User }, { user_id: userId }: any) => {
//             acc[userId] = existingUsers[userId] || {
//               x: 0,
//               y: 0,
//               nickName: name,
//             };
//             return acc;
//           },
//           {}
//         );
//         usersRef.current = updatedUsers;
//         return updatedUsers;
//       });
//     }
//   };

//   useEffect(() => {
//     let roomChannel: RealtimeChannel;

//     roomChannel = supabaseClient.channel("rooms", {
//       config: { presence: { key: "asa-room" } },
//     });
//     roomChannel.on("presence", { event: "sync" }, () => {
//       setIsInitialStateSynced(true);
//       mapInitialUsers(roomChannel, "asa-room");
//     });
//     roomChannel.subscribe(async (status) => {
//       if (status === "SUBSCRIBED") {
//         const resp: RealtimeChannelSendResponse = await roomChannel.track({
//           user_id: userId,
//         });

//         if (resp === "ok") {
//           console.log("Successfully tracked user");
//         }
//       }
//     });

//     // Get the room's existing messages that were saved to database
//     supabaseClient
//       .from("messages")
//       .select("id, user_id, message")
//       .order("created_at", { ascending: false })
//       .then((resp: PostgrestResponse<Message>) => {
//         resp.data && setMessages(resp.data.reverse());
//         setAreMessagesFetched(true);
//         if (chatboxRef.current)
//           chatboxRef.current.scrollIntoView({ behavior: "smooth" });
//       });

//     // Must properly remove subscribed channel
//     return () => {
//       roomChannel && supabaseClient.removeChannel(roomChannel);
//     };
//   }, []);

//   useEffect(() => {
//     if (!isInitialStateSynced) return;

//     let pingIntervalId: ReturnType<typeof setInterval> | undefined;
//     let messageChannel: RealtimeChannel, pingChannel: RealtimeChannel;
//     let setMouseEvent: (e: MouseEvent) => void = () => {},
//       onKeyDown: (e: KeyboardEvent) => void = () => {};

//     // Ping channel is used to calculate roundtrip time from client to server to client
//     pingChannel = supabaseClient.channel(`ping:${userId}`, {
//       config: { broadcast: { ack: true } },
//     });
//     pingChannel.subscribe((status) => {
//       if (status === "SUBSCRIBED") {
//         pingIntervalId = setInterval(async () => {
//           const start = performance.now();
//           const resp = await pingChannel.send({
//             type: "broadcast",
//             event: "PING",
//             payload: {},
//           });

//           if (resp !== "ok") {
//             console.log("pingChannel broadcast error");
//             setLatency(-1);
//           } else {
//             const end = performance.now();
//             const newLatency = end - start;

//             if (newLatency >= 400) {
//               console.log(
//                 `Roundtrip Latency for User ${userId} surpassed ${400} ms at ${newLatency.toFixed(
//                   1
//                 )} ms`
//               );
//             }

//             setLatency(newLatency);
//           }
//         }, 1000);
//       }
//     });

//     messageChannel = supabaseClient.channel("chat_messages");

//     // Listen for messages inserted into the database
//     messageChannel.on(
//       "postgres_changes",
//       {
//         event: "INSERT",
//         schema: "public",
//         table: "messages",
//       },
//       (payload) => {
//         setMessages((prevMsgs: Message[]) => {
//           const messages = prevMsgs.slice(-20 + 1);
//           const msg = (({ id, message, room_id, user_id }) => ({
//             id,
//             message,
//             room_id,
//             user_id,
//           }))(payload.new);
//           messages.push(msg);

//           if (msg.user_id === userId) {
//             const updatedMessagesInTransit = removeFirst(
//               messagesInTransitRef?.current ?? [],
//               msg.message
//             );
//             setMessagesInTransit(updatedMessagesInTransit);
//           }

//           return messages;
//         });

//         if (chatboxRef.current) {
//           chatboxRef.current.scrollIntoView({ behavior: "smooth" });
//         }
//       }
//     );

//     // Listen for cursor positions from other users in the room
//     messageChannel.on(
//      'broadcast',
//       { event: "POS" },
//       (payload: Payload<{ user_id: string } & Coordinates>) => {
//         setUsers((users) => {
//           const userId = payload!.payload!.user_id;
//           const existingUser = users[userId];

//           if (existingUser) {
//             const x =
//               (payload?.payload?.x ?? 0) - 20 > window.innerWidth
//                 ? window.innerWidth - 20
//                 : payload?.payload?.x;
//             const y =
//               (payload?.payload?.y ?? 0 - 20) > window.innerHeight
//                 ? window.innerHeight - 20
//                 : payload?.payload?.y;

//             users[userId] = { ...existingUser, ...{ x, y } };
//           }

//           return users;
//         });
//       }
//     );

//     // Listen for messages sent by other users directly via Broadcast
//     messageChannel.on(
//       REALTIME_LISTEN_TYPES.BROADCAST,
//       { event: "MESSAGE" },
//       (
//         payload: Payload<{
//           user_id: string;
//           isTyping: boolean;
//           message: string;
//         }>
//       ) => {
//         setUsers((users) => {
//           const userId = payload!.payload!.user_id;
//           const existingUser = users[userId];

//           if (existingUser) {
//             users[userId] = {
//               ...existingUser,
//               ...{
//                 isTyping: payload?.payload?.isTyping,
//                 message: payload?.payload?.message,
//               },
//             };
//             users = cloneDeep(users);
//           }

//           return users;
//         });
//       }
//     );
//     messageChannel.subscribe((status: `${REALTIME_SUBSCRIBE_STATES}`) => {
//       if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
//         // Lodash throttle will be removed once realtime-js client throttles on the channel level
//         const sendMouseBroadcast = throttle(({ x, y }) => {
//           messageChannel
//             .send({
//               type: "broadcast",
//               event: "POS",
//               payload: { user_id: userId, x, y },
//             })
//             .catch(() => {});
//         }, 1000 / MAX_EVENTS_PER_SECOND);

//         setMouseEvent = (e: MouseEvent) => {
//           const [x, y] = [e.clientX, e.clientY];
//           sendMouseBroadcast({ x, y });
//           setMousePosition({ x, y });
//         };

//         onKeyDown = async (e: KeyboardEvent) => {
//           if (document.activeElement?.id === "email") return;

//           // Start typing session
//           if (e.code === "Enter" || (e.key.length === 1 && !e.metaKey)) {
//             if (!isTypingRef.current) {
//               setIsTyping(true);
//               setIsCancelled(false);

//               if (chatInputFix.current) {
//                 setMessage("");
//                 chatInputFix.current = false;
//               } else {
//                 setMessage(e.key.length === 1 ? e.key : "");
//               }
//               messageChannel
//                 .send({
//                   type: "broadcast",
//                   event: "MESSAGE",
//                   payload: { user_id: userId, isTyping: true, message: "" },
//                 })
//                 .catch(() => {});
//             } else if (e.code === "Enter") {
//               // End typing session and send message
//               setIsTyping(false);
//               messageChannel
//                 .send({
//                   type: "broadcast",
//                   event: "MESSAGE",
//                   payload: {
//                     user_id: userId,
//                     isTyping: false,
//                     message: messageRef.current,
//                   },
//                 })
//                 .catch(() => {});
//               if (messageRef.current) {
//                 const updatedMessagesInTransit = (
//                   messagesInTransitRef?.current ?? []
//                 ).concat([messageRef.current]);
//                 setMessagesInTransit(updatedMessagesInTransit);
//                 if (chatboxRef.current)
//                   chatboxRef.current.scrollIntoView({ behavior: "smooth" });
//                 insertMsgTimestampRef.current = performance.now();
//                 await supabaseClient.from("messages").insert([
//                   {
//                     user_id: userId,
//                     room_id: roomId,
//                     message: messageRef.current,
//                   },
//                 ]);
//               }
//             }
//           }

//           // End typing session without sending
//           if (e.code === "Escape" && isTypingRef.current) {
//             setIsTyping(false);
//             setIsCancelled(true);
//             chatInputFix.current = true;

//             messageChannel
//               .send({
//                 type: "broadcast",
//                 event: "MESSAGE",
//                 payload: { user_id: userId, isTyping: false, message: "" },
//               })
//               .catch(() => {});
//           }
//         };

//         window.addEventListener("mousemove", setMouseEvent);
//         window.addEventListener("keydown", onKeyDown);
//       }
//     });

//     return () => {
//       pingIntervalId && clearInterval(pingIntervalId);

//       window.removeEventListener("mousemove", setMouseEvent);
//       window.removeEventListener("keydown", onKeyDown);

//       pingChannel && supabaseClient.removeChannel(pingChannel);
//       messageChannel && supabaseClient.removeChannel(messageChannel);
//     };

//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [roomId, isInitialStateSynced]);

//   return (
//     <main className="relative flex w-screen h-screen max-h-screen p-4 overflow-hidden">
//       <div
//         className="absolute top-0 left-0 w-full h-full pointer-events-none"
//         style={{
//           opacity: 0.2,
//           backgroundSize: "16px 16px",
//           backgroundImage:
//             "linear-gradient(to right, gray 1px, transparent 1px), linear-gradient(to bottom, gray 1px, transparent 1px)",
//         }}
//       >
//         <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-gradient-radial-white dark:bg-gradient-radial-black" />
//       </div>
//       <div className="flex flex-col justify-between w-full h-full">
//         <div className="flex justify-between">
//           <div className="w-20 h-20 bg-blue-400"></div>
//           <div className="">List of online users:</div>
//         </div>
//         <div className="flex items-end justify-between">
//           <div className="flex items-center space-x-4">
//             <ThemeSwitch />
//             <p>Latency: 10ms</p>
//           </div>
//           <div className="flex justify-end">
//             <p>Design by Shehu</p>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }




// Generate a random user id


// const Room = () => {
//   const router = useRouter()

//   const localColorBackup = getRandomColor()

//   const chatboxRef = useRef<any>()
//   // [Joshen] Super hacky fix for a really weird bug for onKeyDown
//   // input field. For some reason the first keydown event appends the character twice
//   const chatInputFix = useRef<boolean>(true)

//   // These states will be managed via ref as they're mutated within event listeners
//   const usersRef = useRef<{ [key: string]: User }>({})
//   const isTypingRef = useRef<boolean>(false)
//   const isCancelledRef = useRef<boolean>(false)
//   const messageRef = useRef<string>()
//   const messagesInTransitRef = useRef<string[]>()
//   const mousePositionRef = useRef<Coordinates>()

//   const joinTimestampRef = useRef<number>()
//   const insertMsgTimestampRef = useRef<number>()

//   // We manage the refs with a state so that the UI can re-render
//   const [isTyping, _setIsTyping] = useState<boolean>(false)
//   const [isCancelled, _setIsCancelled] = useState<boolean>(false)
//   const [message, _setMessage] = useState<string>('')
//   const [messagesInTransit, _setMessagesInTransit] = useState<string[]>([])
//   const [mousePosition, _setMousePosition] = useState<Coordinates>()

//   const [areMessagesFetched, setAreMessagesFetched] = useState<boolean>(false)
//   const [isInitialStateSynced, setIsInitialStateSynced] = useState<boolean>(false)
//   const [latency, setLatency] = useState<number>(0)
//   const [messages, setMessages] = useState<Message[]>([])
//   const [roomId, setRoomId] = useState<undefined | string>(undefined)
//   const [users, setUsers] = useState<{ [key: string]: User }>({})

//   const setIsTyping = (value: boolean) => {
//     isTypingRef.current = value
//     _setIsTyping(value)
//   }

//   const setIsCancelled = (value: boolean) => {
//     isCancelledRef.current = value
//     _setIsCancelled(value)
//   }

//   const setMessage = (value: string) => {
//     messageRef.current = value
//     _setMessage(value)
//   }

//   const setMousePosition = (coordinates: Coordinates) => {
//     mousePositionRef.current = coordinates
//     _setMousePosition(coordinates)
//   }

//   const setMessagesInTransit = (messages: string[]) => {
//     messagesInTransitRef.current = messages
//     _setMessagesInTransit(messages)
//   }

//   const mapInitialUsers = (userChannel: RealtimeChannel, roomId: string) => {
//     const state = userChannel.presenceState()
//     const _users = state[roomId]

//     if (!_users) return

//     // Deconflict duplicate colours at the beginning of the browser session
//     const colors = Object.keys(usersRef.current).length === 0 ? getRandomColors(_users.length) : []

//     if (_users) {
//       setUsers((existingUsers) => {
//         const updatedUsers = _users.reduce(
//           (acc: { [key: string]: User }, { user_id: userId }: any, index: number) => {
//             const userColors = Object.values(usersRef.current).map((user: any) => user.color)
//             // Deconflict duplicate colors for incoming clients during the browser session
//             const color = colors.length > 0 ? colors[index] : getRandomUniqueColor(userColors)

//             acc[userId] = existingUsers[userId] || {
//               x: 0,
//               y: 0,
//               color: color.bg,
//               hue: color.hue,
//             }
//             return acc
//           },
//           {}
//         )
//         usersRef.current = updatedUsers
//         return updatedUsers
//       })
//     }
//   }

 



//   return (
//     <div
//       className={[
//         'h-screen w-screen p-4 flex flex-col justify-between relative',
//         'max-h-screen max-w-screen overflow-hidden',
//       ].join(' ')}
//     >
//       <div
//         className="absolute top-0 left-0 w-full h-full pointer-events-none"
//         style={{
//           opacity: 0.02,
//           backgroundSize: '16px 16px',
//           backgroundImage:
//             'linear-gradient(to right, gray 1px, transparent 1px),\n    linear-gradient(to bottom, gray 1px, transparent 1px)',
//         }}
//       />
//       <div className="flex flex-col justify-between h-full">
//         <div className="flex justify-between">
//           <WaitlistPopover />
//           <Users users={users} />
//         </div>
//         <div className="flex items-end justify-between">
//           <div className="flex items-center space-x-4">
//             <DarkModeToggle />
//             <Badge>Latency: {latency.toFixed(1)}ms</Badge>
//           </div>
//           <div className="flex justify-end">
//             <Chatbox
//               messages={messages || []}
//               chatboxRef={chatboxRef}
//               messagesInTransit={messagesInTransit}
//               areMessagesFetched={areMessagesFetched}
//             />
//           </div>
//         </div>
//       </div>

//       <div className="absolute top-0 left-0 flex items-center justify-center w-full h-full space-x-2 pointer-events-none">
//         <div className="flex items-center justify-center px-3 py-2 space-x-2 border rounded-md border-scale-1200 opacity-20">
//           <p className="text-sm cursor-default text-scale-1200">Chat</p>
//           <code className="flex items-center justify-center h-6 px-1 rounded bg-scale-1100 text-scale-100">
//             ↩
//           </code>
//         </div>
//         <div className="flex items-center justify-center px-3 py-2 space-x-2 border rounded-md border-scale-1200 opacity-20">
//           <p className="text-sm cursor-default text-scale-1200">Escape</p>
//           <code className="flex items-center justify-center h-6 px-1 text-xs rounded bg-scale-1100 text-scale-100">
//             ESC
//           </code>
//         </div>
//       </div>

//       {Object.entries(users).reduce((acc, [userId, data]) => {
//         const { x, y, color, message, isTyping, hue } = data
//         if (x && y) {
//           acc.push(
//             <Cursor
//               key={userId}
//               x={x}
//               y={y}
//               color={color}
//               hue={hue}
//               message={message || ''}
//               isTyping={isTyping || false}
//             />
//           )
//         }
//         return acc
//       }, [] as ReactElement[])}

//       {/* Cursor for local client: Shouldn't show the cursor itself, only the text bubble */}
//       {Number.isInteger(mousePosition?.x) && Number.isInteger(mousePosition?.y) && (
//         <Cursor
//           isLocalClient
//           x={mousePosition?.x}
//           y={mousePosition?.y}
//           color={users[userId]?.color ?? localColorBackup.bg}
//           hue={users[userId]?.hue ?? localColorBackup.hue}
//           isTyping={isTyping}
//           isCancelled={isCancelled}
//           message={message}
//           onUpdateMessage={setMessage}
//         />
//       )}
//     </div>
//   )
// }
