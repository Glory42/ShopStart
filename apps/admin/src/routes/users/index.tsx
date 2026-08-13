import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shopstart/types";
import { api } from "../../lib/api-client";
import { useRequireAdmin } from "../../lib/session";

export const Route = createFileRoute("/users/")({
  component: UsersPage,
});

function UsersPage() {
  const { isLoading: authLoading, user } = useRequireAdmin();
  const { data: users } = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: () => api.get<User[]>("/users"),
  });

  if (authLoading || !user) return null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Users</h1>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-neutral-500">
            <th className="py-2">Username</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((u) => (
            <tr key={u.id} className="border-b border-neutral-100">
              <td className="py-2">{u.username}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
