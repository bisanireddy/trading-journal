import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Trash2, PlusCircle, Loader2 } from 'lucide-react';

const App = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    segment: 'Equity',
    pnl: '',
    stt: '',
    brokerage: '',
    other_charges: '',
  });

  // 1. Fetch Data from Supabase on Load
  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }); // Show newest first
      
      if (error) throw error;
      setEntries(data);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Add New Entry
  const addEntry = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('trades')
        .insert([{
          date: formData.date,
          time: formData.time,
          segment: formData.segment,
          pnl: parseFloat(formData.pnl) || 0,
          stt: parseFloat(formData.stt) || 0,
          brokerage: parseFloat(formData.brokerage) || 0,
          other_charges: parseFloat(formData.other_charges) || 0
        }])
        .select();

      if (error) throw error;

      // Update UI immediately without reload
      setEntries([data[0], ...entries]);
      
      // Reset Form
      setFormData({
        ...formData,
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        pnl: '',
        stt: '',
        brokerage: '',
        other_charges: ''
      });

    } catch (error) {
      alert('Error adding trade: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Delete Entry
  const deleteEntry = async (id) => {
    if(!confirm("Are you sure you want to delete this trade?")) return;

    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setEntries(entries.filter(entry => entry.id !== id));
    } catch (error) {
      alert('Error deleting: ' + error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const calculateNet = (entry) => {
    const pnl = parseFloat(entry.pnl) || 0;
    const charges = (parseFloat(entry.stt) || 0) + (parseFloat(entry.brokerage) || 0) + (parseFloat(entry.other_charges) || 0);
    return (pnl - charges).toFixed(2);
  };

  const totalNet = entries.reduce((acc, curr) => acc + parseFloat(calculateNet(curr)), 0).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-8 border-b border-gray-700 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Pro Trade Journal
            </h1>
            <p className="text-gray-400 text-sm mt-1">NSE Intraday & MCX Tracker</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 w-full md:w-auto">
             <div className="text-xs text-gray-400 uppercase tracking-wider">Total Net P&L</div>
             <div className={`text-2xl font-bold ${parseFloat(totalNet) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
               ₹{totalNet}
             </div>
          </div>
        </header>

        {/* INPUT FORM */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 mb-8">
          <form onSubmit={addEntry} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
            
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs text-gray-400 block mb-1">Date</label>
              <input type="date" name="date" required value={formData.date} onChange={handleInputChange} 
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>

            <div className="col-span-1">
              <label className="text-xs text-gray-400 block mb-1">Time</label>
              <input type="time" name="time" required value={formData.time} onChange={handleInputChange} 
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
            </div>

            <div className="col-span-1">
              <label className="text-xs text-gray-400 block mb-1">Segment</label>
              <select name="segment" value={formData.segment} onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                <option>Equity</option>
                <option>FO</option>
                <option>MCX</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-xs text-emerald-400 block mb-1">Gross P&L</label>
              <input type="number" step="0.01" name="pnl" placeholder="0.00" required value={formData.pnl} onChange={handleInputChange}
                className="w-full bg-gray-700 border border-emerald-500/50 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
            </div>

            <div className="col-span-1">
              <label className="text-xs text-red-300 block mb-1">STT</label>
              <input type="number" step="0.01" name="stt" placeholder="0" value={formData.stt} onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </div>

            <div className="col-span-1">
              <label className="text-xs text-red-300 block mb-1">Brkg + Charges</label>
              <input type="number" step="0.01" name="brokerage" placeholder="20" value={formData.brokerage} onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </div>

            <div className="col-span-2 md:col-span-4 lg:col-span-1">
               <button type="submit" disabled={submitting} 
                 className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2 rounded flex justify-center items-center transition-colors">
                 {submitting ? <Loader2 className="animate-spin" size={18} /> : <PlusCircle size={18} />}
               </button>
            </div>
          </form>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="text-center py-10 text-gray-500 flex justify-center items-center gap-2">
            <Loader2 className="animate-spin" /> Loading your trades...
          </div>
        ) : (
          /* JOURNAL TABLE */
          <div className="overflow-x-auto bg-gray-800 rounded-xl shadow-lg border border-gray-700">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider bg-gray-900/50">
                  <th className="p-4">Date</th>
                  <th className="p-4">Segment</th>
                  <th className="p-4 text-right text-emerald-400">Gross P&L</th>
                  <th className="p-4 text-right text-red-300">Charges</th>
                  <th className="p-4 text-right font-bold text-white">Net P&L</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 text-sm">
                {entries.map((entry) => {
                  const net = calculateNet(entry);
                  const charges = (parseFloat(entry.stt||0) + parseFloat(entry.brokerage||0) + parseFloat(entry.other_charges||0)).toFixed(2);
                  
                  return (
                    <tr key={entry.id} className="hover:bg-gray-750 transition-colors group">
                      <td className="p-4">
                        <div className="font-medium text-white">{entry.date}</div>
                        <div className="text-gray-500 text-xs">{entry.time}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold 
                          ${entry.segment === 'FO' ? 'bg-purple-900/50 text-purple-200 border border-purple-700' : 
                            entry.segment === 'MCX' ? 'bg-orange-900/50 text-orange-200 border border-orange-700' :
                            'bg-blue-900/50 text-blue-200 border border-blue-700'}`}>
                          {entry.segment}
                        </span>
                      </td>
                      <td className={`p-4 text-right font-mono ${entry.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {entry.pnl}
                      </td>
                      <td className="p-4 text-right font-mono text-red-300">
                        -{charges}
                      </td>
                      <td className={`p-4 text-right font-mono font-bold text-base ${net >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                        {net}
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => deleteEntry(entry.id)} className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-gray-500">
                      No trades found. Add your first trade above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;