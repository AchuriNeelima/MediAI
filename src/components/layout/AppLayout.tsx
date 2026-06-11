import { Outlet } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { cn } from '@/lib/utils';
import AuroraBackground from '@/components/features/AuroraBackground';
import TopNavigation from './TopNavigation';

export default function AppLayout() {
  const { darkMode } = useUIStore();

  return (
    <div className={cn(
      'flex h-screen overflow-hidden',
      darkMode ? 'dark bg-gray-950' : 'bg-gray-50'
    )}>
      <AuroraBackground />
      <div className="flex flex-col w-full h-full relative z-10">
        <TopNavigation />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
