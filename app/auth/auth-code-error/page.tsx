import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-void-navy p-4">
      <Card className="w-full max-w-md bg-deep-indigo border-void-navy">
        <CardHeader>
          <CardTitle className="text-starlight">Authentication Error</CardTitle>
          <CardDescription className="text-faint-star">
            There was a problem signing you in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-faint-star">
            The magic link may have expired or is invalid. Please try signing in again.
          </p>
          <Link href="/auth/login">
            <Button className="w-full bg-aurora-green text-void-navy hover:bg-aurora-green/90">
              Try Again
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
