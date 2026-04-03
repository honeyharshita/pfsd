// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { localApi } from '../../api/localApiClient';
import { Loader2, Download } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export default function WeeklyReport() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWeekDate, setSelectedWeekDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchReport();
  }, [selectedWeekDate]);

  const selectedWeek = new Date(`${selectedWeekDate}T00:00:00`);
  const weekStart = format(startOfWeek(selectedWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(selectedWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await localApi.reports.generateWeekly({
        userEmail: 'anonymous',
        weekDescription: '',
        weekStart,
        weekEnd,
      });
      setResult(data.reply || data);
    } catch (err) {
      setError(err.message || 'Failed to fetch weekly report');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const html = await localApi.reports.generateWeekly({ userEmail: 'anonymous', weekDescription: '', weekStart, weekEnd });
      const link = document.createElement('a');
      link.href = `data:text/html;charset=utf-8,${encodeURIComponent(html?.reply?.html || html?.html || '<p>Report not available</p>')}`;
      link.download = `wellness-report-${new Date().toISOString().split('T')[0]}.html`;
      link.click();
    } catch (err) {
      alert('Failed to download report');
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">📋 Weekly Wellness Report</h3>
        <button
          onClick={downloadReport}
          className="flex items-center gap-2 px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md text-sm transition"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Week</label>
        <input
          type="date"
          value={selectedWeekDate}
          onChange={(e) => setSelectedWeekDate(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <p className="mt-2 text-xs text-gray-500">Range: {weekStart} to {weekEnd}</p>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Week Summary */}
          {result.week_summary && (
            <div className="p-4 bg-indigo-50 rounded-md">
              <h4 className="font-semibold text-indigo-900 mb-2">Week Summary</h4>
              <p className="text-sm text-gray-700">{result.week_summary}</p>
            </div>
          )}

          {/* Themes */}
          {result.themes && Array.isArray(result.themes) && result.themes.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Key Themes</h4>
              <div className="grid grid-cols-2 gap-2">
                {result.themes.map((theme, idx) => (
                  <div key={idx} className="p-2 bg-gray-100 rounded-md text-sm text-gray-700">
                    {theme}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wins */}
          {result.wins && Array.isArray(result.wins) && result.wins.length > 0 && (
            <div>
              <h4 className="font-semibold text-green-700 mb-2">✨ This Week's Wins</h4>
              <ul className="space-y-2">
                {result.wins.map((win, idx) => (
                  <li key={idx} className="p-2 bg-green-50 rounded-md text-sm text-gray-700">
                    ✓ {win}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations && Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold text-blue-700 mb-2">💡 Recommendations</h4>
              <ul className="space-y-2">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="p-2 bg-blue-50 rounded-md text-sm text-gray-700">
                    • {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={fetchReport}
            className="w-full mt-4 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 rounded-md transition"
          >
            Refresh Report
          </button>
        </div>
      )}
    </div>
  );
}
