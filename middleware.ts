import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateRandomName } from "./lib/utils";

export function middleware(request: NextRequest) {
  if (request.cookies.has("username")) {
    return NextResponse.next();
  } else {
    const response = NextResponse.next();
    response.cookies.set("username", generateRandomName());
    return response;
  }
}
