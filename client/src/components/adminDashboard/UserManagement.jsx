import { useMemo, useState } from "react";

const ROLES = ["student", "facility_staff", "admin"];

const ROLE_STYLES = {
  admin: "bg-purple-100 text-purple-700",
  facility_staff: "bg-blue-100 text-blue-700",
  student: "bg-gray-100 text-gray-600",
};

const ROLE_LABELS = {
  admin: "Admin",
  facility_staff: "Staff",
  student: "Student",
};

function RoleBadge({ role }) {
  return (
    <mark
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        ROLE_STYLES[role] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {ROLE_LABELS[role] ?? role}
    </mark>
  );
}

function StarRating({ value }) {
  return (
    <output className="text-sm text-gray-700">
      {"★".repeat(Math.round(value || 0))}
      {"☆".repeat(5 - Math.round(value || 0))}
      <small className="ml-1 text-xs text-gray-400">
        ({Number(value || 0).toFixed(1)})
      </small>
    </output>
  );
}

export default function UserManagement({ users, facilities=[], togglingRole, onRoleChange }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [confirmChange, setConfirmChange] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(""); // For assigning facility staff
  // confirmChange = { userId, userName, newRole }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) => {
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesSearch =
        !q ||
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.student_number?.toLowerCase().includes(q) ||
        u.university?.toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const handleRoleSelect = (user, newRole) => {
    if (newRole === user.role) return;
    setSelectedFacility("");
    setConfirmChange({ userId: user.id, userName: user.full_name, newRole });
  };

  const confirmRoleChange = () => {
    if (!confirmChange) return;
    if (confirmChange.newRole === "facility_staff") {
      onRoleChange(
        confirmChange.userId,
        confirmChange.newRole,
        selectedFacility
      );
    } else {
      onRoleChange(confirmChange.userId, confirmChange.newRole);
    }

    setConfirmChange(null);
    setSelectedFacility("");
  };

  return (
    <article
      className="rounded-lg border border-gray-200 bg-white p-6"
      id="users"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">
            User Management
          </h2>
          <p className="text-sm text-gray-500">
            View all registered users and manage their platform roles.
          </p>
        </section>
        <output className="shrink-0 text-sm text-gray-400">
          {filtered.length} / {users.length} users
        </output>
      </header>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <section className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search by name, email, or student number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="all">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </section>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <section className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">University</th>
              <th className="px-4 py-3">Student #</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-gray-400"
                >
                  No users match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((user) => {
                const isChanging = togglingRole === user.id;
                return (
                  <tr
                    key={user.id}
                    className="border-t border-gray-100 transition-colors hover:bg-gray-50"
                  >
                    {/* Name */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">
                        {user.full_name || "—"}
                      </p>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>

                    {/* University */}
                    <td className="px-4 py-3 text-gray-600">
                      {user.university || "—"}
                    </td>

                    {/* Student number */}
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {user.student_number || "—"}
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3">
                      {user.total_ratings > 0 ? (
                        <StarRating value={user.average_rating} />
                      ) : (
                        <small className="text-xs text-gray-400">
                          No ratings
                        </small>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString("en-ZA")
                        : "—"}
                    </td>

                    {/* Role dropdown */}
                    <td className="px-4 py-3">
                      {isChanging ? (
                        <output className="inline-flex items-center gap-1.5 text-xs text-blue-600">
                          <svg
                            className="h-3.5 w-3.5 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8H4z"
                            />
                          </svg>
                          Saving…
                        </output>
                      ) : (
                        <section className="flex items-center gap-2">
                          <RoleBadge role={user.role} />
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleRoleSelect(user, e.target.value)
                            }
                            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            aria-label={`Change role for ${user.full_name}`}
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                        </section>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {/* ── Confirmation modal ─────────────────────────────────────────────── */}
      {confirmChange && (
        <aside
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-modal-title"
        >
          <article className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3
              id="role-modal-title"
              className="text-base font-semibold text-gray-900"
            >
              Confirm role change
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Change{" "}
              <strong className="font-semibold text-gray-800">
                {confirmChange.userName}
              </strong>{" "}
              to{" "}
              <strong className="font-semibold text-gray-800">
                {ROLE_LABELS[confirmChange.newRole]}
              </strong>
              ? This affects what they can access on the platform.
            </p>

            {confirmChange.newRole==="facility_staff" && (
            <section className="mt-4">

            <label className="block text-sm font-medium text-gray-700 mb-2">

            Assign Trade Facility

            </label>

            <select
            value={selectedFacility}
            onChange={(e)=>
            setSelectedFacility(
            e.target.value
            )}
            className="
            w-full
            rounded-lg
            border
            border-gray-200
            px-3
            py-2
            text-sm"
            >

            <option value="">
            Select location
            </option>

            {facilities.map((f)=>(
            <option
            key={f.id}
            value={f.id}
            >
            {f.name}
            — {f.location}
            </option>
            ))}

            </select>

            </section>
            )}

            <footer className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmChange(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  confirmChange.newRole ===
                    "facility_staff" &&
                  !selectedFacility
                }
                onClick={confirmRoleChange}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm
              </button>
            </footer>
          </article>
        </aside>
      )}
    </article>
  );
}
