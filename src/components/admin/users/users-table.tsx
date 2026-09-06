import type { AdminUserListItem } from '@/types/admin/user';

interface UsersTableProps {
  users: AdminUserListItem[];
}

/**
 * Presentational only — receives data via props, no fetching, no
 * business logic. Consumed by pages/admin/users.
 */
export function UsersTable({ users }: UsersTableProps) {
  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">No users found.</p>;
  }

  return (
    <table className="w-full text-start text-sm">
      <caption className="sr-only">Admin users list</caption>
      <thead>
        <tr className="border-b text-start text-muted-foreground">
          <th className="p-2 text-start font-medium" scope="col">
            Name
          </th>
          <th className="p-2 text-start font-medium" scope="col">
            Email
          </th>
          <th className="p-2 text-start font-medium" scope="col">
            Role
          </th>
          <th className="p-2 text-start font-medium" scope="col">
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} className="border-b last:border-0">
            <td className="p-2">{user.fullName}</td>
            <td className="p-2">{user.email}</td>
            <td className="p-2">{user.role}</td>
            <td className="p-2">{user.isActive ? 'Active' : 'Inactive'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
