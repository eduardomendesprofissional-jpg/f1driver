import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-end px-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Central F1 Driver</span>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">AD</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
