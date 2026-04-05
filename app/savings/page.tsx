'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { savingsAPI } from '@/lib/api';

interface Saving {
  id: number;
  goal_name: string;
  category: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  description?: string;
}

export default function SavingsPage() {
  const router = useRouter();
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    goal_name: '',
    category: 'other',
    target_amount: '',
    target_date: '',
    description: ''
  });

  useEffect(() => {
    fetchSavings();
  }, []);

  const fetchSavings = async () => {
    try {
      setLoading(true);
      const data = await savingsAPI.getAll();
      setSavings(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch savings');
      if (err.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await savingsAPI.create({
        goal_name: formData.goal_name,
        category: formData.category,
        target_amount: parseFloat(formData.target_amount),
        target_date: formData.target_date,
        description: formData.description
      });
      setFormData({
        goal_name: '',
        category: 'other',
        target_amount: '',
        target_date: '',
        description: ''
      });
      setShowForm(false);
      await fetchSavings();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create saving');
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      emergency: '#ef4444',
      vacation: '#3b82f6',
      education: '#8b5cf6',
      home: '#f59e0b',
      vehicle: '#10b981',
      other: '#6b7280'
    };
    return colors[category] || '#6b7280';
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      emergency: '🚨',
      vacation: '✈️',
      education: '📚',
      home: '🏠',
      vehicle: '🚗',
      other: '💰'
    };
    return labels[category] || '💰';
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', marginBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Savings Goals</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {showForm ? '✕ Cancel' : '+ New Goal'}
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '6px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {showForm && (
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                Goal Name
              </label>
              <input
                type="text"
                value={formData.goal_name}
                onChange={(e) => setFormData({ ...formData, goal_name: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="e.g. Emergency Fund"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="emergency">Emergency</option>
                  <option value="vacation">Vacation</option>
                  <option value="education">Education</option>
                  <option value="home">Home</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                  Target Amount
                </label>
                <input
                  type="number"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  required
                  step="0.01"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                Target Date
              </label>
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  minHeight: '60px',
                  fontFamily: 'inherit'
                }}
                placeholder="Why do you want to save this?"
              />
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Create Goal
            </button>
          </form>
        </div>
      )}

      {savings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
          <p>No savings goals yet. Create one to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {savings.map((saving) => {
            const progress = getProgressPercentage(saving.current_amount, saving.target_amount);
            const remaining = saving.target_amount - saving.current_amount;
            const daysLeft = saving.target_date
              ? Math.ceil((new Date(saving.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <div key={saving.id} style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
              onClick={() => router.push(`/savings/${saving.id}`)}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{getCategoryLabel(saving.category)}</span>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>{saving.goal_name}</h3>
                  </div>
                  <span style={{
                    backgroundColor: getCategoryColor(saving.category),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}>
                    {saving.category.charAt(0).toUpperCase() + saving.category.slice(1)}
                  </span>
                </div>

                {saving.description && (
                  <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#6b7280' }}>
                    {saving.description}
                  </p>
                )}

                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    fontSize: '13px'
                  }}>
                    <span style={{ fontWeight: '500' }}>
                      ฿{saving.current_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} / ฿{saving.target_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                    <span style={{ color: '#6b7280' }}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div style={{
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    height: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      backgroundColor: getCategoryColor(saving.category),
                      height: '100%',
                      width: `${progress}%`,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px', color: '#6b7280' }}>
                  <div>
                    <span>Remaining: </span>
                    <strong style={{ color: '#111827' }}>
                      ฿{remaining.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  {daysLeft !== null && (
                    <div>
                      <span>Days left: </span>
                      <strong style={{ color: daysLeft > 0 ? '#111827' : '#dc2626' }}>
                        {daysLeft > 0 ? daysLeft : 'Overdue'}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
