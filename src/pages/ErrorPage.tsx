import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/custom/ThemeToggle";
import { Link } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <div
      id="error-page"
      className="relative flex h-screen flex-col items-center justify-center gap-4 bg-background text-foreground"
    >
      <ThemeToggle className="absolute top-6 right-6" />
      <h1 className="text-4xl font-bold">Oops!</h1>
      <p className="text-muted-foreground">
        Sorry, an unexpected error has occurred.
      </p>
      {isRouteErrorResponse(error) && (
        <p className="text-sm italic text-muted-foreground">
          {error.statusText}
        </p>
      )}
      <Button asChild variant="outline" className="mt-4">
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}
