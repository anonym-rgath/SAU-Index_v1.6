import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Pencil, Trash2, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import EditFineDialog from '../components/EditFineDialog';
import { formatCurrency, formatDate } from '../lib/utils';

const Fines = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([]);
  const [fines, setFines] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingFine, setEditingFine] = useState(null);
  const [deletingFine, setDeletingFine] = useState(null);

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [finesRes, membersRes, yearsRes] = await Promise.all([
        api.fines.getAll(year),
        api.members.getAll(),
        api.years.getAll(),
      ]);
      
      setFines(finesRes.data);
      setMembers(membersRes.data);
      setYears(yearsRes.data.years || [year]);
    } catch (error) {
      toast.error('Fehler beim Laden der Daten');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.fines.delete(deletingFine.id);
      toast.success('Strafe gelöscht');
      setDeleteDialogOpen(false);
      setDeletingFine(null);
      loadData();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const openEditDialog = (fine) => {
    setEditingFine(fine);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (fine) => {
    setDeletingFine(fine);
    setDeleteDialogOpen(true);
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
    <div className="min-h-screen bg-stone-50 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-stone-900 tracking-tight mb-2">
              Strafen
            </h1>
            <p className="text-stone-500 leading-relaxed">
              Alle Strafeinträge verwalten
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-full px-4 h-11">
            <select
              data-testid="fines-year-selector"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent border-none outline-none text-stone-700 font-medium cursor-pointer"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <Card className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Receipt className="w-5 h-5 text-emerald-700" />
            <h2 className="text-2xl font-semibold text-stone-900 tracking-tight">
              Alle Strafen {year}
            </h2>
          </div>

          <div className="space-y-2" data-testid="fines-list">
            {fines.length > 0 ? (
              fines.map((fine) => (
                <div
                  key={fine.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-stone-200 bg-stone-50 hover:-translate-y-1 transition-transform duration-300"
                  data-testid={`fine-item-${fine.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold text-stone-900">
                        {getMemberName(fine.member_id)}
                      </p>
                      <span className="text-emerald-700 font-bold">
                        {formatCurrency(fine.amount)}
                      </span>
                    </div>
                    <p className="text-sm text-stone-600">{fine.fine_type_label}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs text-stone-400">
                        {formatDate(fine.date)}
                      </p>
                      {fine.notes && (
                        <p className="text-xs text-stone-500">
                          Notiz: {fine.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      data-testid={`edit-fine-${fine.id}`}
                      onClick={() => openEditDialog(fine)}
                      className="h-9 w-9 p-0 rounded-full bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      data-testid={`delete-fine-${fine.id}`}
                      onClick={() => openDeleteDialog(fine)}
                      className="h-9 w-9 p-0 rounded-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-stone-400 py-8">
                Noch keine Strafen für {year}
              </p>
            )}
          </div>
        </Card>
      </div>

      {editingFine && (
        <EditFineDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          fine={editingFine}
          onSuccess={() => {
            setEditDialogOpen(false);
            setEditingFine(null);
            loadData();
            toast.success('Strafe aktualisiert');
          }}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Strafe löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Strafe wirklich löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-delete-fine"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Fines;