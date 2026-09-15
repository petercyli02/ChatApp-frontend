import RegistrationForm from "@/components/custom/RegistrationForm"
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const RegisterPage = () => {
    return (
        <>
            <Button asChild className="absolute top-12 left-12" variant="outline">
                <Link to="/">Back</Link>
            </Button>
            <div className="flex items-center justify-center h-screen">
                <RegistrationForm />
            </div>
        </>
    )
}

export default RegisterPage;