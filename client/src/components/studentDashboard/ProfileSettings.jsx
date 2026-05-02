import { supabase } from "../../config/supabaseClient";

export default function ProfileSettings({ user }) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const createdAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : "—";

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg">
      <header className="flex items-center gap-4">
        <figure className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user?.fullName ? `${user.fullName} avatar` : "avatar"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No
            </div>
          )}
          <figcaption className="sr-only">Profile picture</figcaption>
        </figure>
        <div>
          <h2 className="text-lg font-semibold">
            {user?.fullName ?? user?.email}
          </h2>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </header>

      <dl className="mt-6 grid grid-cols-1 gap-3 text-sm text-gray-700">
        <div>
          <dt className="font-medium">Full name</dt>
          <dd>{user?.fullName ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium">Email</dt>
          <dd>{user?.email ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium">Member since</dt>
          <dd>{createdAt}</dd>
        </div>
      </dl>

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleSignOut}
          className="bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Sign out
        </button>
      </div>
    </section>
  );
}
