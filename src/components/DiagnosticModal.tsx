import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Play, ShieldAlert, Cpu } from 'lucide-react';
import { runBusinessLogicTests, TestResult } from '../tests/businessLogic.test';
import { PricingEngine } from '../services/pricingEngine';

interface DiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticModal: React.FC<DiagnosticModalProps> = ({ isOpen, onClose }) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [filter, setFilter] = useState<string>('All');

  // Interactive Live Pricing Playground for verification
  const [testBase, setTestBase] = useState<number>(600);
  const [testMaxIncrease, setTestMaxIncrease] = useState<number>(150);
  const [testSellingPrice, setTestSellingPrice] = useState<number>(750);

  useEffect(() => {
    if (isOpen) {
      setResults(runBusinessLogicTests());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const passedCount = results.filter(r => r.passed).length;
  const categories = ['All', 'Pricing', 'Security', 'Targets', 'Payouts', 'Attribution', 'Commission'];

  const filteredResults = filter === 'All' ? results : results.filter(r => r.category === filter);

  const liveValidation = PricingEngine.validateAffiliatePrice(testBase, testMaxIncrease, testSellingPrice);
  const liveMargin = PricingEngine.calculateAffiliateMargin(testSellingPrice, testBase);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold tracking-tight">RONVEX Automated Logic Test Suite</h2>
              <p className="text-[11px] text-slate-400">Verifying core business, pricing, zero-threshold payouts & security assertions</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Test Summary Strip */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>{passedCount} of {results.length} Tests Passing</span>
            </div>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">Zero-Trust RBAC & Pricing Invariants Active</span>
          </div>

          {/* Interactive filter tabs */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  filter === cat ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Live Pricing Boundary Playground */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Interactive Pricing Rules Calculator (Section 8 Benchmark)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Formula: Gross Margin = Selling Price - Base Price
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-medium text-slate-600">Admin Base Price (৳)</label>
                <input
                  type="number"
                  value={testBase}
                  onChange={e => setTestBase(Number(e.target.value))}
                  className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-mono tabular-nums text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600">Max Permitted Increase (৳)</label>
                <input
                  type="number"
                  value={testMaxIncrease}
                  onChange={e => setTestMaxIncrease(Number(e.target.value))}
                  className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-mono tabular-nums text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600">Affiliate Selling Price (৳)</label>
                <input
                  type="number"
                  value={testSellingPrice}
                  onChange={e => setTestSellingPrice(Number(e.target.value))}
                  className="w-full mt-1 p-2 border border-slate-300 rounded-lg bg-white font-mono tabular-nums text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-600">Validation Status:</span>
                {liveValidation.valid ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Valid Price (Ceiling: ৳{testBase + testMaxIncrease})
                  </span>
                ) : (
                  <span className="text-rose-600 font-semibold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> {liveValidation.reason}
                  </span>
                )}
              </div>

              <div className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                Affiliate Gross Margin: {PricingEngine.formatBDT(liveMargin)}
              </div>
            </div>
          </div>

          {/* Test Results Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Test Assertions ({filteredResults.length})
            </h3>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden text-xs">
              {filteredResults.map(t => (
                <div key={t.id} className="p-3 bg-white flex items-start justify-between gap-3 hover:bg-slate-50/60">
                  <div className="flex items-start gap-2.5">
                    {t.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold text-slate-900">
                        {t.id}. {t.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{t.message}</div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                    {t.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500">All tests verified in memory with zero fake mocks.</span>
          <button
            onClick={() => setResults(runBusinessLogicTests())}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Re-run Suite</span>
          </button>
        </div>
      </div>
    </div>
  );
};
