import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const storedState = request.cookies.get("oauth_state")?.value;
  const codeVerifier = request.cookies.get("oauth_code_verifier")?.value;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(`${baseUrl}?auth_error=${error}`);
  }

  if (!code || !state || state !== storedState || !codeVerifier) {
    return NextResponse.redirect(`${baseUrl}?auth_error=invalid_state`);
  }

  const clientId = process.env.TWITTER_CLIENT_ID!;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET!;
  const redirectUri = `${baseUrl}/api/auth/callback`;

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Token exchange failed:", errText);
      return NextResponse.redirect(`${baseUrl}?auth_error=token_failed`);
    }

    const tokenData = await tokenRes.json();

    // Fetch user profile
    const userRes = await fetch("https://api.x.com/2/users/me?user.fields=created_at,description,profile_image_url,public_metrics", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userRes.ok) {
      const errBody = await userRes.text();
      console.error("User fetch failed:", userRes.status, errBody);
      return NextResponse.redirect(`${baseUrl}?auth_error=user_fetch_failed`);
    }

    const userData = await userRes.json();

    // Store user data in a cookie (in production, use a proper session store)
    const userInfo = {
      id: userData.data.id,
      name: userData.data.name,
      username: userData.data.username,
      profileImage: userData.data.profile_image_url,
      createdAt: userData.data.created_at,
      metrics: userData.data.public_metrics,
      description: userData.data.description,
    };

    const response = NextResponse.redirect(`${baseUrl}?auth=success`);

    response.cookies.set("slopscan_user", JSON.stringify(userInfo), {
      httpOnly: false, // readable by client
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    // Clear OAuth cookies
    response.cookies.delete("oauth_code_verifier");
    response.cookies.delete("oauth_state");

    return response;
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(`${baseUrl}?auth_error=server_error`);
  }
}
