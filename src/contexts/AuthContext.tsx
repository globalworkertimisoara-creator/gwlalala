import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, isInternalRole } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  realRole: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, registrationCode: string, isAgency?: boolean) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isRealAdmin: boolean;
  isAgency: boolean;
  isEmployer: boolean;
  isInternalStaff: boolean;
  isOperationsManager: boolean;
  isDocumentationStaff: boolean;
  isDocumentationLead: boolean;
  isSalesManager: boolean;
  isSalesAgent: boolean;
  isProjectManager: boolean;
  canManageAssignments: boolean;
  roleOverride: AppRole | null;
  setRoleOverride: (role: AppRole | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [realRole, setRealRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleOverride, setRoleOverride] = useState<AppRole | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer to avoid Supabase auth deadlock, but keep loading=true until role resolves
          setTimeout(async () => {
            try {
              const { data: roleData } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .single();

              setRealRole(roleData?.role as AppRole ?? null);
            } catch {
              setRealRole(null);
            } finally {
              setLoading(false);
            }
          }, 0);
        } else {
          setRealRole(null);
          setRoleOverride(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data: roleData }) => {
            setRealRole(roleData?.role as AppRole ?? null);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, registrationCode: string, isAgency: boolean = false) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
          registration_code: registrationCode,
          is_agency: isAgency,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRealRole(null);
    setRoleOverride(null);
  };

  // Only real admins can use role override
  const isRealAdmin = realRole === 'admin';
  
  // The effective role: use override only if user is real admin
  const role = (isRealAdmin && roleOverride) ? roleOverride : realRole;

  const isAdmin = role === 'admin';
  const isSalesManager = role === 'sales_manager';
  const isSalesAgent = role === 'sales_agent';
  const isProjectManager = role === 'project_manager';

  const value = {
    user,
    session,
    role,
    realRole,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isRealAdmin,
    isAgency: role === 'agency',
    isEmployer: role === 'employer',
    isInternalStaff: role ? isInternalRole(role) : false,
    isOperationsManager: role === 'operations_manager',
    isDocumentationStaff: role === 'documentation_staff',
    isDocumentationLead: role === 'documentation_lead',
    isSalesManager,
    isSalesAgent,
    isProjectManager,
    canManageAssignments: isAdmin || isSalesManager || isSalesAgent || isProjectManager,
    roleOverride: isRealAdmin ? roleOverride : null,
    setRoleOverride: (r: AppRole | null) => {
      if (isRealAdmin) setRoleOverride(r);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
