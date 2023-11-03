"use server";
import supabaseClient from "@/wrappers/supabase-client";
import { headers } from "next/headers";

export const getHeaders = async () => {
  const info = headers();
  return info;
};

export const handleChange = async (operation: "add" | "minus") => {
  // Fetch the current counter value from Supabase
  console.log("running on server");
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
