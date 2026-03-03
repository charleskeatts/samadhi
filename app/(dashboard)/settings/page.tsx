/**
 * Settings page
 * Profile and organization configuration
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, Organization } from '@/types';

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
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

          const { data: orgData } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', profileData.org_id)
            .single();

          if (orgData) {
            setOrg(orgData);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabase]);

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
        <div className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <p className="text-slate-700">{profile?.full_name || 'Not set'}</p>
          </div>
          <div>
            <label className="label">Role</label>
            <p className="text-slate-700 capitalize">
              {profile?.role === 'sales_rep' ? 'Sales Representative' : profile?.role}
            </p>
          </div>
        </div>
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
          {/* Salesforce */}
          <div className="border border-slate-200 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 mb-2">Salesforce</h3>
            <p className="text-sm text-slate-600 mb-4">
              Sync leads, accounts, and opportunities
            </p>
            <button className="btn btn-secondary w-full opacity-50 cursor-not-allowed">
              Coming in Phase 6
            </button>
          </div>

          {/* HubSpot */}
          <div className="border border-slate-200 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 mb-2">HubSpot</h3>
            <p className="text-sm text-slate-600 mb-4">
              Import deals and contacts
            </p>
            <button className="btn btn-secondary w-full opacity-50 cursor-not-allowed">
              Coming in Phase 6
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
