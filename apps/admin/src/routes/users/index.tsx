import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shopstart/types";
import { api } from "../../lib/api-client";
import { useRequireAdmin } from "../../lib/session";
import { Table, TableBody, TableHead, TableRow } from "../../components/table";

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
      <Table>
        <TableHead columns={["Username", "Email", "Role"]} />
        <TableBody>
          {users?.map((u) => (
            <TableRow key={u.id} cells={[u.username, u.email, u.role]} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
