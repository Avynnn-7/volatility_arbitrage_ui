import { Toaster } from 'sonner';
import { useTheme } from '@/hooks/useTheme';

export function ToastProvider() {
  const { theme } = useTheme();
  
  return (
    <Toaster
      theme={theme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: 'font-sans',
          title: 'font-semibold',
          description: 'text-sm',
          success: 'bg-success text-white',
          error: 'bg-destructive text-white',
          warning: 'bg-warning text-black',
          info: 'bg-primary text-white',
        },
      }}
    />
  );
}

// Export toast function for easy usage throughout the app
export { toast } from 'sonner';
