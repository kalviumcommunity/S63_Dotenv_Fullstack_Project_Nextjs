import Link from "next/link";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-4xl">404</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">Page Not Found</h2>
          <p className="text-[var(--muted-foreground)]">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex justify-center gap-2">
            <Link href="/">
              <Button variant="primary">Go Home</Button>
            </Link>
            <Link href="/feed">
              <Button variant="outline">Browse Issues</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
