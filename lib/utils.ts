import { animals, colors, uniqueNamesGenerator } from "unique-names-generator";

export const generateRandomName = () => {
  return uniqueNamesGenerator({
    dictionaries: [colors, animals],
    separator: "-",
  });
};
