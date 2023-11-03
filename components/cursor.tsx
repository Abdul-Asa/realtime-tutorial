import { FC, FormEvent, useEffect, useRef, useState } from "react";

interface Props {
  x?: number;
  y?: number;
  color: string;
  hue: string;
  message: string;
  username: string;
  isTyping: boolean;
  isCancelled?: boolean;
  isLocalClient?: boolean;
  onUpdateMessage?: (message: string) => void;
}

const MAX_MESSAGE_LENGTH = 70;
const MAX_DURATION = 4000;


const Cursor: FC<Props> = ({
  x,
  y,
  color,
  username,
  hue,
  message,
  isTyping,
  isCancelled,
  isLocalClient,
  onUpdateMessage = () => {},
}) => {
  // Don't show cursor for the local client
  const _isLocalClient = !x || !y || isLocalClient;
  const inputRef = useRef() as any;
  const timeoutRef = useRef() as any;
  const chatBubbleRef = useRef() as any;

  const [hideInput, setHideInput] = useState(false);
  const [showMessageBubble, setShowMessageBubble] = useState(false);

  useEffect(() => {
    if (isTyping) {
      setShowMessageBubble(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (isLocalClient) {
        if (inputRef.current) inputRef.current.focus();
        setHideInput(false);
      }
    } else {
      if (!message || isCancelled) {
        setShowMessageBubble(false);
      } else {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (isLocalClient) setHideInput(true);
        const timeoutId = setTimeout(() => {
          setShowMessageBubble(false);
        }, MAX_DURATION);
        timeoutRef.current = timeoutId;
      }
    }
  }, [isLocalClient, isTyping, isCancelled, message, inputRef]);

  return (
    <>
      <div
        className="absolute transition-all duration-300 ease-linear -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${x}%`,
          top: `${y}%`,
        }}
      >
        {!_isLocalClient && (
          <svg
            width="18"
            height="24"
            viewBox="0 0 18 24"
            fill="none"
            className="absolute top-0 left-0 transition transform pointer-events-none"
            style={{
              color,
            }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.717 2.22918L15.9831 15.8743C16.5994 16.5083 16.1503 17.5714 15.2661 17.5714H9.35976C8.59988 17.5714 7.86831 17.8598 7.3128 18.3783L2.68232 22.7C2.0431 23.2966 1 22.8434 1 21.969V2.92626C1 2.02855 2.09122 1.58553 2.717 2.22918Z"
              fill={color}
              stroke={hue}
              strokeWidth="2"
            />
          </svg>
        )}
        <div
          className="absolute truncate -translate-x-1/2 translate-y-full"
          style={{ color }}
        >
          {username}
        </div>{" "}
      </div>
      <div
        ref={chatBubbleRef}
        className={[
          "absolute transition-all duration-300 ease-linear py-2 rounded-full shadow-md -translate-x-1/2 -translate-y-full pointer-events-none",
          "flex items-center justify-between px-4 space-x-2 pointer-events-none",
          `${showMessageBubble ? "opacity-100" : "opacity-0"}`,
          `${
            _isLocalClient && !hideInput
              ? "w-[280px]"
              : "max-w-[280px] overflow-hidden"
          }`,
        ].join(" ")}
        style={{
          background: hue,
          left: `${x}%`,
          top: `${y}%`,
        }}
      >
        {_isLocalClient && !hideInput ? (
          <>
            <input
              ref={inputRef}
              value={message}
              className="w-full text-white bg-transparent border-none outline-none"
              onChange={(e: FormEvent<HTMLInputElement>) => {
                const text = e.currentTarget.value;
                if (text.length <= MAX_MESSAGE_LENGTH)
                  onUpdateMessage(e.currentTarget.value);
              }}
            />
            <p className="text-xs" style={{ color: hue }}>
              {message.length}/{MAX_MESSAGE_LENGTH}
            </p>
          </>
        ) : message.length ? (
          <div className="text-white truncate">{message}</div>
        ) : (
          <div className="flex items-center justify-center">
            <div className="relative block w-10 h-6 loader-dots">
              <div className="absolute top-0 my-2.5 w-1.5 h-1.5 rounded-full bg-white opacity-75"></div>
              <div className="absolute top-0 my-2.5 w-1.5 h-1.5 rounded-full bg-white opacity-75"></div>
              <div className="absolute top-0 my-2.5 w-1.5 h-1.5 rounded-full bg-white opacity-75"></div>
              <div className="absolute top-0 my-2.5 w-1.5 h-1.5 rounded-full bg-white opacity-75"></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Cursor;
