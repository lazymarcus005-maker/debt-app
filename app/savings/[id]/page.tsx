'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { savingsAPI } from '@/lib/api';

interface Saving {
  id: number;
  goal_name: string;
  category: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  description?: string;
  created_at: string;
}

interface Deposit {
  id: number;
  amount: number;
  note?: string;
  deposited_at: string;
}

export default function SavingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const savingId = params.id as string;

  const [saving, setSaving] = useState<Saving | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [depositForm, setDepositForm] = useState({
    amount: '',
    note: ''
  });
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [editingDepositId, setEditingDepositId] = useState<number | null>(null);
  const [actionMenuId, setActionMenuId] = useState<number | null>(null);

  useEffect(() => {
    fetchSavingDetail();
  }, [savingId]);

  const fetchSavingDetail = async () => {
    try {
      setLoading(true);
      const data = await savingsAPI.getById(parseInt(savingId));
      setSaving(data.saving);
      setDeposits(data.deposits);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch saving');
      if (err.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = parseFloat(depositForm.amount);
      if (amount <= 0) {
        setError('Amount must be greater than 0');
        return;
      }

      let result;
      if (editingDepositId) {
        // Update existing deposit
        result = await savingsAPI.updateDeposit(parseInt(savingId), editingDepositId, amount, depositForm.note);
        setDeposits(deposits.map(dep => dep.id === editingDepositId ? {
          ...dep,
          amount: result.deposit.amount,
          note: result.deposit.note
        } : dep));
      } else {
        // Create new deposit
        result = await savingsAPI.addDeposit(parseInt(savingId), amount, depositForm.note);
        setDeposits([
          {
            id: result.deposit.id,
            amount: result.deposit.amount,
            note: result.deposit.note,
            deposited_at: result.deposit.deposited_at
          },
          ...deposits
        ]);
      }
      
      if (saving) {
        setSaving({
          ...saving,
          current_amount: result.new_amount
        });
      }

      setDepositForm({ amount: '', note: '' });
      setShowDepositForm(false);
      setEditingDepositId(null);
      setActionMenuId(null);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save deposit');
    }
  };

  const handleDeleteDeposit = async (depositId: number) => {
    if (!confirm('Delete this deposit?')) return;
    
    try {
      const result = await savingsAPI.deleteDeposit(parseInt(savingId), depositId);
      setDeposits(deposits.filter(dep => dep.id !== depositId));
      
      if (saving) {
        setSaving({
          ...saving,
          current_amount: result.new_amount
        });
      }
      setActionMenuId(null);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete deposit');
    }
  };

  const handleEditDeposit = (deposit: Deposit) => {
    setEditingDepositId(deposit.id);
    setDepositForm({
      amount: deposit.amount.toString(),
      note: deposit.note || ''
    });
    setShowDepositForm(true);
    setActionMenuId(null);
  };

  const handleCancelEdit = () => {
    setEditingDepositId(null);
    setDepositForm({ amount: '', note: '' });
    setShowDepositForm(false);
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

  if (!saving) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Saving not found</div>;
  }

  const progress = Math.min((saving.current_amount / saving.target_amount) * 100, 100);
  const remaining = saving.target_amount - saving.current_amount;

  return (
    <div style={{ padding: '16px', marginBottom: '60px', maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={() => router.push('/savings')} style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        color: '#3b82f6',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        marginBottom: '16px',
        fontSize: '14px',
        padding: '8px 0'
      }}>
        ← Back to Savings
      </button>

      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '28px' }}>{getCategoryLabel(saving.category)}</span>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '20px' }}>{saving.goal_name}</h1>
            <span style={{
              backgroundColor: getCategoryColor(saving.category),
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '500',
              display: 'inline-block'
            }}>
              {saving.category.charAt(0).toUpperCase() + saving.category.slice(1)}
            </span>
          </div>
        </div>

        {saving.description && (
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
            {saving.description}
          </p>
        )}

        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            <span style={{ fontWeight: '500' }}>Progress</span>
            <span style={{ color: '#6b7280' }}>{Math.round(progress)}%</span>
          </div>
          <div style={{
            backgroundColor: '#e5e7eb',
            borderRadius: '8px',
            height: '12px',
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

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px',
          padding: '12px',
          backgroundColor: '#f9fafb',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>CURRENT</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
              ฿{saving.current_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>TARGET</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
              ฿{saving.target_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>REMAINING</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: remaining > 0 ? '#111827' : '#10b981' }}>
              ฿{remaining.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {saving.target_date && (
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Target date: {new Date(saving.target_date).toLocaleDateString('th-TH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        )}
      </div>

      {error && (
        <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <button
        onClick={() => setShowDepositForm(!showDepositForm)}
        style={{
          width: '100%',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: '16px'
        }}
      >
        {showDepositForm ? '✕ Cancel' : editingDepositId ? '✏️ Update Deposit' : '💵 Add Deposit'}
      </button>

      {showDepositForm && (
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #e5e7eb'
        }}>
          <form onSubmit={handleAddDeposit}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                Amount
              </label>
              <input
                type="number"
                value={depositForm.amount}
                onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
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
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                Note (Optional)
              </label>
              <input
                type="text"
                value={depositForm.note}
                onChange={(e) => setDepositForm({ ...depositForm, note: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="e.g., Monthly savings"
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {editingDepositId ? 'Update Deposit' : 'Confirm Deposit'}
            </button>
            {editingDepositId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  width: '100%',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginTop: '8px'
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>
      )}

      <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Deposit History</h2>

      {deposits.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
          No deposits yet
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '8px' }}>
          {deposits.map((deposit) => (
            <div key={deposit.id} style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative'
            }}>
              <div style={{ flex: 1 }}>
                {deposit.note && (
                  <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>
                    {deposit.note}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {new Date(deposit.deposited_at).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })} at {new Date(deposit.deposited_at).toLocaleTimeString('th-TH', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#10b981'
                }}>
                  +฿{deposit.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </div>

                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setActionMenuId(actionMenuId === deposit.id ? null : deposit.id)}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    ⋮
                  </button>

                  {actionMenuId === deposit.id && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      zIndex: 10,
                      minWidth: '120px',
                      marginTop: '4px'
                    }}>
                      <button
                        onClick={() => handleEditDeposit(deposit)}
                        style={{
                          width: '100%',
                          backgroundColor: 'transparent',
                          border: 'none',
                          padding: '10px 12px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: '#3b82f6',
                          borderBottom: '1px solid #e5e7eb'
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDeposit(deposit.id)}
                        style={{
                          width: '100%',
                          backgroundColor: 'transparent',
                          border: 'none',
                          padding: '10px 12px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: '#ef4444'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
