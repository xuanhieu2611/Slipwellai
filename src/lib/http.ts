import { NextResponse } from "next/server";

export const badRequest = (message: string) => NextResponse.json({ error: message }, { status: 400 });
export const unauthorized = () => NextResponse.json({ error: "Sign in is required." }, { status: 401 });
export const serverError = (message = "Something went wrong. Your capture is safe; please try again.") =>
  NextResponse.json({ error: message }, { status: 500 });
