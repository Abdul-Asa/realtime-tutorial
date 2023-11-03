import { animals, colors, uniqueNamesGenerator } from "unique-names-generator";
import sampleSize from "lodash/sampleSize";

export const generateRandomName = () => {
  return uniqueNamesGenerator({
    dictionaries: [colors, animals],
    separator: "-",
  });
};

const userColors = {
  tomato: {
    bg: "#ff6347",
    hue: "#ff6347",
  },
  crimson: {
    bg: "#dc143c",
    hue: "#dc143c",
  },
  pink: {
    bg: "#ffc0cb",
    hue: "#ffc0cb",
  },
  plum: {
    bg: "#dda0dd",
    hue: "#dda0dd",
  },
  indigo: {
    bg: "#4b0082",
    hue: "#4b0082",
  },
  blue: {
    bg: "#0000ff",
    hue: "#0000ff",
  },
  cyan: {
    bg: "#00ffff",
    hue: "#00ffff",
  },
  green: {
    bg: "#008000",
    hue: "#008000",
  },
  orange: {
    bg: "#ffa500",
    hue: "#ffa500",
  },
  violet: {
    bg: "#ee82ee",
    hue: "#ee82ee",
  },
  brown: {
    bg: "#a52a2a",
    hue: "#a52a2a",
  },
  gold: {
    bg: "#ffd700",
    hue: "#ffd700",
  },
  coral: {
    bg: "#ff7f50",
    hue: "#ff7f50",
  },
  teal: {
    bg: "#008080",
    hue: "#008080",
  },
  navy: {
    bg: "#000080",
    hue: "#000080",
  },
  lime: {
    bg: "#00ff00",
    hue: "#00ff00",
  },
};

export const getRandomUniqueColor = (currentColors: string[]) => {
  const colorNames = Object.values(userColors).map((col) => col.bg);
  const uniqueColors = colorNames.filter(
    (color: string) => !currentColors.includes(color)
  );
  const uniqueColor =
    uniqueColors[Math.floor(Math.random() * uniqueColors.length)];
  const uniqueColorSet = Object.values(userColors).find(
    (color) => color.bg === uniqueColor
  );
  return uniqueColorSet || getRandomColor();
};

export const getRandomColors = (qty: number) => {
  return sampleSize(Object.values(userColors), qty);
};

export const getRandomColor = () => {
  return Object.values(userColors)[
    Math.floor(Math.random() * Object.values(userColors).length)
  ];
};
