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
  description?: string;
  amount?: number;
  total_amount?: number;
  remaining_amount?: number;
  due_day: number;
  start_date?: string;
  installment_amount?: number;
  creditor_id?: number | null;
  last_paid_at?: string;
  paid_installments?: number;
  total_installments?: number | null;
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
  const [showBillDetailModal, setShowBillDetailModal] = useState(false);
  const [showAddCreditorModal, setShowAddCreditorModal] = useState(false);
  const [newCreditorName, setNewCreditorName] = useState('');
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<Bill | null>(null);
  const [selectedBillForDetail, setSelectedBillForDetail] = useState<Bill | null>(null);
  const [selectedBillPayments, setSelectedBillPayments] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentError, setPaymentError] = useState('');
  const [billDetailError, setBillDetailError] = useState('');
  const [billDetailLoading, setBillDetailLoading] = useState(false);
  const [billForm, setBillForm] = useState({
    name: '',
    billing_type: 'recurring',
    sub_type: 'utility',
    description: '',
    amount: '',
    total_amount: '',
    remaining_amount: '',
    installment_amount: '',
    creditor_id: '',
    due_day: '',
    start_date: ''
  });
  const [billError, setBillError] = useState('');
  const [editingBillId, setEditingBillId] = useState<number | null>(null);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);
  const [goalForm, setGoalForm] = useState({
    goal_name: '',
    category: 'other',
    target_amount: '',
    target_date: '',
    description: ''
  });
  const [goalError, setGoalError] = useState('');
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [selectedGoalForActions, setSelectedGoalForActions] = useState<SavingGoal | null>(null);
  const [showGoalActionsModal, setShowGoalActionsModal] = useState(false);
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<SavingGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');
  const [depositError, setDepositError] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [goalDeposits, setGoalDeposits] = useState<any[]>([]);
  const [billsSubTab, setBillsSubTab] = useState<'recurring' | 'debts'>('recurring');
  const [recurringSubTypeFilter, setRecurringSubTypeFilter] = useState<'all' | 'utility' | 'subscription'>('all');
  const [debtSubTypeFilter, setDebtSubTypeFilter] = useState<'all' | 'loan' | 'installment' | 'credit_card'>('all');
  const [searchBill, setSearchBill] = useState('');
  const [upcomingBillsCount, setUpcomingBillsCount] = useState(0);
  const [overdueBillsCount, setOverdueBillsCount] = useState(0);
  const [deletingBillId, setDeletingBillId] = useState<number | null>(null);
  const [deletingSavingId, setDeletingSavingId] = useState<number | null>(null);

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
      setEditingGoalId(null);
      setGoalError('');
      setGoalForm({
        goal_name: '',
        category: 'other',
        target_amount: '',
        target_date: '',
        description: ''
      });
      setShowAddGoalModal(true);
    } else if (currentTab === 'bills') {
      setEditingBillId(null);
      setBillForm({
        name: '',
        billing_type: 'recurring',
        sub_type: 'utility',
        description: '',
        amount: '',
        total_amount: '',
        remaining_amount: '',
        installment_amount: '',
        creditor_id: '',
        due_day: '',
        start_date: ''
      });
      setShowAddBillModal(true);
    }
  };

  const openEditBillModal = (bill: Bill) => {
    setEditingBillId(bill.id);
    setBillError('');
    setBillForm({
      name: bill.name || '',
      billing_type: bill.billing_type || 'recurring',
      sub_type: bill.sub_type || 'utility',
        description: bill.description || '',
      amount: bill.amount?.toString() || '',
      total_amount: bill.total_amount?.toString() || '',
      remaining_amount: bill.remaining_amount?.toString() || '',
      installment_amount: bill.installment_amount?.toString() || '',
      creditor_id: bill.creditor_id?.toString() || '',
      due_day: bill.due_day?.toString() || '',
      start_date: bill.start_date ? bill.start_date.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setShowAddBillModal(true);
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

      const payload = {
        goal_name,
        category,
        target_amount: parseFloat(target_amount),
        target_date,
        description
      };

      if (editingGoalId) {
        await savingsAPI.update(editingGoalId, payload);
      } else {
        await savingsAPI.create(payload);
      }

      await loadData();
      setGoalForm({ goal_name: '', category: 'other', target_amount: '', target_date: '', description: '' });
      setEditingGoalId(null);
      setShowAddGoalModal(false);
    } catch (error: any) {
      setGoalError(error.response?.data?.error || error.message || 'Failed to add goal');
    }
  };

  const handleEditGoal = (goal: SavingGoal) => {
    setEditingGoalId(goal.id);
    setGoalError('');
    setGoalForm({
      goal_name: goal.goal_name,
      category: goal.category,
      target_amount: goal.target_amount.toString(),
      target_date: goal.target_date ? goal.target_date.split('T')[0] : '',
      description: goal.description || ''
    });
    setShowDepositModal(false);
    setSelectedGoalForDeposit(null);
    setGoalDeposits([]);
    setShowAddGoalModal(true);
  };

  const handleCloseGoalModal = () => {
    setShowAddGoalModal(false);
    setGoalError('');
    setEditingGoalId(null);
    setShowGoalActionsModal(false);
    setSelectedGoalForActions(null);
    setGoalForm({ goal_name: '', category: 'other', target_amount: '', target_date: '', description: '' });
  };

  const handleDeleteSaving = async (savingId: number) => {
    const confirmed = window.confirm('Delete this savings goal?');
    if (!confirmed) {
      return;
    }

    try {
      setDeletingSavingId(savingId);
      await savingsAPI.delete(savingId);
      if (selectedGoalForDeposit?.id === savingId) {
        setShowDepositModal(false);
        setSelectedGoalForDeposit(null);
        setGoalDeposits([]);
      }
      if (selectedGoalForActions?.id === savingId) {
        setShowGoalActionsModal(false);
        setSelectedGoalForActions(null);
        setGoalDeposits([]);
      }
      if (editingGoalId === savingId) {
        handleCloseGoalModal();
      }
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete saving');
    } finally {
      setDeletingSavingId(null);
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

  const getTopSavingGoals = () => {
    return [...savingGoals]
      .sort((a, b) => b.target_amount - a.target_amount)
      .slice(0, 2);
  };

  const totalSavedAmount = savingGoals.reduce((sum, goal) => sum + (goal.current_amount || 0), 0);

  const billsThisMonthAmount = bills.reduce((sum, bill) => {
    if (bill.billing_type === 'recurring') {
      return sum + (bill.amount || 0);
    }

    if (bill.billing_type === 'debt') {
      return sum + (bill.installment_amount || bill.amount || bill.remaining_amount || 0);
    }

    return sum;
  }, 0);

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

  const getCreditorName = (creditorId?: number | null) => {
    if (!creditorId) {
      return '';
    }

    return creditors.find((creditor) => creditor.id === creditorId)?.name || '';
  };

  const getBillDisplayAmount = (bill: Bill) => {
    if (bill.billing_type === 'recurring') {
      return bill.amount || 0;
    }

    return bill.remaining_amount || bill.installment_amount || bill.total_amount || bill.amount || 0;
  };

  const sortBillsByStatus = (items: Bill[]): Bill[] => {
    return [...items].sort((a, b) => {
      const statusDiff = (isOverdue(a) ? 0 : isBillPaid(a) ? 2 : 1) - (isOverdue(b) ? 0 : isBillPaid(b) ? 2 : 1);
      if (statusDiff !== 0) {
        return statusDiff;
      }

      return getDaysUntilDue(a) - getDaysUntilDue(b);
    });
  };

  const recurringBills = sortBillsByStatus(
    bills.filter((bill) => {
      const matchesSearch = bill.name.toLowerCase().includes(searchBill.toLowerCase());
      const matchesSubtype = recurringSubTypeFilter === 'all' || bill.sub_type === recurringSubTypeFilter;
      return bill.billing_type === 'recurring' && matchesSearch && matchesSubtype;
    })
  );

  const debtBills = sortBillsByStatus(
    bills.filter((bill) => {
      const matchesSearch = bill.name.toLowerCase().includes(searchBill.toLowerCase());
      const matchesSubtype = debtSubTypeFilter === 'all' || bill.sub_type === debtSubTypeFilter;
      return bill.billing_type === 'debt' && matchesSearch && matchesSubtype;
    })
  );

  const activeBillList = billsSubTab === 'recurring' ? recurringBills : debtBills;
  const activeBillCount = activeBillList.length;
  const activeBillTotal = activeBillList.reduce((sum, bill) => sum + getBillDisplayAmount(bill), 0);

  const billActionButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    width: '100%',
    minHeight: '46px',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid rgba(148, 163, 184, 0.24)',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    fontSize: '13px',
    fontWeight: 600,
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
    cursor: 'pointer'
  };

  const billDangerButtonStyle = {
    ...billActionButtonStyle,
    color: '#b91c1c',
    borderColor: 'rgba(248, 113, 113, 0.28)',
    backgroundColor: '#fff5f5'
  };

  const goalActionButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    minHeight: '36px',
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid rgba(148, 163, 184, 0.24)',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer'
  };

  const goalDangerButtonStyle = {
    ...goalActionButtonStyle,
    color: '#b91c1c',
    borderColor: 'rgba(248, 113, 113, 0.28)',
    backgroundColor: '#fff5f5'
  };

  const loadGoalDeposits = async (goalId: number) => {
    try {
      const data = await savingsAPI.getById(goalId);
      setGoalDeposits(data.deposits || []);
    } catch (error) {
      console.error('Failed to load deposits:', error);
      setGoalDeposits([]);
    }
  };

  const openDepositModal = async (goal: SavingGoal) => {
    setSelectedGoalForDeposit(goal);
    setDepositAmount('');
    setDepositNote('');
    setDepositError('');
    setShowDepositModal(true);
    setShowGoalActionsModal(false);
    setSelectedGoalForActions(null);
    await loadGoalDeposits(goal.id);
  };

  const openGoalActionsModal = async (goal: SavingGoal) => {
    setSelectedGoalForActions(goal);
    setShowGoalActionsModal(true);
    setShowDepositModal(false);
    setSelectedGoalForDeposit(null);
    await loadGoalDeposits(goal.id);
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
        description: billForm.description,
        due_day: parseInt(due_day),
        start_date
      };

      if (billForm.creditor_id) {
        billData.creditor_id = parseInt(billForm.creditor_id);
      }

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

      }

      if (editingBillId) {
        await billsAPI.update(editingBillId, billData);
      } else {
        await billsAPI.create(billData);
      }
      
      // Refresh bills list
      await loadData();
      
      // Reset form
      setBillForm({
        name: '',
        billing_type: 'recurring',
        sub_type: 'utility',
        description: '',
        amount: '',
        total_amount: '',
        remaining_amount: '',
        installment_amount: '',
        creditor_id: '',
        due_day: '',
        start_date: ''
      });

      setEditingBillId(null);

      setShowAddBillModal(false);
    } catch (error: any) {
      setBillError(error.message || (editingBillId ? 'Failed to update bill' : 'Failed to add bill'));
    }
  };

  const openPaymentModal = (bill: Bill) => {
    setSelectedBillForPayment(bill);
    setPaymentAmount(bill.amount?.toString() || '');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentError('');
    setShowPaymentModal(true);
  };

  const openBillDetailModal = async (bill: Bill) => {
    setSelectedBillForDetail(bill);
    setSelectedBillPayments([]);
    setBillDetailError('');
    setBillDetailLoading(true);
    setShowBillDetailModal(true);

    try {
      const data = await billsAPI.getById(bill.id);
      setSelectedBillForDetail(data.bill || bill);
      setSelectedBillPayments(data.payments || []);
    } catch (error: any) {
      setBillDetailError(error.response?.data?.error || 'Failed to load bill details');
    } finally {
      setBillDetailLoading(false);
    }
  };

  const closeBillDetailModal = () => {
    setShowBillDetailModal(false);
    setSelectedBillForDetail(null);
    setSelectedBillPayments([]);
    setBillDetailError('');
    setBillDetailLoading(false);
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

  const handleDeleteBill = async (billId: number) => {
    const confirmed = window.confirm('Delete this bill?');
    if (!confirmed) {
      return;
    }

    try {
      setDeletingBillId(billId);
      await billsAPI.delete(billId);
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete bill');
    } finally {
      setDeletingBillId(null);
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
        <section className="active" style={{ display: 'block', paddingBottom: '100px' }}>
          <h2>Overview</h2>

          <div className="summary-grid">
            <div className="sum-card">
              <div className="sum-label">Total Saved</div>
              <div className="sum-value">{totalSavedAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</div>
            </div>
            <div className="sum-card">
              <div className="sum-label">Bills This Month</div>
              <div className="sum-value">{billsThisMonthAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</div>
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
          {getTopSavingGoals().length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💰</div>
              <div className="empty-text">No savings goals yet</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {getTopSavingGoals().map((goal) => {
                const progress = getProgressPercentage(goal.current_amount, goal.target_amount);
                const remaining = Math.max(goal.target_amount - goal.current_amount, 0);
                const goalDate = goal.target_date
                  ? new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : 'No target date';

                return (
                  <div key={goal.id} className="goal-card">
                    <div className="goal-header">
                      <div className="goal-name">{getCategoryLabel(goal.category)} {goal.goal_name}</div>
                      <div className="goal-date">{goalDate}</div>
                    </div>
                    <div className="goal-amount">
                      ฿{goal.current_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} / ฿{goal.target_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="progress-label">
                      <span>{Math.round(progress)}% complete</span>
                      <span>฿{remaining.toLocaleString('th-TH', { minimumFractionDigits: 2 })} left</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Saving Tab */}
      {currentTab === 'saving' && (
        <section className="active" style={{ display: 'block', paddingBottom: '100px' }}>
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
                  onClick={() => openGoalActionsModal(goal)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openGoalActionsModal(goal);
                    }
                  }}
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
                  <div className="bill-status-right" style={{ gap: '6px' }}>
                    <span className="status-badge" style={{ backgroundColor: getCategoryColor(goal.category) }}>Open</span>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em' }}>Actions</div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      {/* Bills Tab */}
      {currentTab === 'bills' && (
        <section className="active" style={{ display: 'block', paddingBottom: '100px' }}>
          <h2>Billing List</h2>

          <div className="summary-grid" style={{ marginBottom: '16px' }}>
            <div className="sum-card">
              <div className="sum-label">Bills</div>
              <div className="sum-value">{activeBillCount}</div>
            </div>
            <div className="sum-card">
              <div className="sum-label">To Pay</div>
              <div className="sum-value">{activeBillTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</div>
            </div>
          </div>

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

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {(billsSubTab === 'recurring'
              ? [
                  { value: 'all', label: 'All recurring' },
                  { value: 'utility', label: 'Utility' },
                  { value: 'subscription', label: 'Subscription' }
                ]
              : [
                  { value: 'all', label: 'All debt' },
                  { value: 'loan', label: 'Loan' },
                  { value: 'installment', label: 'Installment' },
                  { value: 'credit_card', label: 'Credit Card' }
                ]
            ).map((option) => {
              const isActive = billsSubTab === 'recurring'
                ? recurringSubTypeFilter === option.value
                : debtSubTypeFilter === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    if (billsSubTab === 'recurring') {
                      setRecurringSubTypeFilter(option.value as 'all' | 'utility' | 'subscription');
                    } else {
                      setDebtSubTypeFilter(option.value as 'all' | 'loan' | 'installment' | 'credit_card');
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '999px',
                    border: isActive ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                    backgroundColor: isActive ? '#dbeafe' : 'white',
                    color: isActive ? '#1d4ed8' : '#6b7280',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {billsSubTab === 'recurring' && (
            <div style={{ marginBottom: '26px' }}>
              {recurringBills.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">⚡</div>
                  <div className="empty-text">{searchBill ? 'No matching bills found' : 'No recurring bills'}</div>
                </div>
              ) : (
                recurringBills.map((bill) => {
                  const daysUntil = getDaysUntilDue(bill);
                  const billIsOverdue = isOverdue(bill);
                  const creditorName = getCreditorName(bill.creditor_id);

                  return (
                    <div
                      key={bill.id}
                      className="bill-item"
                      onClick={() => openBillDetailModal(bill)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openBillDetailModal(bill);
                        }
                      }}
                      style={{
                        cursor: 'pointer',
                        borderLeftColor: billIsOverdue ? '#991b1b' : undefined,
                        background: billIsOverdue ? '#7f1d1d' : undefined,
                        padding: '10px 12px'
                      }}
                    >
                      <div className="bill-left">
                        <div className="bill-name" style={{ color: billIsOverdue ? 'white' : undefined }}>⚡ {bill.name}</div>
                        <div className="bill-meta" style={{ color: billIsOverdue ? '#fca5a5' : undefined }}>{bill.sub_type} • Due {bill.due_day}th</div>
                        {bill.description && (
                          <div className="bill-meta" style={{ color: billIsOverdue ? '#fca5a5' : '#475569', fontWeight: 400, marginTop: '2px' }}>{bill.description}</div>
                        )}
                        <div className="bill-amount" style={{ color: billIsOverdue ? '#fca5a5' : undefined }}>{bill.amount} ฿/month</div>
                        <div className="bill-meta" style={{ color: billIsOverdue ? '#fca5a5' : undefined, marginBottom: 0 }}>
                          {creditorName && <span>Creditor: {creditorName}</span>}
                          {creditorName && bill.last_paid_at && <span>•</span>}
                          {bill.last_paid_at && <span>Last paid: {new Date(bill.last_paid_at).toLocaleDateString('th-TH')}</span>}
                        </div>
                      </div>
                      <div className="bill-status-right" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                        <span className="status-badge" style={{
                          backgroundColor: billIsOverdue ? '#dc2626' : (isBillPaid(bill) ? '#10b981' : '#f59e0b'),
                          color: 'white',
                          fontSize: '9px',
                          whiteSpace: 'nowrap'
                        }}>
                          {billIsOverdue ? 'OVERDUE' : (isBillPaid(bill) ? '✓ Paid' : `${daysUntil}d`)}
                        </span>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: billIsOverdue ? '#fecaca' : '#64748b', letterSpacing: '0.04em' }}>Open</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {billsSubTab === 'debts' && (
            <div style={{ marginBottom: '26px' }}>
              {debtBills.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💳</div>
                  <div className="empty-text">{searchBill ? 'No matching debts found' : 'No debts'}</div>
                </div>
              ) : (
                debtBills.map((bill) => {
                  const daysUntil = getDaysUntilDue(bill);
                  const billIsOverdue = isOverdue(bill);
                  const creditorName = getCreditorName(bill.creditor_id);

                  return (
                    <div
                      key={bill.id}
                      className="bill-item"
                      onClick={() => openBillDetailModal(bill)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openBillDetailModal(bill);
                        }
                      }}
                      style={{
                        cursor: 'pointer',
                        borderLeftColor: billIsOverdue ? '#991b1b' : undefined,
                        background: billIsOverdue ? '#7f1d1d' : undefined,
                        padding: '10px 12px'
                      }}
                    >
                      <div className="bill-left">
                        <div className="bill-name" style={{ color: billIsOverdue ? 'white' : undefined }}>💳 {bill.name}</div>
                        <div className="bill-meta" style={{ color: billIsOverdue ? '#fca5a5' : undefined }}>{bill.sub_type} • Due {bill.due_day}th</div>
                        {bill.description && (
                          <div className="bill-meta" style={{ color: billIsOverdue ? '#fca5a5' : '#475569', fontWeight: 400, marginTop: '2px' }}>{bill.description}</div>
                        )}
                        <div className="bill-amount-large" style={{ color: billIsOverdue ? '#fca5a5' : undefined }}>{bill.total_amount || bill.amount || 0} ฿</div>
                        <div className="bill-meta" style={{ color: billIsOverdue ? '#fca5a5' : undefined, marginBottom: 0 }}>
                          {creditorName && <span>Creditor: {creditorName}</span>}
                          {creditorName && bill.last_paid_at && <span>•</span>}
                          {bill.last_paid_at && <span>Last paid: {new Date(bill.last_paid_at).toLocaleDateString('th-TH')}</span>}
                        </div>
                      </div>
                      <div className="bill-status-right" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                        <span className="status-badge" style={{
                          backgroundColor: billIsOverdue ? '#dc2626' : (isBillPaid(bill) ? '#10b981' : '#f59e0b'),
                          color: 'white',
                          fontSize: '9px',
                          whiteSpace: 'nowrap'
                        }}>
                          {billIsOverdue ? 'OVERDUE' : (isBillPaid(bill) ? '✓ Paid' : `${daysUntil}d`)}
                        </span>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: billIsOverdue ? '#fecaca' : '#64748b', letterSpacing: '0.04em' }}>Open</div>
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
      <button
        className="fab"
        onClick={handleAddFAB}
        aria-label={currentTab === 'bills' ? 'Add bill' : 'Add savings goal'}
        style={{ display: currentTab === 'saving' || currentTab === 'bills' ? 'flex' : 'none' }}
      >
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
              <span>{editingGoalId ? 'Edit Saving Goal' : 'Add Saving Goal'}</span>
              <button
                className="modal-close"
                onClick={handleCloseGoalModal}
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
                {loading ? (editingGoalId ? 'Saving...' : 'Adding...') : (editingGoalId ? 'Save Changes' : 'Add Goal')}
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
              <span>{editingBillId ? 'Edit Bill' : 'Add Bill'}</span>
              <button
                className="modal-close"
                onClick={() => {
                  setShowAddBillModal(false);
                  setBillError('');
                  setEditingBillId(null);
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
                <label>Desc</label>
                <textarea
                  placeholder="Short note for this bill"
                  value={billForm.description}
                  onChange={(e) => handleBillFormChange('description', e.target.value)}
                  style={{ minHeight: '70px', fontFamily: 'inherit' }}
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

              <div className="form-group">
                <label>Creditor / Provider</label>
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
                {loading ? (editingBillId ? 'Updating...' : 'Adding...') : (editingBillId ? 'Update Bill' : 'Add Bill')}
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

      {/* Bill Detail Modal */}
      {showBillDetailModal && selectedBillForDetail && (
        <div className="modal active">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <span>Bill Actions</span>
              <button
                className="modal-close"
                onClick={closeBillDetailModal}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '16px', padding: '14px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                    {selectedBillForDetail.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {selectedBillForDetail.billing_type} • {selectedBillForDetail.sub_type} • Due on the {selectedBillForDetail.due_day}th
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Open amount</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    {selectedBillForDetail.billing_type === 'recurring'
                      ? `${(selectedBillForDetail.amount || 0).toLocaleString('th-TH')} ฿ / month`
                      : `${(selectedBillForDetail.remaining_amount || 0).toLocaleString('th-TH')} ฿ remaining`}
                  </div>
                </div>
              </div>

              {selectedBillForDetail.description && (
                <div style={{ fontSize: '13px', color: '#475569', marginBottom: '10px' }}>
                  {selectedBillForDetail.description}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {getCreditorName(selectedBillForDetail.creditor_id) && (
                  <span className="status-badge" style={{ backgroundColor: '#e2e8f0', color: '#334155' }}>
                    Creditor: {getCreditorName(selectedBillForDetail.creditor_id)}
                  </span>
                )}
                <span className="status-badge" style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                  {selectedBillPayments.length} payments
                </span>
                {selectedBillForDetail.last_paid_at && (
                  <span className="status-badge" style={{ backgroundColor: '#0f172a', color: 'white' }}>
                    Last paid: {new Date(selectedBillForDetail.last_paid_at).toLocaleDateString('th-TH')}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
                <button
                  type="button"
                  style={billActionButtonStyle}
                  onClick={() => {
                    if (selectedBillForDetail) {
                      closeBillDetailModal();
                      openPaymentModal(selectedBillForDetail);
                    }
                  }}
                >
                  Record Payment
                </button>
                <button
                  type="button"
                  style={billActionButtonStyle}
                  onClick={() => {
                    if (selectedBillForDetail) {
                      const billToEdit = selectedBillForDetail;
                      closeBillDetailModal();
                      openEditBillModal(billToEdit);
                    }
                  }}
                >
                  Edit Bill
                </button>
                <button
                  type="button"
                  style={billDangerButtonStyle}
                  onClick={() => {
                    const billId = selectedBillForDetail.id;
                    closeBillDetailModal();
                    handleDeleteBill(billId);
                  }}
                  disabled={deletingBillId === selectedBillForDetail.id}
                >
                  {deletingBillId === selectedBillForDetail.id ? 'Deleting...' : 'Delete Bill'}
                </button>
              </div>
            </div>

            {billDetailLoading && (
              <div className="empty-state">
                <div className="empty-icon">⏳</div>
                <div className="empty-text">Loading payment history...</div>
              </div>
            )}

            {!billDetailLoading && billDetailError && (
              <div style={{
                background: '#fff5f5',
                border: '1px solid #feb2b2',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '12px',
                color: '#742a2a',
                marginBottom: '12px'
              }}>
                {billDetailError}
              </div>
            )}

            {!billDetailLoading && !billDetailError && (
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>Payment History</h3>
                {selectedBillPayments.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🧾</div>
                    <div className="empty-text">No payment history yet</div>
                  </div>
                ) : (
                  <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                    {selectedBillPayments.map((payment) => (
                      <div key={payment.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 0',
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '13px' }}>
                            ฿{Number(payment.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </div>
                          <div style={{ color: '#6b7280', fontSize: '11px' }}>
                            Paid {new Date(payment.paid_at).toLocaleDateString('th-TH')}
                          </div>
                          {payment.cycle_due_date && (
                            <div style={{ color: '#6b7280', fontSize: '11px' }}>
                              Cycle due: {new Date(payment.cycle_due_date).toLocaleDateString('th-TH')}
                            </div>
                          )}
                        </div>
                        <div style={{ color: '#10b981', fontWeight: '700', fontSize: '12px' }}>
                          PAID
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeBillDetailModal}
                style={{ flex: 1 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goal Actions Modal */}
      {showGoalActionsModal && selectedGoalForActions && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <span>💰 {selectedGoalForActions.goal_name}</span>
              <button
                className="modal-close"
                onClick={() => {
                  setShowGoalActionsModal(false);
                  setSelectedGoalForActions(null);
                  setGoalDeposits([]);
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                <span style={{ fontWeight: '500' }}>
                  ฿{selectedGoalForActions.current_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} / ฿{selectedGoalForActions.target_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
                <span style={{ color: '#6b7280' }}>
                  {Math.round(getProgressPercentage(selectedGoalForActions.current_amount, selectedGoalForActions.target_amount))}%
                </span>
              </div>
              <div style={{ backgroundColor: '#e5e7eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: getCategoryColor(selectedGoalForActions.category), height: '100%', width: `${getProgressPercentage(selectedGoalForActions.current_amount, selectedGoalForActions.target_amount)}%` }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  openDepositModal(selectedGoalForActions);
                  setShowGoalActionsModal(false);
                  setSelectedGoalForActions(null);
                }}
                style={{
                  ...goalActionButtonStyle,
                  backgroundColor: '#ecfeff',
                  borderColor: 'rgba(6, 182, 212, 0.24)',
                  color: '#155e75'
                }}
              >
                Add Deposit
              </button>
              <button
                type="button"
                onClick={() => handleEditGoal(selectedGoalForActions)}
                style={goalActionButtonStyle}
              >
                Edit Goal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSaving(selectedGoalForActions.id)}
                disabled={deletingSavingId === selectedGoalForActions.id}
                style={goalDangerButtonStyle}
              >
                {deletingSavingId === selectedGoalForActions.id ? 'Deleting...' : 'Delete Goal'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowGoalActionsModal(false);
                  setSelectedGoalForActions(null);
                }}
                style={goalActionButtonStyle}
              >
                Close
              </button>
            </div>

            {selectedGoalForActions.description && (
              <div style={{ marginBottom: '16px', fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>
                {selectedGoalForActions.description}
              </div>
            )}

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>Saving History</h3>
              {goalDeposits.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🧾</div>
                  <div className="empty-text">No deposits yet</div>
                </div>
              ) : (
                <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  {goalDeposits.map((deposit) => (
                    <div key={deposit.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 0',
                      borderBottom: '1px solid #f3f4f6'
                    }}>
                      <div>
                        {deposit.note && (
                          <div style={{ fontWeight: '600', fontSize: '13px' }}>{deposit.note}</div>
                        )}
                        <div style={{ color: '#6b7280', fontSize: '11px' }}>
                          {new Date(deposit.deposited_at).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      <div style={{ color: '#10b981', fontWeight: '700', fontSize: '12px' }}>
                        +฿{Number(deposit.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
