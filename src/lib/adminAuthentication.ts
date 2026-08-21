import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

function responseError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function passwordsMatch(received: string, expected: string) {
  const receivedHash = createHash("sha256").update(received).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(receivedHash, expectedHash);
}

export function authenticateAdmin(request: NextRequest) {
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredPassword) {
    return responseError(
      "The admin area has not been configured yet. Set ADMIN_PASSWORD in the .env.local file and restart the server.",
      503,
    );
  }

  const receivedPassword = request.headers.get("x-admin-password") || "";
  if (!passwordsMatch(receivedPassword, configuredPassword)) {
    return responseError("Incorrect admin password.", 401);
  }

  return null;
}

export function adminResponseError(message: string, status: number) {
  return responseError(message, status);
}
