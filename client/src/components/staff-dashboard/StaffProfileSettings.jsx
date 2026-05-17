import { supabase } from "../../config/supabaseClient";
import { redirectTo } from "../../utils/navigation";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

export default function StaffProfileSettings({ user }) {
  const fullName = user?.fullName || user?.name || "Facility Staff";
  const email = user?.email || "—";
  const roleLabel = user?.role || "facility_staff";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    redirectTo("/");
  };

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6 max-w-2xl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <section className="flex items-center gap-4">
          <figure className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={`${fullName} avatar`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-400 text-sm">No photo</span>
            )}
            <figcaption className="sr-only">Profile picture</figcaption>

          </figure>
          <section>
            <h2 className="text-lg font-semibold text-gray-800">{fullName}</h2>
            <p className="text-sm text-gray-500">{email}</p>
          </section>
        </section>
        <button
          type="button"
          onClick={handleSignOut}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </header>

      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
        <section>
          <dt className="text-gray-500">Full name</dt>
          <dd className="font-medium text-gray-800">{fullName}</dd>
        </section>
        <section>
          <dt className="text-gray-500">Email</dt>
          <dd className="font-medium text-gray-800">{email}</dd>
        </section>
        <section>
          <dt className="text-gray-500">Role</dt>
          <dd className="font-medium text-gray-800">{roleLabel}</dd>
        </section>
        <section>
          <dt className="text-gray-500">Member since</dt>
          <dd className="font-medium text-gray-800">{formatDate(user?.createdAt)}</dd>
        </section>
        <section>
          <dt className="text-gray-500">Last sign-in</dt>
          <dd className="font-medium text-gray-800">{formatDateTime(user?.lastSignInAt)}</dd>
        </section>
      </dl>
    </section>
  );
}
