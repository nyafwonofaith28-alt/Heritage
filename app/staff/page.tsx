'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { 
  TrendingUp, 
  Banknote, 
  Smartphone, 
  Clock, 
  ArrowRight, 
  ShoppingCart, 
  Package, 
  Users,
  Calendar,
  FileText,
  Search
} from 'lucide-react';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';

interface Sale {
  id: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
}

export default function StaffDashboard() {
  const { user, profile } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [shiftStatus, setShiftStatus] = useState<'active' | 'inactive'>(profile?.shift_status || 'inactive');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
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
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    if (profile?.shift_status) {
      setShiftStatus(profile.shift_status);
    }
  }, [user, profile]);

  const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const cashSales = sales.filter(s => s.payment_method === 'cash').reduce((sum, sale) => sum + sale.total_amount, 0);
  const momoSales = sales.filter(s => s.payment_method === 'mobile_money').reduce((sum, sale) => sum + sale.total_amount, 0);

  const filteredSales = sales.filter(sale => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const timeStr = format(parseISO(sale.created_at), 'HH:mm');
    const amountStr = sale.total_amount.toString();
    const methodStr = sale.payment_method.replace('_', ' ').toLowerCase();
    return timeStr.includes(query) || amountStr.includes(query) || methodStr.includes(query);
  });

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, <span className="text-red-600">{profile?.name?.split(' ')[0]}</span>!
          </h1>
          <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm shadow-sm ${
            shiftStatus === 'active' 
              ? 'bg-red-50 text-red-700 border-red-100' 
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${shiftStatus === 'active' ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
            {shiftStatus === 'active' ? 'ON SHIFT' : 'OFF SHIFT'}
          </div>
          <button 
            onClick={handleShiftToggle}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm ${
              shiftStatus === 'active'
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {shiftStatus === 'active' ? 'End Shift' : 'Start Shift'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-2xl text-red-600 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">TODAY</span>
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Sales</p>
          <p className="text-3xl font-black text-slate-900 mt-1">UGX {totalSales.toLocaleString()}</p>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
              <Banknote className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">CASH</span>
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Cash Collected</p>
          <p className="text-3xl font-black text-slate-900 mt-1">UGX {cashSales.toLocaleString()}</p>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
              <Smartphone className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">MOMO</span>
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Mobile Money</p>
          <p className="text-3xl font-black text-slate-900 mt-1">UGX {momoSales.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-600" />
              Recent Transactions
            </h2>
            <Link href="/staff/shift" className="text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group">
              View All <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-white/40 bg-white/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by amount, time, or method..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200/50 text-xs font-black text-slate-500 uppercase tracking-widest">
                    <th className="p-4">Time</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Method</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500 font-medium italic">Loading transactions...</td>
                    </tr>
                  ) : filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500 font-medium italic">No transactions found</td>
                    </tr>
                  ) : (
                    filteredSales.slice(0, 5).map(sale => (
                      <tr key={sale.id} className="hover:bg-white/80 transition-colors group">
                        <td className="p-4 text-slate-600 font-bold text-sm">
                          {format(parseISO(sale.created_at), 'HH:mm')}
                        </td>
                        <td className="p-4 text-slate-900 font-black">
                          UGX {sale.total_amount.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                            sale.payment_method === 'cash' ? 'bg-emerald-100 text-emerald-800' :
                            sale.payment_method === 'mobile_money' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {sale.payment_method.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                            <FileText className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4">
            <Link 
              href="/staff/pos"
              className="flex items-center gap-4 p-4 bg-red-600 hover:bg-red-700 text-white rounded-3xl shadow-lg shadow-red-200 transition-all group"
            >
              <div className="p-3 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <p className="font-black text-lg">Open POS</p>
                <p className="text-red-100 text-xs font-medium">Start a new sale</p>
              </div>
              <ArrowRight className="h-5 w-5 ml-auto group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link 
              href="/staff/inventory"
              className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-xl border border-white/40 hover:bg-white/80 text-slate-900 rounded-3xl shadow-sm transition-all group"
            >
              <div className="p-3 bg-slate-100 rounded-2xl text-slate-600 group-hover:scale-110 transition-transform">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="font-black text-lg">Inventory</p>
                <p className="text-slate-500 text-xs font-medium">Check stock levels</p>
              </div>
              <ArrowRight className="h-5 w-5 ml-auto group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link 
              href="/staff/customers"
              className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-xl border border-white/40 hover:bg-white/80 text-slate-900 rounded-3xl shadow-sm transition-all group"
            >
              <div className="p-3 bg-slate-100 rounded-2xl text-slate-600 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="font-black text-lg">Customers</p>
                <p className="text-slate-500 text-xs font-medium">Manage patient records</p>
              </div>
              <ArrowRight className="h-5 w-5 ml-auto group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Shift Reminder */}
          {shiftStatus === 'inactive' && (
            <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl mt-6">
              <div className="flex items-center gap-3 text-amber-800 mb-2">
                <Clock className="h-5 w-5" />
                <p className="font-bold">Shift Reminder</p>
              </div>
              <p className="text-sm text-amber-700 font-medium">
                You are currently off shift. Please start your shift to begin recording sales.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
