import LoginForm from "@/components/custom/LoginForm";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const LoginPage = () => {
    return (
        <>
            <Button asChild className="absolute top-12 left-12" variant="outline">
                <Link to="/">Back</Link>
            </Button>
            <div className="flex items-center justify-center h-screen">
                <LoginForm />
            </div>
        </>
    )
}

export default LoginPage;