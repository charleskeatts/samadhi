/**
 * Settings page
 * Profile and organization configuration
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, Organization } from '@/types';
import type { Role } from '@/types';

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Editable fields
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('sales_rep');

  useEffect(() => {
    const supabase = createClient();
    const loadData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
          setFullName(profileData.full_name || '');
          setRole(profileData.role || 'sales_rep');

          const { data: orgData } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', profileData.org_id)
            .single();

          if (orgData) setOrg(orgData);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), role })
        .eq('id', profile!.id);

      if (updateError) throw updateError;

      setProfile((prev) => prev ? { ...prev, full_name: fullName.trim(), role } : prev);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading settings...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-2">Manage your profile and organization</p>
      </div>

      {/* Profile section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Your Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="label">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="role" className="label">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="input"
            >
              <option value="sales_rep">Sales Representative</option>
              <option value="product_manager">Product Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {saved && (
              <span className="text-sm text-green-600 font-medium">Saved ✓</span>
            )}
          </div>
        </form>
      </div>

      {/* Organization section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Organization</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Organization Name</label>
            <p className="text-slate-700">{org?.name || 'Not set'}</p>
          </div>
          <div>
            <label className="label">Organization ID</label>
            <p className="text-slate-700 font-mono text-sm">{org?.id || 'Not set'}</p>
          </div>
        </div>
      </div>

      {/* CRM Connections section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">CRM Connections</h2>
        <p className="text-slate-600 text-sm mb-6">
          Connect your CRM to automatically sync accounts and pull feedback
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-200 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 mb-2">Salesforce</h3>
            <p className="text-sm text-slate-600 mb-4">
              Sync leads, accounts, and opportunities
            </p>
            <button className="btn btn-secondary w-full opacity-50 cursor-not-allowed">
              Coming soon
            </button>
          </div>

          <div className="border border-slate-200 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 mb-2">HubSpot</h3>
            <p className="text-sm text-slate-600 mb-4">
              Import deals and contacts
            </p>
            <button className="btn btn-secondary w-full opacity-50 cursor-not-allowed">
              Coming soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
