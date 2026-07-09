'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useRole } from '@/hooks/useRole';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import { UserPlus, RefreshCw, Shield, ChefHat, Factory } from 'lucide-react';
import { ROLE_LABELS, AppRole } from '@/lib/roles';
import { useRouter } from 'next/navigation';

interface Employee {
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: AppRole;
  must_change_password: boolean;
}

const ROLE_COLORS: Record<AppRole, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  kitchen: 'bg-blue-100 text-blue-700',
  factory: 'bg-green-100 text-green-700',
};

const ROLE_ICONS: Record<AppRole, React.ElementType> = {
  super_admin: Shield,
  kitchen: ChefHat,
  factory: Factory,
};

export default function AdminUsersPage() {
  const supabase = createClient();
  const { role, loading: roleLoading } = useRole();
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('kitchen');

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .schema('production')
      .from('user_profiles')
      .select('user_id, full_name, email, role, must_change_password')
      .order('full_name');
    if (error) {
      // Column might not exist yet — fall back to basic select
      const { data: fallback } = await supabase
        .schema('production')
        .from('user_profiles')
        .select('user_id, full_name, email, role')
        .order('full_name');
      setEmployees(((fallback || []) as Employee[]).map(e => ({ ...e, must_change_password: false })));
    } else {
      setEmployees((data || []) as Employee[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!roleLoading && role !== 'super_admin') {
      router.replace('/dashboard');
    }
  }, [role, roleLoading, router]);

  useEffect(() => { load(); }, [load]);

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error('Name and email are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName.trim(), email: email.trim().toLowerCase(), role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      toast.success(`${fullName} added! They can log in with test@123.`);
      setShowForm(false);
      setFullName('');
      setEmail('');
      setNewRole('kitchen');
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (roleLoading || loading) return <LoadingSpinner text="Loading..." />;

  return (
    <div className="space-y-4">
      <ScreenHeader
        icon="👥"
        title="Manage Employees"
        description="Add staff accounts and assign roles. New users log in with the default password test@123 and are prompted to change it."
      />

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">{employees.length} employee{employees.length !== 1 ? 's' : ''}</span>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 text-gray-500 text-sm hover:text-orange-600 touch-manipulation">
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => setShowForm(s => !s)}
            className="btn-primary flex items-center gap-2"
            style={{ width: 'auto', padding: '0.5rem 1rem' }}
          >
            <UserPlus size={16} />
            Add Employee
          </button>
        </div>
      </div>

      {/* Add Employee Form */}
      {showForm && (
        <div className="card space-y-4">
          <h2 className="section-title">New Employee</h2>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text block mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="input-field"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="label-text block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. rahul@icestasy.com"
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label-text block mb-2">Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(['kitchen', 'factory', 'super_admin'] as AppRole[]).map(r => {
                  const Icon = ROLE_ICONS[r];
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setNewRole(r)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 text-sm font-semibold transition-all touch-manipulation ${
                        newRole === r ? 'border-brand-500 bg-orange-50 text-brand-600' : 'border-gray-100 text-gray-600 hover:border-orange-200'
                      }`}
                    >
                      <Icon size={20} />
                      {ROLE_LABELS[r]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              Default password: <strong>test@123</strong> — user will be asked to change it on first login.
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary" style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
                {submitting ? 'Creating...' : 'Create Account'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 touch-manipulation">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employees list */}
      <div className="card p-0 overflow-hidden">
        {employees.length === 0 ? (
          <p className="text-center text-gray-400 py-10">No employees yet. Add one above.</p>
        ) : (
          <div>
            {employees.map((emp, idx) => {
              const Icon = ROLE_ICONS[emp.role] || Shield;
              return (
                <div key={emp.user_id} className={`flex items-center gap-4 px-5 py-4 ${idx < employees.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-orange-50 transition-colors`}>
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0 font-bold text-orange-600 text-sm">
                    {(emp.full_name || emp.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{emp.full_name || '—'}</p>
                    <p className="text-xs text-gray-400 truncate">{emp.email || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${ROLE_COLORS[emp.role]}`}>
                      <Icon size={12} />
                      {ROLE_LABELS[emp.role]}
                    </span>
                    {emp.must_change_password && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                        Awaiting first login
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
