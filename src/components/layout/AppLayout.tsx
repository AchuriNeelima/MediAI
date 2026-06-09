import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useUIStore } from '@/stores';
import { cn } from '@/lib/utils';
import AuroraBackground from '@/components/features/AuroraBackground';

export default function AppLayout() {
  const { darkMode } = useUIStore();

  return (
    <div className={cn(
      'flex h-screen overflow-hidden',
      darkMode ? 'dark bg-gray-950' : 'bg-gray-50'
    )}>
      <AuroraBackground />
      <div className="flex w-full h-full relative z-10">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
