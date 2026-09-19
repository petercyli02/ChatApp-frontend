import RegistrationForm from "@/components/custom/RegistrationForm"
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ThemeToggle from "@/components/custom/ThemeToggle";

const RegisterPage = () => {
    return (
        <>
            <Button asChild className="absolute top-12 left-12" variant="outline">
                <Link to="/">Back</Link>
            </Button>
            <ThemeToggle className="absolute top-6 right-6" />
            <div className="flex items-center justify-center h-screen">
                <RegistrationForm />
            </div>
        </>
    )
}

export default RegisterPage;