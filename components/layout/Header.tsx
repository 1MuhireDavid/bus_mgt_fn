'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Bars3Icon,
  BellIcon,
  ChevronDownIcon,
  UserIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

interface HeaderProps {
  onMenuClick: () => void;
  user: any;
}

export default function Header({ onMenuClick, user }: HeaderProps) {
  const { logout } = useAuth();

  const userNavigation = [
    { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={onMenuClick}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            <div className="ml-4 lg:ml-0">
              <h1 className="text-xl font-semibold text-gray-900">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-500 relative">
              <BellIcon className="h-6 w-6" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
            </button>

            {/* Profile dropdown */}
            <Menu as="div" className="relative">
              <div>
                <Menu.Button className="flex items-center text-sm rounded-full hover:bg-gray-50 p-2">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                    </span>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {user?.first_name} {user?.last_name}
                  </span>
                  <ChevronDownIcon className="ml-2 h-4 w-4 text-gray-400" />
                </Menu.Button>
              </div>
              
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-900">{user?.email}</p>
                    <p className="text-xs text-gray-500">{user?.user_roles?.[0]}</p>
                  </div>
                  
                  {userNavigation.map((item) => (
                    <Menu.Item key={item.name}>
                      {({ active }) => (
                        <a
                          href={item.href}
                          className={`
                            flex items-center px-4 py-2 text-sm
                            ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}
                          `}
                        >
                          <item.icon className="mr-3 h-4 w-4" />
                          {item.name}
                        </a>
                      )}
                    </Menu.Item>
                  ))}
                  
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={logout}
                        className={`
                          flex items-center w-full px-4 py-2 text-sm text-left
                          ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}
                        `}
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  );
}

function getPageTitle() {
  // This would be enhanced to get actual page title
  return 'Dashboard';
} 