'use client';

import { useToast } from '@/hooks/use-toast';

/**
 * Example component showing how to use Sonner toast notifications
 * throughout the application
 */
export function ToastExample() {
  const { success, error, info, warning, promise } = useToast();

  const handleSuccess = () => {
    success('Success!', 'This is a success message');
  };

  const handleError = () => {
    error('Error!', 'Something went wrong');
  };

  const handleInfo = () => {
    info('Info', 'Here is some information');
  };

  const handleWarning = () => {
    warning('Warning', 'Please be careful');
  };

  const handleAsyncOperation = () => {
    const myPromise = new Promise((resolve) => {
      setTimeout(() => resolve({ message: 'Done!' }), 2000);
    });

    promise(myPromise, {
      loading: 'Loading...',
      success: 'Completed successfully!',
      error: 'Something went wrong',
    });
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleSuccess}
        className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
      >
        Success Toast
      </button>
      <button
        onClick={handleError}
        className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
      >
        Error Toast
      </button>
      <button
        onClick={handleInfo}
        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Info Toast
      </button>
      <button
        onClick={handleWarning}
        className="rounded-md bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700"
      >
        Warning Toast
      </button>
      <button
        onClick={handleAsyncOperation}
        className="rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
      >
        Async Operation
      </button>
    </div>
  );
}
