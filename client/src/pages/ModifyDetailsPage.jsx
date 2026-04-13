// import { useNavigate } from "react-router-dom";
import ModifyNavbar from "../components/modify-page/ModifyNavbar";
import HeroPanel from "../components/modify-page/HeroSection";
import ModifyDetailsForm from "../components/modify-page/ModifyDetailsForm";

export default function ModifyDetailsPage() {
  // const navigate = useNavigate();

  const handleConfirm = ({ role, username }) => {
    console.log("User setup:", { role, username });
    // navigate("/dashboard"); // uncomment when dashboard exists
  };

  return (
    <>
      <ModifyNavbar />

      <main className="grid grid-cols-1 md:grid-cols-2 min-h-[calc(100vh-57px)]">
        <HeroPanel />
        <ModifyDetailsForm onConfirm={handleConfirm} />
      </main>
    </>
  );
}