import { AdminPanel } from "@/components/admin-panel";

export default function AdminPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-2xl">
        <AdminPanel />
      </div>
    </div>
  );
}
