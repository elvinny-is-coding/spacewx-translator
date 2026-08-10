"use client";

import { useState } from "react";
import { signInWithEmail } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await signInWithEmail(email);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Magic link sent! Check your email to sign in.");
      setEmail("");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-void-navy p-4">
      <Card className="w-full max-w-md bg-deep-indigo border-void-navy">
        <CardHeader>
          <CardTitle className="text-starlight">Sign In</CardTitle>
          <CardDescription className="text-faint-star">
            Enter your email to receive a magic link for passwordless sign in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-starlight">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-void-navy border-void-navy text-starlight placeholder:text-faint-star"
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-aurora-green text-void-navy hover:bg-aurora-green/90"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Magic Link"}
            </Button>
          </form>
          <p className="mt-4 text-xs text-faint-star text-center">
            By signing in, you agree to receive email alerts for your threshold settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
