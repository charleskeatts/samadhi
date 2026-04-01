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
            .eq('id', profileData.organization_id)
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
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink-muted)', fontSize: '11px', letterSpacing: '0.12em' }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Profile and organization configuration</p>
      </div>

      {/* Profile section */}
      <div className="card">
        <div style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '1rem',
          fontWeight: 300,
          color: 'var(--ink)',
          letterSpacing: '0.06em',
          marginBottom: '1.4rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border)',
        }}>
          Your Profile
        </div>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            <div style={{ padding: '0.6rem 0.8rem', border: '1px solid #3a1515', background: '#1a0a0a', fontSize: '10px', color: '#f87171', letterSpacing: '0.06em' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ opacity: saving ? 0.5 : 1 }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {saved && (
              <span style={{ fontSize: '10px', color: 'var(--green)', letterSpacing: '0.12em' }}>
                Saved ✓
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Organization section */}
      <div className="card">
        <div style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '1rem',
          fontWeight: 300,
          color: 'var(--ink)',
          letterSpacing: '0.06em',
          marginBottom: '1.4rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border)',
        }}>
          Organization
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div className="label">Organization Name</div>
            <p style={{ fontSize: '13px', color: 'var(--ink-dim)' }}>{org?.name || 'Not set'}</p>
          </div>
          <div>
            <div className="label">Organization ID</div>
            <p style={{ fontSize: '11px', color: 'var(--ink-muted)', fontFamily: '"DM Mono", monospace' }}>{org?.id || 'Not set'}</p>
          </div>
        </div>
      </div>

      {/* CRM Connections section */}
      <div className="card">
        <div style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '1rem',
          fontWeight: 300,
          color: 'var(--ink)',
          letterSpacing: '0.06em',
          marginBottom: '0.5rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border)',
        }}>
          CRM Connections
        </div>
        <p style={{ fontSize: '10px', color: 'var(--ink-muted)', letterSpacing: '0.08em', marginBottom: '1.4rem' }}>
          Connect your CRM to automatically sync accounts and pull feedback
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ border: '1px solid var(--border)', padding: '1rem 1.1rem' }}>
            <div style={{ fontSize: '11px', color: 'var(--ink-dim)', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Salesforce</div>
            <p style={{ fontSize: '10px', color: 'var(--ink-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
              Sync leads, accounts, and opportunities
            </p>
            <button className="btn" style={{ width: '100%', opacity: 0.4, cursor: 'not-allowed', fontSize: '9px' }} disabled>
              Coming Soon
            </button>
          </div>

          <div style={{ border: '1px solid var(--border)', padding: '1rem 1.1rem' }}>
            <div style={{ fontSize: '11px', color: 'var(--ink-dim)', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>HubSpot</div>
            <p style={{ fontSize: '10px', color: 'var(--ink-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
              Import deals and contacts
            </p>
            <button className="btn" style={{ width: '100%', opacity: 0.4, cursor: 'not-allowed', fontSize: '9px' }} disabled>
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
