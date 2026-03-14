'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, Download, Calendar, DollarSign, Package, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface Sale {
  id: string;
  user_id: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
}

export default function AdminReports() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all'); // all, today, week, month

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('sales')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (data) setSales(data as Sale[]);
      } catch (error) {
        console.error('Error fetching sales:', error);
        toast.error('Failed to load sales reports');
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  const filteredSales = sales.filter(sale => {
    if (dateRange === 'all') return true;
    const saleDate = parseISO(sale.created_at);
    const now = new Date();
    if (dateRange === 'today') {
      return saleDate.toDateString() === now.toDateString();
    }
    if (dateRange === 'week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      return saleDate >= weekAgo;
    }
    if (dateRange === 'month') {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      return saleDate >= monthAgo;
    }
    return true;
  });

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalTransactions = filteredSales.length;
  const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const handleExport = () => {
    toast.success('Report exported to CSV');
    // In a real app, generate CSV and trigger download
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Sales & Financial Reports</h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium shadow-sm"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-slate-500">
            <Calendar className="h-5 w-5" />
            <span className="font-medium">Date Range:</span>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-700 font-medium"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-red-50/50 backdrop-blur-sm rounded-2xl border border-red-100/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
              <p className="font-medium text-red-800">Total Revenue</p>
            </div>
            <p className="text-3xl font-bold text-red-900">UGX {totalRevenue.toLocaleString()}</p>
          </div>
          
          <div className="p-6 bg-blue-50/50 backdrop-blur-sm rounded-2xl border border-blue-100/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <p className="font-medium text-blue-800">Transactions</p>
            </div>
            <p className="text-3xl font-bold text-blue-900">{totalTransactions}</p>
          </div>
          
          <div className="p-6 bg-purple-50/50 backdrop-blur-sm rounded-2xl border border-purple-100/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <p className="font-medium text-purple-800">Average Order Value</p>
            </div>
            <p className="text-3xl font-bold text-purple-900">UGX {Math.round(averageOrderValue).toLocaleString()}</p>
          </div>
        </div>

        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-400" />
          Transaction History
        </h2>
        
        <div className="overflow-x-auto rounded-xl border border-slate-200/50 bg-white/30 backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/50 text-sm font-medium text-slate-500">
                <th className="p-4">Date & Time</th>
                <th className="p-4">Transaction ID</th>
                <th className="p-4">Items</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4 text-right">Amount (UGX)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Loading reports...</td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No transactions found for this period</td>
                </tr>
              ) : (
                filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-slate-900 font-medium">
                      {format(parseISO(sale.created_at), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-xs">
                      {sale.id.slice(0, 8)}...
                    </td>
                    <td className="p-4 text-slate-600">
                      View details
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
                    <td className="p-4 text-right font-bold text-slate-900">
                      {sale.total_amount.toLocaleString()}
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
