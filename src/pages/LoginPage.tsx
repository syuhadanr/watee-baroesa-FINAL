import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/admin');
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-admin-bg">
      <div className="w-full max-w-md p-8 space-y-8 bg-admin-card-bg rounded-lg shadow-lg border border-border">
        <h2 className="text-2xl font-bold text-center text-foreground">Admin Login</h2>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          theme="light"
        />
      </div>
    </div>
  );
};

export default LoginPage;