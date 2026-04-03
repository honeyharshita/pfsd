import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-8xl mb-6">🦋</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-3">Page Not Found</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          This page seems to have floated away. Let's get you back to a calmer place.
        </p>
        <Link to={createPageUrl('Home')}>
          <Button className="bg-gradient-to-r from-purple-500 to-teal-500 hover:opacity-90 rounded-xl px-6 py-3">
            <Home className="w-4 h-4 mr-2" /> Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}