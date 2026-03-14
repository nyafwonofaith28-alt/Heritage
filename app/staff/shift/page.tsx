'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Clock, LogIn, LogOut, Banknote, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';

interface Sale {
  id: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
}

export default function StaffShift() {
  const { user, profile } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [shiftStatus, setShiftStatus] = useState<'active' | 'inactive'>(profile?.shift_status || 'inactive');

  useEffect(() => {
    const fetchTodaySales = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const todayStart = startOfDay(new Date()).toISOString();
        const todayEnd = endOfDay(new Date()).toISOString();
        
        const { data, error } = await supabase
          .from('sales')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (data) setSales(data as Sale[]);
      } catch (error) {
        console.error('Error fetching sales:', error);
        toast.error("Failed to load today's sales");
      } finally {
        setLoading(false);
      }
    };

    fetchTodaySales();
    if (profile?.shift_status) {
      setShiftStatus(profile.shift_status);
    }
  }, [user, profile]);

  const handleShiftToggle = async () => {
    if (!user) return;
    try {
      const newStatus = shiftStatus === 'active' ? 'inactive' : 'active';
      const { error } = await supabase.from('users').update({ shift_status: newStatus }).eq('id', user.id);
      if (error) throw error;
      setShiftStatus(newStatus);
      toast.success(`Shift ${newStatus === 'active' ? 'started' : 'ended'} successfully`);
    } catch (error) {
      console.error('Error updating shift status:', error);
      toast.error('Failed to update shift status');
    }
  };

  const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const cashSales = sales.filter(s => s.payment_method === 'cash').reduce((sum, sale) => sum + sale.total_amount, 0);
  const momoSales = sales.filter(s => s.payment_method === 'mobile_money').reduce((sum, sale) => sum + sale.total_amount, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Shift & Sales Management</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Shift Control */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm p-6 flex flex-col items-center justify-center text-center">
          <div className={`p-4 rounded-full mb-4 ${shiftStatus === 'active' ? 'bg-red-100 text-red-600' : 'bg-slate-100/50 text-slate-500'}`}>
            <Clock className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Current Status</h2>
          <p className={`text-sm font-medium mb-6 ${shiftStatus === 'active' ? 'text-red-600' : 'text-slate-500'}`}>
            {shiftStatus === 'active' ? 'On Shift' : 'Off Shift'}
          </p>
          <button
            onClick={handleShiftToggle}
            className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm ${
              shiftStatus === 'active' 
                ? 'bg-slate-100/50 text-slate-600 hover:bg-slate-200/50 border border-slate-200/50' 
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {shiftStatus === 'active' ? (
              <><LogOut className="h-5 w-5" /> End Shift</>
            ) : (
              <><LogIn className="h-5 w-5" /> Start Shift</>
            )}
          </button>
        </div>

        {/* Sales Summary */}
        <div className="md:col-span-2 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Banknote className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-bold text-slate-900">Today&apos;s Summary</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/40">
              <p className="text-sm font-medium text-slate-500 mb-1">Total Sales</p>
              <p className="text-2xl font-bold text-slate-900">UGX {totalSales.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-red-50/50 backdrop-blur-sm rounded-xl border border-red-100/50">
              <p className="text-sm font-medium text-red-700 mb-1">Cash Collected</p>
              <p className="text-2xl font-bold text-red-900">UGX {cashSales.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-blue-50/50 backdrop-blur-sm rounded-xl border border-blue-100/50">
              <p className="text-sm font-medium text-blue-700 mb-1">Mobile Money</p>
              <p className="text-2xl font-bold text-blue-900">UGX {momoSales.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-white/40 bg-white/30 flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-500" />
          <h2 className="font-bold text-slate-900">Recent Transactions (Today)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/50 text-sm font-medium text-slate-500">
                <th className="p-4">Time</th>
                <th className="p-4">Amount (UGX)</th>
                <th className="p-4">Payment Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50">
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500">Loading sales...</td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500">No sales recorded today</td>
                </tr>
              ) : (
                sales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-slate-900 font-medium">
                      {format(parseISO(sale.created_at), 'HH:mm:ss')}
                    </td>
                    <td className="p-4 text-red-600 font-medium">
                      {sale.total_amount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        sale.payment_method === 'cash' ? 'bg-red-100 text-red-800' :
                        sale.payment_method === 'mobile_money' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {sale.payment_method.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
