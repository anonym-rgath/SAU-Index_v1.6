import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { PiggyBank, Wallet, Plus, Trophy, Calendar, Scan } from 'lucide-react';
import { toast } from 'sonner';
import AddFineDialog from '../components/AddFineDialog';
import QRScanDialog from '../components/QRScanDialog';
import { formatCurrency, formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const [fiscalYear, setFiscalYear] = useState('');
  const [fiscalYears, setFiscalYears] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [recentFines, setRecentFines] = useState([]);
  const [members, setMembers] = useState([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (fiscalYear) {
      loadData();
    }
  }, [fiscalYear]);

  const loadInitialData = async () => {
    try {
      const yearsRes = await api.fiscalYears.getAll();
      const years = yearsRes.data.fiscal_years || [];
      setFiscalYears(years);
      if (years.length > 0) {
        setFiscalYear(years[0]); // Aktuellstes Geschäftsjahr
      }
    } catch (error) {
      toast.error('Fehler beim Laden der Geschäftsjahre');
      console.error(error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, finesRes, membersRes] = await Promise.all([
        api.statistics.getByFiscalYear(fiscalYear),
        api.fines.getAll(fiscalYear),
        api.members.getAll(),
      ]);
      
      setStatistics(statsRes.data);
      setRecentFines(finesRes.data.slice(0, 6));
      setMembers(membersRes.data);
    } catch (error) {
      toast.error('Fehler beim Laden der Daten');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFineAdded = () => {
    setAddDialogOpen(false);
    loadData();
    toast.success('Strafe erfolgreich eingetragen');
  };

  const handleScanComplete = (memberId) => {
    setScanDialogOpen(false);
    setSelectedMemberId(memberId);
    setAddDialogOpen(true);
  };

  const getMemberName = (memberId) => {
    return members.find(m => m.id === memberId)?.name || 'Unbekannt';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-stone-500">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-stone-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Ranking & Strafen
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-full px-3 h-10 shadow-sm">
            <Calendar className="w-4 h-4 text-stone-400" />
            <select
              data-testid="fiscal-year-selector"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              className="bg-transparent border-none outline-none text-stone-700 font-medium cursor-pointer text-base"
            >
              {fiscalYears.map(fy => (
                <option key={fy} value={fy}>GJ {fy}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Desktop-only buttons */}
        <div className="hidden md:flex gap-3 mb-6">
          <Button
            data-testid="scan-demo-button"
            onClick={() => setScanDialogOpen(true)}
            className="h-11 px-6 rounded-full bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <Scan className="w-4 h-4 mr-2" />
            NFC/QR Scan
          </Button>
          
          <Button
            data-testid="add-fine-button-desktop"
            onClick={() => {
              setSelectedMemberId(null);
              setAddDialogOpen(true);
            }}
            className="h-11 px-8 rounded-full bg-orange-500 text-white font-bold tracking-wide hover:bg-orange-600 hover:shadow-orange-500/30 transition-all uppercase text-sm shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Strafe
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-pink-50 to-white border-pink-100 rounded-2xl shadow-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider font-bold mb-0.5">
                  Sau
                </p>
                <p className="text-xs text-stone-500">Höchster</p>
              </div>
              <div className="bg-pink-100 p-2 rounded-lg">
                <PiggyBank className="w-5 h-5 text-pink-500" />
              </div>
            </div>
            <div data-testid="sau-value">
              {statistics?.sau ? (
                <>
                  <p className="text-2xl font-bold text-stone-900 mb-0.5">
                    {formatCurrency(statistics.sau.total)}
                  </p>
                  <p className="text-sm text-stone-600 truncate">{statistics.sau.member_name}</p>
                </>
              ) : (
                <p className="text-stone-400 text-sm">Keine Daten</p>
              )}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-stone-50 to-white border-stone-200 rounded-2xl shadow-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider font-bold mb-0.5">
                  Lämmchen
                </p>
                <p className="text-xs text-stone-500">Niedrigster</p>
              </div>
              <div className="bg-stone-100 p-2 rounded-lg">
                <Wallet className="w-5 h-5 text-stone-500" />
              </div>
            </div>
            <div data-testid="laemmchen-value">
              {statistics?.laemmchen ? (
                <>
                  <p className="text-2xl font-bold text-stone-900 mb-0.5">
                    {formatCurrency(statistics.laemmchen.total)}
                  </p>
                  <p className="text-sm text-stone-600 truncate">{statistics.laemmchen.member_name}</p>
                </>
              ) : (
                <p className="text-stone-400 text-sm">Keine Daten</p>
              )}
            </div>
          </Card>
        </div>

            <Card className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-5 h-5 text-emerald-700" />
                <h2 className="text-xl font-bold text-stone-900 tracking-tight">
                  Ranking GJ {fiscalYear}
                </h2>
              </div>
              
              <div className="space-y-2" data-testid="ranking-list">
                {statistics?.ranking && statistics.ranking.length > 0 ? (
                  statistics.ranking.map((entry) => (
                    <div
                      key={entry.member_id}
                      className="flex items-center gap-3 p-4 rounded-xl border border-stone-100 bg-stone-50 active:bg-stone-100 transition-colors min-h-[72px]"
                      data-testid={`ranking-entry-${entry.rank}`}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm flex-shrink-0">
                        #{entry.rank}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-stone-900 truncate">{entry.member_name}</p>
                        <p className="text-sm text-stone-500">
                          {formatCurrency(entry.total)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-stone-400 py-8">
                    Noch keine Strafen für GJ {fiscalYear}
                  </p>
                )}
              </div>
            </Card>

            <Card className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
              <h2 className="text-xl font-bold text-stone-900 tracking-tight mb-4">
                Letzte Strafen
              </h2>
              
              <div className="space-y-2" data-testid="recent-fines-list">
                {recentFines.length > 0 ? (
                  recentFines.map((fine) => (
                    <div
                      key={fine.id}
                      className="p-3 rounded-xl border border-stone-100 bg-stone-50"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-semibold text-stone-900">
                          {getMemberName(fine.member_id)}
                        </p>
                        <span className="text-emerald-700 font-bold">
                          {formatCurrency(fine.amount)}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">
                        {fine.fine_type_label}
                      </p>
                      <p className="text-xs text-stone-400 mt-1">
                        {formatDate(fine.date)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-stone-400 py-8">
                    Noch keine Strafen
                  </p>
                )}
              </div>
            </Card>

          {/* Floating Action Button - nur für Admin */}
          {isAdmin && (
            <>
              <button
                data-testid="add-fine-fab"
                onClick={() => {
                  setSelectedMemberId(null);
                  setAddDialogOpen(true);
                }}
                className="fixed bottom-6 right-4 z-40 w-14 h-14 rounded-full bg-emerald-700 text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              >
                <Plus className="w-6 h-6" />
              </button>

              <button
                data-testid="scan-fab"
                onClick={() => setScanDialogOpen(true)}
                className="fixed bottom-6 right-20 z-40 w-12 h-12 rounded-full bg-white border-2 border-stone-200 text-stone-700 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              >
                <Scan className="w-5 h-5" />
              </button>
            </>
          )}
      </div>

      <AddFineDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleFineAdded}
        preselectedMemberId={selectedMemberId}
      />
      
      <QRScanDialog
        open={scanDialogOpen}
        onOpenChange={setScanDialogOpen}
        onScanComplete={handleScanComplete}
      />
    </div>
  );
};

export default Dashboard;