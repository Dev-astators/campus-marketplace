import ModifyNavbar      from "../components/modify-page/ModifyNavbar";
import HeroPanel         from "../components/modify-page/HeroSection";
import ModifyDetailsForm from "../components/modify-page/ModifyDetailsForm";

export default function ModifyDetailsPage() {
  return (
    <>
      <ModifyNavbar />
      <main className="grid grid-cols-1 md:grid-cols-2 min-h-[calc(100vh-57px)]">
        <HeroPanel />
        <ModifyDetailsForm />
      </main>
    </>
  );
}