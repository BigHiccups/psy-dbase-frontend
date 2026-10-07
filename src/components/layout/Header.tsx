import { Menu, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

type Props = {
  onOpenSidebar: () => void;
};

export function Header({ onOpenSidebar }: Props) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur lg:px-8">
      <button
        onClick={onOpenSidebar}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-gray-900">
            {user?.user_metadata?.full_name ?? user?.email}
          </p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>

        {user?.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt="Avatar"
            className="h-9 w-9 rounded-full ring-2 ring-white"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
            {(user?.email ?? "?")[0].toUpperCase()}
          </div>
        )}

        <button
          onClick={signOut}
          title="Sair"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}