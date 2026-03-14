'use client';

import { useState } from 'react';
import { Save, Building, Phone, Mail, MapPin, Globe, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate saving settings
    setTimeout(() => {
      setLoading(false);
      toast.success('Settings saved successfully');
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
        <p className="text-slate-500">Manage your pharmacy details and preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Pharmacy Details */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-white/40">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building className="h-5 w-5 text-red-600" />
              Pharmacy Details
            </h2>
            <p className="text-sm text-slate-500 mt-1">Basic information about your business</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pharmacy Name</label>
                <input
                  type="text"
                  defaultValue="HERITAGE DRUG SHOP"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Registration Number</label>
                <input
                  type="text"
                  defaultValue="REG-2024-8921"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-white/40">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Phone className="h-5 w-5 text-red-600" />
              Contact Information
            </h2>
            <p className="text-sm text-slate-500 mt-1">How customers and suppliers can reach you</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" /> Phone Number
                </label>
                <input
                  type="text"
                  defaultValue="+256 700 000000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" /> Email Address
                </label>
                <input
                  type="email"
                  defaultValue="contact@malabadrugs.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white/50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" /> Physical Address
                </label>
                <textarea
                  rows={2}
                  defaultValue="Main Street, Malaba Town Council, Uganda"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-white/40">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Globe className="h-5 w-5 text-red-600" />
              Preferences
            </h2>
            <p className="text-sm text-slate-500 mt-1">System-wide preferences and defaults</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white/50">
                  <option value="UGX">Ugandan Shilling (UGX)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="KES">Kenyan Shilling (KES)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white/50">
                  <option value="Africa/Kampala">Africa/Kampala (EAT)</option>
                  <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Low Stock Alert Threshold</label>
                <input
                  type="number"
                  defaultValue="10"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white/50"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-70"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
