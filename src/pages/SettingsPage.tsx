import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const SettingsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <div className="pb-5 border-b border-gray-200">
        <h3 className="text-2xl leading-6 font-medium text-gray-900">
          Settings
        </h3>
      </div>

      <div className="mt-10 divide-y divide-gray-200">
        <div className="space-y-1">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Profile</h3>
          <p className="max-w-2xl text-sm text-gray-500">
            Manage your account settings and preferences.
          </p>
        </div>
        <div className="mt-6">
          <dl className="divide-y divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Email address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {user?.email}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                Administrator
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-10 space-y-1">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Security</h3>
          <p className="max-w-2xl text-sm text-gray-500">
            Update your password and security preferences.
          </p>
        </div>
        <div className="mt-6">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={() => {}}
            disabled={loading}
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
}; 