import { useEffect, useState } from "react";
import { OMNICHANNEL_URL } from "../services/api";

export default function FacebookCallback() {
  const [message, setMessage] = useState("Connecting your Facebook Page…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    if (error) {
      setMessage(`Facebook login was cancelled or failed: ${error}`);
      return;
    }

    if (!code || !state) {
      setMessage("Missing authorization code. Close this window and try again.");
      return;
    }

    const redirectUri =
      import.meta.env.VITE_FB_REDIRECT_URI ||
      `${window.location.origin}/facebook/callback`;

    fetch(`${OMNICHANNEL_URL}/messenger/oauth/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, state, redirect_uri: redirectUri }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof data.error === "string" ? data.error : "Could not complete Facebook login"
          );
        }
        setMessage("Success! You can close this window and choose your Page in Sales Brain.");
        if (window.opener) {
          window.opener.postMessage({ type: "messenger_oauth_done" }, window.location.origin);
        }
        setTimeout(() => window.close(), 1500);
      })
      .catch((err) => {
        console.error(err);
        setMessage(err instanceof Error ? err.message : "Connection failed");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-lg font-bold text-slate-900">Facebook Messenger</h1>
        <p className="text-sm text-slate-600">{message}</p>
      </div>
    </div>
  );
}
