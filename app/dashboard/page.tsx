'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { billsAPI, savingsAPI } from '@/lib/api';

interface Bill {
  id: number;
  name: string;
  billing_type: string;
  sub_type: string;
  amount?: number;
  total_amount?: number;
  remaining_amount?: number;
  due_day: number;
  last_paid_at?: string;
}

interface Creditor {
  id: number;
  name: string;
  type: string;
}

interface SavingGoal {
  id: number;
  goal_name: string;
  category: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  description?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [bills, setBills] = useState<Bill[]>([]);
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddCreditorModal, setShowAddCreditorModal] = useState(false);
  const [newCreditorName, setNewCreditorName] = useState('');
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<Bill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentError, setPaymentError] = useState('');
  const [billForm, setBillForm] = useState({
    name: '',
    billing_type: 'recurring',
    sub_type: 'utility',
    amount: '',
    total_amount: '',
    remaining_amount: '',
    installment_amount: '',
    creditor_id: '',
    due_day: '',
    start_date: ''
  });
  const [billError, setBillError] = useState('');
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);
  const [goalForm, setGoalForm] = useState({
    goal_name: '',
    category: 'other',
    target_amount: '',
    target_date: '',
    description: ''
  });
  const [goalError, setGoalError] = useState('');
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<SavingGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');
  const [depositError, setDepositError] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [goalDeposits, setGoalDeposits] = useState<any[]>([]);
  const [billsSubTab, setBillsSubTab] = useState<'recurring' | 'debts'>('recurring');
  const [searchBill, setSearchBill] = useState('');
  const [upcomingBillsCount, setUpcomingBillsCount] = useState(0);
  const [overdueBillsCount, setOverdueBillsCount] = useState(0);

  useEffect(() => {
    // Check authentication
    const token = Cookies.get('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Load user data and bills
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [loadedBills, loadedCreditors, loadedSavings] = await Promise.all([
        billsAPI.getAll(),
        fetch('/api/creditors')
          .then(res => res.json())
          .then(data => data.creditors || []),
        savingsAPI.getAll()
      ]);
      setBills(loadedBills);
      setCreditors(loadedCreditors);
      setSavingGoals(loadedSavings || []);
      console.log('Savings loaded:', loadedSavings);
    } catch (error) {
      console.error('Failed to load data:', error);
      setSavingGoals([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate counts whenever bills change
  useEffect(() => {
    if (bills.length > 0) {
      const upcomingCount = bills.filter(bill => {
        const daysUntil = getDaysUntilDue(bill);
        return daysUntil >= 0 && daysUntil <= 10 && !isOverdue(bill);
      }).length;
      const overdueCount = bills.filter(bill => isOverdue(bill)).length;
      setUpcomingBillsCount(upcomingCount);
      setOverdueBillsCount(overdueCount);
    }
  }, [bills]);

  const handleLogout = () => {
    Cookies.remove('auth_token');
    router.push('/login');
  };

  const handleAddFAB = () => {
    if (currentTab === 'saving') {
      setShowAddGoalModal(true);
    } else if (currentTab === 'bills') {
      setShowAddBillModal(true);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoalError('');

    try {
      const { goal_name, category, target_amount, target_date, description } = goalForm;

      if (!goal_name || !target_amount) {
        setGoalError('Please fill in required fields');
        return;
      }

      await savingsAPI.create({
        goal_name,
        category,
        target_amount: parseFloat(target_amount),
        target_date,
        description
      });

      await loadData();
      setGoalForm({ goal_name: '', category: 'other', target_amount: '', target_date: '', description: '' });
      setShowAddGoalModal(false);
    } catch (error: any) {
      setGoalError(error.message || 'Failed to add goal');
    }
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

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const isBillPaid = (bill: Bill): boolean => {
    if (!bill.last_paid_at) return false;
    
    const today = new Date();
    const lastPaid = new Date(bill.last_paid_at);
    
    // For recurring bills, check if paid this month or after due day
    if (bill.billing_type === 'recurring') {
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const lastPaidMonth = lastPaid.getMonth();
      const lastPaidYear = lastPaid.getFullYear();
      
      // If paid in current month, it's paid
      if (lastPaidYear === currentYear && lastPaidMonth === currentMonth) {
        return true;
      }
      
      // If paid last month and before due day of this month
      if (today.getDate() < bill.due_day) {
        if (lastPaidYear === currentYear && lastPaidMonth === currentMonth - 1) {
          return true;
        }
      }
      
      return false;
    }
    
    // For debts, check if paid recently (within 30 days)
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    return lastPaid >= thirtyDaysAgo;
  };

  const getDaysUntilDue = (bill: Bill): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let dueDate = new Date(currentYear, currentMonth, bill.due_day);
    
    if (dueDate < today) {
      dueDate = new Date(currentYear, currentMonth + 1, bill.due_day);
    }
    
    const timeDiff = dueDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const isOverdue = (bill: Bill): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const dueDate = new Date(currentYear, currentMonth, bill.due_day);
    return !isBillPaid(bill) && today > dueDate;
  };

  const getUpcomingBills = (): Bill[] => {
    return bills
      .filter(bill => {
        const daysUntil = getDaysUntilDue(bill);
        return daysUntil >= 0 && daysUntil <= 10 && !isOverdue(bill);
      })
      .sort((a, b) => getDaysUntilDue(a) - getDaysUntilDue(b));
  };

  const getOverdueBills = (): Bill[] => {
    return bills.filter(bill => isOverdue(bill));
  };

  const openDepositModal = async (goal: SavingGoal) => {
    setSelectedGoalForDeposit(goal);
    setDepositAmount('');
    setDepositNote('');
    setDepositError('');
    setShowDepositModal(true);
    
    try {
      const data = await savingsAPI.getById(goal.id);
      setGoalDeposits(data.deposits || []);
    } catch (error) {
      console.error('Failed to load deposits:', error);
    }
  };

  const handleRecordDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError('');

    if (!selectedGoalForDeposit || !depositAmount) {
      setDepositError('Please enter an amount');
      return;
    }

    try {
      const amount = parseFloat(depositAmount);
      if (amount <= 0) {
        setDepositError('Amount must be greater than 0');
        return;
      }

      const result = await savingsAPI.addDeposit(selectedGoalForDeposit.id, amount, depositNote);
      
      setSavingGoals(savingGoals.map(goal => 
        goal.id === selectedGoalForDeposit.id 
          ? { ...goal, current_amount: result.new_amount }
          : goal
      ));

      setGoalDeposits([
        {
          id: result.deposit.id,
          amount: result.deposit.amount,
          note: result.deposit.note,
          deposited_at: result.deposit.deposited_at
        },
        ...goalDeposits
      ]);

      setDepositAmount('');
      setDepositNote('');
    } catch (error: any) {
      setDepositError(error.response?.data?.error || 'Failed to record deposit');
    }
  };

  const handleBillFormChange = (field: string, value: string) => {
    setBillForm(prev => ({
      ...prev,
      [field]: value,
      // Reset sub_type when billing_type changes
      ...(field === 'billing_type' && {
        sub_type: value === 'recurring' ? 'utility' : 'credit_card'
      })
    }));
    setBillError('');
  };

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setBillError('');

    try {
      const { name, billing_type, sub_type, due_day, start_date } = billForm;

      if (!name || !due_day || !start_date) {
        setBillError('Please fill in all required fields');
        return;
      }

      const billData: any = {
        name,
        billing_type,
        sub_type,
        due_day: parseInt(due_day),
        start_date
      };

      if (billing_type === 'recurring') {
        if (!billForm.amount) {
          setBillError('Amount is required for recurring bills');
          return;
        }
        billData.amount = parseFloat(billForm.amount);
      } else if (billing_type === 'debt') {
        if (!billForm.total_amount || !billForm.remaining_amount) {
          setBillError('Total and remaining amounts are required for debts');
          return;
        }
        billData.total_amount = parseFloat(billForm.total_amount);
        billData.remaining_amount = parseFloat(billForm.remaining_amount);

        if ((sub_type === 'loan' || sub_type === 'installment') && billForm.installment_amount) {
          billData.installment_amount = parseFloat(billForm.installment_amount);
        }

        // Add creditor for loan/installment
        if ((sub_type === 'loan' || sub_type === 'installment') && billForm.creditor_id) {
          billData.creditor_id = parseInt(billForm.creditor_id);
        }
      }

      await billsAPI.create(billData);
      
      // Refresh bills list
      await loadData();
      
      // Reset form
      setBillForm({
        name: '',
        billing_type: 'recurring',
        sub_type: 'utility',
        amount: '',
        total_amount: '',
        remaining_amount: '',
        installment_amount: '',
        creditor_id: '',
        due_day: '',
        start_date: ''
      });

      setShowAddBillModal(false);
    } catch (error: any) {
      setBillError(error.message || 'Failed to add bill');
    }
  };

  const openPaymentModal = (bill: Bill) => {
    setSelectedBillForPayment(bill);
    setPaymentAmount(bill.amount?.toString() || '');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentError('');
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');

    if (!selectedBillForPayment) {
      setPaymentError('No bill selected');
      return;
    }

    if (!paymentAmount) {
      setPaymentError('Payment amount is required');
      return;
    }

    try {
      setLoading(true);
      const token = Cookies.get('auth_token');

      const response = await fetch(`/api/bills/${selectedBillForPayment.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          cycle_due_date: paymentDate
        })
      });

      if (!response.ok) {
        const data = await response.json();
        setPaymentError(data.error || 'Failed to record payment');
        return;
      }

      // Reset form and refresh bills
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setShowPaymentModal(false);
      setSelectedBillForPayment(null);
      await loadData();
    } catch (error: any) {
      setPaymentError(error.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCreditor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCreditorName.trim()) {
      return;
    }

    try {
      setLoading(true);
      const token = Cookies.get('auth_token');

      const response = await fetch('/api/creditors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCreditorName,
          type: 'bank'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to add creditor');
        return;
      }

      const data = await response.json();
      
      // Add new creditor to list
      setCreditors([...creditors, data.creditor]);
      
      // Select the new creditor
      setBillForm(prev => ({
        ...prev,
        creditor_id: data.creditor.id.toString()
      }));

      // Reset and close modal
      setNewCreditorName('');
      setShowAddCreditorModal(false);
    } catch (error: any) {
      alert(error.message || 'Failed to add creditor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <header>
        <h1>💰 Finance Manager</h1>
        <div className="icons">
          <span onClick={() => alert('Notifications')} style={{ position: 'relative' }}>
            🔔
            {(upcomingBillsCount > 0 || overdueBillsCount > 0) && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                backgroundColor: overdueBillsCount > 0 ? '#ef4444' : '#f59e0b',
                color: 'white',
                fontSize: '10px',
                fontWeight: '700',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {upcomingBillsCount + overdueBillsCount}
              </span>
            )}
          </span>
          <span onClick={() => alert('Settings')}>⚙️</span>
        </div>
      </header>

      {/* Dashboard Tab */}
      {currentTab === 'dashboard' && (
        <section className="active" style={{ display: 'block' }}>
          <h2>Overview</h2>

          <div className="summary-grid">
            <div className="sum-card">
              <div className="sum-label">Total Saved</div>
              <div className="sum-value">45,000 ฿</div>
            </div>
            <div className="sum-card">
              <div className="sum-label">Bills This Month</div>
              <div className="sum-value">9,867 ฿</div>
            </div>
          </div>

          <div className="alert-box" style={{
            background: overdueBillsCount > 0 ? '#fff5f5' : '#f0fdf4',
            borderColor: overdueBillsCount > 0 ? '#feb2b2' : '#bbf7d0',
            position: 'relative'
          }}>
            <div className="alert-title" style={{ color: overdueBillsCount > 0 ? '#c53030' : '#15803d' }}>
              ⚠️ Important
            </div>
            <div style={{ fontSize: '12px', marginBottom: '4px' }}>
              {upcomingBillsCount + overdueBillsCount} bill{upcomingBillsCount + overdueBillsCount !== 1 ? 's' : ''} to pay
            </div>
            {overdueBillsCount > 0 && (
              <span style={{
                display: 'inline-block',
                background: '#ef4444',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '3px',
                fontSize: '9px',
                fontWeight: '700',
                marginTop: '4px'
              }}>
                ⚠️ {overdueBillsCount} OVERDUE
              </span>
            )}
          </div>

          <h2>Next Bills</h2>
          {getUpcomingBills().slice(0, 3).map((bill) => {
            const daysUntil = getDaysUntilDue(bill);
            return (
              <div key={bill.id} className="bill-item" style={{
                borderLeftColor: '#ef4444',
                background: '#fff5f5'
              }}>
                <div className="bill-left">
                  <div className="bill-name">{bill.name}</div>
                  <div className="bill-meta">Due {bill.due_day}th</div>
                </div>
                <div className="bill-status-right">
                  <span className="status-badge" style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '10px'
                  }}>
                    {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })}
          
          {getOverdueBills().map((bill) => (
            <div key={`overdue-${bill.id}`} className="bill-item" style={{
              borderLeftColor: '#991b1b',
              background: '#7f1d1d',
              borderLeft: '4px solid #dc2626'
            }}>
              <div className="bill-left">
                <div className="bill-name" style={{ color: 'white' }}>🚨 {bill.name}</div>
                <div className="bill-meta" style={{ color: '#fca5a5' }}>OVERDUE • Due {bill.due_day}th</div>
              </div>
              <div className="bill-status-right">
                <span className="status-badge" style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  fontSize: '10px'
                }}>
                  OVERDUE
                </span>
              </div>
            </div>
          ))}

          <h2>Main Goal</h2>
          <div className="goal-card">
            <div className="goal-header">
              <div className="goal-name">🏖️ Vacation Fund</div>
              <div className="goal-date">Jun 2026</div>
            </div>
            <div className="goal-amount">40,000 / 100,000 ฿</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '40%' }}></div>
            </div>
            <div className="progress-label">
              <span>40% complete</span>
              <span>60,000 ฿ left</span>
            </div>
          </div>
        </section>
      )}

      {/* Saving Tab */}
      {currentTab === 'saving' && (
        <section className="active" style={{ display: 'block' }}>
          <h2>Your Goals</h2>

          {loading && (
            <div className="empty-state">
              <div className="empty-icon">⏳</div>
              <div className="empty-text">Loading your goals...</div>
            </div>
          )}

          {!loading && savingGoals.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">💰</div>
              <div className="empty-text">No savings goals yet. Create one to get started!</div>
            </div>
          )}

          {!loading && savingGoals.length > 0 && (
            savingGoals.map((goal) => {
              const progress = getProgressPercentage(goal.current_amount, goal.target_amount);

              return (
                <div
                  key={goal.id}
                  className="bill-item"
                  onClick={() => openDepositModal(goal)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="bill-left">
                    <div className="bill-name">{getCategoryLabel(goal.category)} {goal.goal_name}</div>
                    <div className="bill-meta">Target: ฿{goal.target_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <div style={{
                        backgroundColor: '#e5e7eb',
                        borderRadius: '4px',
                        height: '6px',
                        flex: 1,
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          backgroundColor: getCategoryColor(goal.category),
                          height: '100%',
                          width: `${progress}%`,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <span style={{ fontSize: '11px', color: '#6b7280', minWidth: '28px', textAlign: 'right' }}>
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="bill-amount">฿{goal.current_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} saved</div>
                  </div>
                  <div className="bill-status-right">
                    <span className="status-badge" style={{ backgroundColor: getCategoryColor(goal.category) }}>Click to add</span>
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      {/* Bills Tab */}
      {currentTab === 'bills' && (
        <section className="active" style={{ display: 'block' }}>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="🔍 Search bills..."
              value={searchBill}
              onChange={(e) => setSearchBill(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <button
              onClick={() => setBillsSubTab('recurring')}
              style={{
                padding: '10px 16px',
                backgroundColor: billsSubTab === 'recurring' ? '#3b82f6' : 'transparent',
                color: billsSubTab === 'recurring' ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: billsSubTab === 'recurring' ? '600' : '500',
                transition: 'all 0.2s'
              }}
            >
              ⚡ Recurring
            </button>
            <button
              onClick={() => setBillsSubTab('debts')}
              style={{
                padding: '10px 16px',
                backgroundColor: billsSubTab === 'debts' ? '#3b82f6' : 'transparent',
                color: billsSubTab === 'debts' ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: billsSubTab === 'debts' ? '600' : '500',
                transition: 'all 0.2s'
              }}
            >
              💳 Debts
            </button>
          </div>

          {billsSubTab === 'recurring' && (
            <div>
              {bills
                .filter((b) => b.billing_type === 'recurring' && b.name.toLowerCase().includes(searchBill.toLowerCase()))
                .length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">⚡</div>
                  <div className="empty-text">{searchBill ? 'No matching bills found' : 'No recurring bills'}</div>
                </div>
              ) : (
                bills
                  .filter((b) => b.billing_type === 'recurring' && b.name.toLowerCase().includes(searchBill.toLowerCase()))
                  .map((bill) => {
                    const daysUntil = getDaysUntilDue(bill);
                    const billIsOverdue = isOverdue(bill);
                    return (
                      <div
                        key={bill.id}
                        className="bill-item"
                        onClick={() => openPaymentModal(bill)}
                        style={{
                          cursor: 'pointer',
                          borderLeftColor: billIsOverdue ? '#991b1b' : undefined,
                          background: billIsOverdue ? '#7f1d1d' : undefined
                        }}
                      >
                        <div className="bill-left">
                          <div className="bill-name" style={{ color: billIsOverdue ? 'white' : undefined }}>⚡ {bill.name}</div>
                          <div className="bill-meta" style={{ color: billIsOverdue ? '#fca5a5' : undefined }}>{bill.sub_type} • Due {bill.due_day}th</div>
                          <div className="bill-amount" style={{ color: billIsOverdue ? '#fca5a5' : undefined }}>{bill.amount} ฿/month</div>
                        </div>
                        <div className="bill-status-right" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span className="status-badge" style={{
                            backgroundColor: billIsOverdue ? '#dc2626' : (isBillPaid(bill) ? '#10b981' : '#f59e0b'),
                            color: 'white',
                            fontSize: '9px'
                          }}>
                            {billIsOverdue ? 'OVERDUE' : (isBillPaid(bill) ? '✓ Paid' : `${daysUntil}d`)}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}

          {billsSubTab === 'debts' && (
            <div>
              {bills
                .filter((b) => b.billing_type === 'debt' && b.name.toLowerCase().includes(searchBill.toLowerCase()))
                .length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💳</div>
                  <div className="empty-text">{searchBill ? 'No matching debts found' : 'No debts'}</div>
                </div>
              ) : (
                bills
                  .filter((b) => b.billing_type === 'debt' && b.name.toLowerCase().includes(searchBill.toLowerCase()))
                  .map((bill) => {
                    const daysUntil = getDaysUntilDue(bill);
                    const billIsOverdue = isOverdue(bill);
                    return (
                      <div
                        key={bill.id}
                        className="bill-item"
                        onClick={() => openPaymentModal(bill)}
                        style={{
                          cursor: 'pointer',
                          borderLeftColor: billIsOverdue ? '#991b1b' : undefined,
                          background: billIsOverdue ? '#7f1d1d' : undefined
                        }}
                      >
                        <div className="bill-left">
                          <div className="bill-name" style={{ color: billIsOverdue ? 'white' : undefined }}>💳 {bill.name}</div>
                          <div className="bill-meta" style={{ color: billIsOverdue ? '#fca5a5' : undefined }}>{bill.sub_type} • Due {bill.due_day}th</div>
                          <div className="bill-amount-large" style={{ color: billIsOverdue ? '#fca5a5' : undefined }}>{bill.total_amount || bill.amount || 0} ฿</div>
                          {bill.last_paid_at && (
                            <div className="bill-meta" style={{ color: billIsOverdue ? '#fca5a5' : undefined }}>Last paid: {new Date(bill.last_paid_at).toLocaleDateString()}</div>
                          )}
                        </div>
                        <div className="bill-status-right" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span className="status-badge" style={{
                            backgroundColor: billIsOverdue ? '#dc2626' : (isBillPaid(bill) ? '#10b981' : '#f59e0b'),
                            color: 'white',
                            fontSize: '9px'
                          }}>
                            {billIsOverdue ? 'OVERDUE' : (isBillPaid(bill) ? '✓ Paid' : `${daysUntil}d`)}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </section>
      )}

      {/* More Tab */}
      {currentTab === 'more' && (
        <section className="active" style={{ display: 'block' }}>
          <div className="profile-header">
            <div className="profile-avatar">👤</div>
            <div className="profile-name">John Doe</div>
            <div className="profile-email">john@example.com</div>
          </div>

          <div className="menu-section">
            <div className="menu-title">Preferences</div>
            <div className="menu-item">
              <span className="menu-label">Settings</span>
              <span className="menu-icon">⚙️</span>
            </div>
            <div className="menu-item">
              <span className="menu-label">Notifications</span>
              <span className="menu-icon">🔔</span>
            </div>
          </div>

          <div className="menu-section">
            <div className="menu-title">Support</div>
            <div className="menu-item">
              <span className="menu-label">Help & FAQ</span>
              <span className="menu-icon">❓</span>
            </div>
            <div className="menu-item">
              <span className="menu-label">Contact Us</span>
              <span className="menu-icon">📧</span>
            </div>
          </div>

          <div className="menu-section">
            <div className="menu-title">About</div>
            <div className="menu-item">
              <span className="menu-label">App Version</span>
              <span className="menu-icon">1.0.0</span>
            </div>
            <div className="menu-item">
              <span className="menu-label">Privacy Policy</span>
              <span className="menu-icon">📄</span>
            </div>
          </div>

          <div className="menu-section">
            <div
              className="menu-item"
              onClick={handleLogout}
              style={{
                borderTop: '1px solid #e2e8f0',
                color: '#f56565',
                cursor: 'pointer'
              }}
            >
              <span className="menu-label">Logout</span>
              <span className="menu-icon">🚪</span>
            </div>
          </div>
        </section>
      )}

      {/* FAB Button */}
      <button className="fab" onClick={handleAddFAB} style={{ display: 'none' }}>
        +
      </button>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <div
          className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentTab('dashboard')}
        >
          <div className="nav-icon">📊</div>
          <span>Dashboard</span>
        </div>
        <div
          className={`nav-item ${currentTab === 'saving' ? 'active' : ''}`}
          onClick={() => setCurrentTab('saving')}
        >
          <div className="nav-icon">💰</div>
          <span>Saving</span>
        </div>
        <div
          className={`nav-item ${currentTab === 'bills' ? 'active' : ''}`}
          onClick={() => setCurrentTab('bills')}
        >
          <div className="nav-icon">💳</div>
          <span>Bills</span>
        </div>
        <div
          className={`nav-item ${currentTab === 'more' ? 'active' : ''}`}
          onClick={() => setCurrentTab('more')}
        >
          <div className="nav-icon">⋯</div>
          <span>More</span>
        </div>
      </div>

      {/* Add Goal Modal */}
      {showAddGoalModal && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <span>Add Saving Goal</span>
              <button
                className="modal-close"
                onClick={() => {
                  setShowAddGoalModal(false);
                  setGoalError('');
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddGoal}>
              <div className="form-group">
                <label>Goal Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Vacation Fund"
                  value={goalForm.goal_name}
                  onChange={(e) => setGoalForm({ ...goalForm, goal_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={goalForm.category}
                  onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
                  required
                >
                  <option value="emergency">Emergency</option>
                  <option value="vacation">Vacation</option>
                  <option value="education">Education</option>
                  <option value="home">Home</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Target Amount (฿) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="100,000"
                  value={goalForm.target_amount}
                  onChange={(e) => setGoalForm({ ...goalForm, target_amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Target Date</label>
                <input
                  type="date"
                  value={goalForm.target_date}
                  onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Why do you want to save this?"
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                  style={{ minHeight: '60px', fontFamily: 'inherit' }}
                />
              </div>
              {goalError && (
                <div style={{
                  background: '#fff5f5',
                  border: '1px solid #feb2b2',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '12px',
                  color: '#742a2a',
                  marginBottom: '10px'
                }}>
                  {goalError}
                </div>
              )}
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Adding...' : 'Add Goal'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Bill Modal */}
      {showAddBillModal && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <span>Add Bill</span>
              <button
                className="modal-close"
                onClick={() => {
                  setShowAddBillModal(false);
                  setBillError('');
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddBill}>
              <div className="form-group">
                <label>Bill Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Electricity"
                  value={billForm.name}
                  onChange={(e) => handleBillFormChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Type *</label>
                <select
                  value={billForm.billing_type}
                  onChange={(e) => handleBillFormChange('billing_type', e.target.value)}
                  required
                >
                  <option value="recurring">Recurring Bill</option>
                  <option value="debt">Debt</option>
                </select>
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  value={billForm.sub_type}
                  onChange={(e) => handleBillFormChange('sub_type', e.target.value)}
                  required
                >
                  {billForm.billing_type === 'recurring' ? (
                    <>
                      <option value="utility">Utility (Water, Electric)</option>
                      <option value="subscription">Subscription (Internet, Rent)</option>
                    </>
                  ) : (
                    <>
                      <option value="credit_card">Credit Card</option>
                      <option value="loan">Loan</option>
                      <option value="installment">Installment</option>
                    </>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  value={billForm.start_date}
                  onChange={(e) => handleBillFormChange('start_date', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Due Day (1-31) *</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="e.g., 15"
                  value={billForm.due_day}
                  onChange={(e) => handleBillFormChange('due_day', e.target.value)}
                  required
                />
              </div>

              {billForm.billing_type === 'recurring' && (
                <div className="form-group">
                  <label>Amount (฿/month) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 100"
                    value={billForm.amount}
                    onChange={(e) => handleBillFormChange('amount', e.target.value)}
                    required
                  />
                </div>
              )}

              {billForm.billing_type === 'debt' && (
                <>
                  <div className="form-group">
                    <label>Total Amount (฿) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g., 50000"
                      value={billForm.total_amount}
                      onChange={(e) => handleBillFormChange('total_amount', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Remaining Amount (฿) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g., 35000"
                      value={billForm.remaining_amount}
                      onChange={(e) => handleBillFormChange('remaining_amount', e.target.value)}
                      required
                    />
                  </div>

                  {(billForm.sub_type === 'loan' || billForm.sub_type === 'installment') && (
                    <>
                      <div className="form-group">
                        <label>Installment Amount (฿)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g., 5000"
                          value={billForm.installment_amount}
                          onChange={(e) => handleBillFormChange('installment_amount', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Creditor / Lender</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                          <select
                            value={billForm.creditor_id}
                            onChange={(e) => handleBillFormChange('creditor_id', e.target.value)}
                            style={{ flex: 1 }}
                          >
                            <option value="">Select a creditor...</option>
                            {creditors.map((creditor) => (
                              <option key={creditor.id} value={creditor.id}>
                                {creditor.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setShowAddCreditorModal(true)}
                            style={{
                              padding: '8px 12px',
                              background: '#e2e8f0',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {billError && (
                <div style={{
                  background: '#fff5f5',
                  border: '1px solid #feb2b2',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '12px',
                  color: '#742a2a'
                }}>
                  {billError}
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Adding...' : 'Add Bill'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedBillForPayment && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <span>Record Payment</span>
              <button
                className="modal-close"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedBillForPayment(null);
                  setPaymentError('');
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className="form-group">
                <label>Bill</label>
                <div style={{
                  background: '#f7fafc',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#2d3748'
                }}>
                  {selectedBillForPayment.name}
                </div>
              </div>

              <div className="form-group">
                <label>Payment Amount (฿) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Payment Date *</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>

              {paymentError && (
                <div style={{
                  background: '#fff5f5',
                  border: '1px solid #feb2b2',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '12px',
                  color: '#742a2a'
                }}>
                  {paymentError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? 'Recording...' : 'Record Payment'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedBillForPayment(null);
                    setPaymentError('');
                  }}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && selectedGoalForDeposit && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <span>💰 {selectedGoalForDeposit.goal_name}</span>
              <button
                className="modal-close"
                onClick={() => {
                  setShowDepositModal(false);
                  setSelectedGoalForDeposit(null);
                  setDepositError('');
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Progress</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                <span style={{ fontWeight: '500' }}>
                  ฿{selectedGoalForDeposit.current_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} / ฿{selectedGoalForDeposit.target_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
                <span style={{ color: '#6b7280' }}>
                  {Math.round(getProgressPercentage(selectedGoalForDeposit.current_amount, selectedGoalForDeposit.target_amount))}%
                </span>
              </div>
              <div style={{ backgroundColor: '#e5e7eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: getCategoryColor(selectedGoalForDeposit.category), height: '100%', width: `${getProgressPercentage(selectedGoalForDeposit.current_amount, selectedGoalForDeposit.target_amount)}%` }} />
              </div>
            </div>

            <form onSubmit={handleRecordDeposit}>
              <div className="form-group">
                <label>Deposit Amount (฿) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Note</label>
                <input
                  type="text"
                  placeholder="e.g., Monthly savings"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                />
              </div>

              {depositError && (
                <div style={{
                  background: '#fff5f5',
                  border: '1px solid #feb2b2',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '12px',
                  color: '#742a2a',
                  marginBottom: '10px'
                }}>
                  {depositError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Record Deposit
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDepositModal(false);
                    setSelectedGoalForDeposit(null);
                    setDepositError('');
                  }}
                  style={{ flex: 1 }}
                >
                  Close
                </button>
              </div>
            </form>

            {goalDeposits.length > 0 && (
              <div style={{ marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>Deposit History</h3>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {goalDeposits.map((deposit) => (
                    <div key={deposit.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      fontSize: '12px',
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      <div>
                        {deposit.note && <div style={{ fontWeight: '500' }}>{deposit.note}</div>}
                        <div style={{ color: '#6b7280', fontSize: '11px' }}>
                          {new Date(deposit.deposited_at).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                      <div style={{ color: '#10b981', fontWeight: '600' }}>
                        +฿{deposit.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Creditor Modal */}
      {showAddCreditorModal && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <span>Add New Creditor</span>
              <button
                className="modal-close"
                onClick={() => {
                  setShowAddCreditorModal(false);
                  setNewCreditorName('');
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddCreditor}>
              <div className="form-group">
                <label>Creditor Name *</label>
                <input
                  type="text"
                  placeholder="e.g., New Bank Name"
                  value={newCreditorName}
                  onChange={(e) => setNewCreditorName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? 'Adding...' : 'Add Creditor'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddCreditorModal(false);
                    setNewCreditorName('');
                  }}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
