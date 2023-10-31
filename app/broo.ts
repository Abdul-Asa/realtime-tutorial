"use server";
import { headers } from "next/headers";

export const getHeaders = async () => {
  const info = headers();
  return info;
};
