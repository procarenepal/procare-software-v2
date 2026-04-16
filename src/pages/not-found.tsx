import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <Card className="w-full max-w-md">
        <CardBody className="text-center p-8">
          <div className="mb-6">
            <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Page Not Found
            </h2>
            <p className="text-default-500 mb-6">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              as={Link}
              className="w-full"
              color="primary"
              size="lg"
              to="/"
              variant="solid"
            >
              Go Back Home
            </Button>

            <Button
              as={Link}
              className="w-full"
              color="default"
              size="lg"
              to="/dashboard"
              variant="bordered"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
