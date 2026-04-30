import { useState } from "react";
import { supabase } from "../config/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Onboarding() {
  const [studentNumber, setStudentNumber] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    await supabase
      .from("profiles")
      .update({ student_number: studentNumber })
      .eq("id", session.user.id);

    navigate("/student-dashboard");
  };

  return (
    <div className="p-10">
      <h1>Complete Profile</h1>
      <input
        value={studentNumber}
        onChange={(e) => setStudentNumber(e.target.value)}
        placeholder="Student Number"
      />
      <button onClick={handleSubmit}>Save</button>
    </div>
  );
}