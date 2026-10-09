import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Smartphone, 
  ArrowRight, 
  RefreshCw, 
  Terminal, 
  Copy, 
  Check,
  Filter,
  Clock
} from 'lucide-react';
import { TaskRecord } from '../types/assistant';

interface TaskHistoryScreenProps {
  history: TaskRecord[];
  onClearHistory: () => void;
  onRerunCommand: (cmd: string) => void;
  language?: 'hi' | 'en';
}

export const TaskHistoryScreen: React.FC<TaskHistoryScreenProps> = ({
  history,
  onClearHistory,
  onRerunCommand,
  language = 'hi',
}) => {
  const isHindi = language === 'hi';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'completed' | 'native_required'>('all');
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.intent.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterType === 'completed') return item.status === 'completed';
    if (filterType === 'native_required') return item.capability === 'native_android_required';
    return true;
  });

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#27272A]">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="font-display text-lg font-bold text-[#F4F4F5]">
              {isHindi ? 'टास्क निष्पादन इतिहास' : 'Task Execution History'}
            </h2>
          </div>
          <p className="text-xs text-[#71717A] mt-0.5">
            {isHindi
              ? 'प्राकृतिक भाषा कमांड, इंटेंट ट्री और एंड्रॉइड ब्रिज ऑडिट ट्रेल।'
              : 'Audit trail of natural language commands, intent trees, and Android bridge dispatches.'}
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-[#27272A] hover:border-rose-900/60 bg-[#121217] hover:bg-rose-950/20 text-xs text-[#A1A1AA] hover:text-rose-300 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isHindi ? 'इतिहास साफ़ करें' : 'Clear History'}</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isHindi ? 'कमांड या इंटेंट खोजें...' : 'Search commands or intents...'}
            className="w-full h-10 pl-9 pr-3 bg-[#121217] border border-[#27272A] rounded-xl text-xs text-[#F4F4F5] placeholder-[#71717A] outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div className="flex items-center gap-1 self-start sm:self-auto bg-[#121217] p-1 rounded-xl border border-[#27272A]">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === 'all'
                ? 'bg-[#1E1E26] text-[#F5D061] font-semibold'
                : 'text-[#71717A] hover:text-[#D4D4D8]'
            }`}
          >
            {isHindi ? 'सभी' : 'All'} ({history.length})
          </button>
          <button
            onClick={() => setFilterType('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === 'completed'
                ? 'bg-[#1E1E26] text-emerald-400 font-semibold'
                : 'text-[#71717A] hover:text-[#D4D4D8]'
            }`}
          >
            {isHindi ? 'पूर्ण हुए' : 'Completed'}
          </button>
          <button
            onClick={() => setFilterType('native_required')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === 'native_required'
                ? 'bg-[#1E1E26] text-amber-400 font-semibold'
                : 'text-[#71717A] hover:text-[#D4D4D8]'
            }`}
          >
            {isHindi ? 'नेटिव एंड्रॉइड' : 'Native Android'}
          </button>
        </div>
      </div>

      {/* History Items List */}
      {filteredHistory.length === 0 ? (
        <div className="py-12 text-center bg-[#0C0C0F] border border-[#22222A] rounded-2xl p-6">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#141419] border border-[#27272A] flex items-center justify-center text-[#71717A] mb-3">
            <Clock className="w-5 h-5 text-[#D4AF37]/50" />
          </div>
          <p className="text-sm font-semibold text-[#E4E4E7]">
            {isHindi ? 'अभी तक कोई कार्य रिकॉर्ड नहीं हुआ' : 'No tasks recorded yet'}
          </p>
          <p className="text-xs text-[#71717A] mt-1 max-w-sm mx-auto">
            {isHindi
              ? 'आवाज़ या टेक्स्ट द्वारा निष्पादित सभी निर्देश पूरे लाइफसाइकिल विवरण और एंड्रॉइड इंटेंट के साथ यहाँ दर्ज होंगे।'
              : 'Commands executed via voice or text will be indexed here with complete lifecycle metrics and Android Intent payloads.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="bg-[#0E0E12] border border-[#22222A] hover:border-[#D4AF37]/40 rounded-xl p-3.5 sm:p-4 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {item.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : item.capability === 'native_android_required' ? (
                      <Smartphone className="w-4 h-4 text-amber-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-[#F4F4F5] font-sans">
                      "{item.command}"
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-[#A1A1AA]">
                      <span className="font-mono text-[#D4AF37]">{item.intent}</span>
                      <span aria-hidden="true">·</span>
                      <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span aria-hidden="true">·</span>
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>

                    <p className="text-xs text-[#A1A1AA] mt-2 line-clamp-2">
                      {item.response}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onRerunCommand(item.command)}
                    className="p-1.5 text-[#71717A] hover:text-[#F5D061] hover:bg-[#1C1709] rounded-lg border border-[#27272A] transition-colors"
                    title={isHindi ? 'पुनः निष्पादित करें' : 'Re-run command'}
                    aria-label="Re-run this command"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setSelectedTask(selectedTask?.id === item.id ? null : item)}
                    className="px-2.5 py-1 text-xs font-medium text-[#D4AF37] hover:text-[#FFF1B8] bg-[#1C1709] border border-[#5C4713] rounded-lg transition-colors"
                  >
                    {selectedTask?.id === item.id ? (isHindi ? 'बंद करें' : 'Close') : (isHindi ? 'विवरण' : 'Details')}
                  </button>
                </div>
              </div>

              {/* Expanded Detail Modal/Card */}
              {selectedTask?.id === item.id && (
                <div className="mt-4 pt-3 border-t border-[#27272A] space-y-3 bg-[#08080A] -mx-3.5 -mb-3.5 p-3.5 rounded-b-xl">
                  <div>
                    <span className="text-[11px] font-medium text-[#71717A] uppercase tracking-wider">
                      {isHindi ? `निष्पादन चरण (${item.steps.length})` : `Execution Steps (${item.steps.length})`}
                    </span>
                    <div className="mt-1.5 space-y-1">
                      {item.steps.map((st, i) => (
                        <div key={i} className="text-xs text-[#D4D4D8] flex items-center justify-between p-1.5 bg-[#121217] rounded-md">
                          <span>{st.label}</span>
                          <span className={`text-[10px] font-mono ${
                            st.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {st.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {item.nativeIntentPayload && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <Terminal className="w-3 h-3" />
                          {isHindi ? 'लक्षित एंड्रॉइड नेटिव ब्लूप्रिंट' : 'Target Android Native Blueprint'}
                        </span>
                        <button
                          onClick={() => copyText(JSON.stringify(item.nativeIntentPayload, null, 2))}
                          className="text-[10px] text-[#D4AF37] flex items-center gap-1"
                        >
                          {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedCode ? (isHindi ? 'कॉपी हो गया' : 'Copied') : (isHindi ? 'कॉपी करें' : 'Copy')}</span>
                        </button>
                      </div>
                      <pre className="p-2.5 bg-black rounded-lg border border-[#27272A] text-[10px] font-mono text-[#D4AF37] overflow-x-auto">
                        {JSON.stringify(item.nativeIntentPayload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
