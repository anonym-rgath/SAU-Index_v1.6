import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tag, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
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
import { formatCurrency } from '../lib/utils';

const FineTypes = () => {
  const [fineTypes, setFineTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingFineType, setEditingFineType] = useState(null);
  const [deletingFineType, setDeletingFineType] = useState(null);
  const [formData, setFormData] = useState({ label: '', amount: '' });

  useEffect(() => {
    loadFineTypes();
  }, []);

  const loadFineTypes = async () => {
    try {
      const response = await api.fineTypes.getAll();
      setFineTypes(response.data);
    } catch (error) {
      toast.error('Fehler beim Laden der Strafenarten');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        label: formData.label,
        amount: formData.amount ? parseFloat(formData.amount) : null,
      };
      
      if (editingFineType) {
        await api.fineTypes.update(editingFineType.id, data);
        toast.success('Strafenart aktualisiert');
      } else {
        await api.fineTypes.create(data);
        toast.success('Strafenart erstellt');
      }
      setDialogOpen(false);
      setEditingFineType(null);
      setFormData({ label: '', amount: '' });
      loadFineTypes();
    } catch (error) {
      toast.error('Fehler beim Speichern');
    }
  };

  const handleDelete = async () => {
    try {
      await api.fineTypes.delete(deletingFineType.id);
      toast.success('Strafenart gelöscht');
      setDeleteDialogOpen(false);
      setDeletingFineType(null);
      loadFineTypes();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const openAddDialog = () => {
    setEditingFineType(null);
    setFormData({ label: '', amount: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (fineType) => {
    setEditingFineType(fineType);
    setFormData({
      label: fineType.label,
      amount: fineType.amount !== null ? String(fineType.amount) : '',
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (fineType) => {
    setDeletingFineType(fineType);
    setDeleteDialogOpen(true);
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-stone-900 tracking-tight mb-2">
              Strafenarten
            </h1>
            <p className="text-stone-500 leading-relaxed">
              Strafenkatalog verwalten
            </p>
          </div>
          <Button
            data-testid="add-finetype-button"
            onClick={openAddDialog}
            className="h-11 px-8 rounded-full bg-emerald-700 text-white font-medium hover:bg-emerald-800 transition-transform active:scale-95 shadow-lg shadow-emerald-700/20"
          >
            <Plus className="w-5 h-5 mr-2" />
            Strafenart
          </Button>
        </div>

        <Card className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Tag className="w-5 h-5 text-emerald-700" />
            <h2 className="text-2xl font-semibold text-stone-900 tracking-tight">
              Alle Strafenarten
            </h2>
          </div>

          <div className="space-y-2" data-testid="finetypes-list">
            {fineTypes.length > 0 ? (
              fineTypes.map((fineType) => (
                <div
                  key={fineType.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-stone-200 bg-stone-50 hover:-translate-y-1 transition-transform duration-300"
                  data-testid={`finetype-item-${fineType.id}`}
                >
                  <div>
                    <p className="font-semibold text-stone-900">{fineType.label}</p>
                    <p className="text-sm text-stone-500">
                      Betrag: {fineType.amount !== null ? formatCurrency(fineType.amount) : 'Variabel'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      data-testid={`edit-finetype-${fineType.id}`}
                      onClick={() => openEditDialog(fineType)}
                      className="h-9 w-9 p-0 rounded-full bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      data-testid={`delete-finetype-${fineType.id}`}
                      onClick={() => openDeleteDialog(fineType)}
                      className="h-9 w-9 p-0 rounded-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-stone-400 py-8">
                Noch keine Strafenarten
              </p>
            )}
          </div>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFineType ? 'Strafenart bearbeiten' : 'Neue Strafenart'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="label">Bezeichnung</Label>
                <Input
                  data-testid="finetype-label-input"
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="z.B. Zu spät"
                  className="h-12 rounded-xl border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Betrag (€)</Label>
                <Input
                  data-testid="finetype-amount-input"
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Leer lassen für variablen Betrag"
                  className="h-12 rounded-xl border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="h-11 px-6 rounded-full bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors"
              >
                Abbrechen
              </Button>
              <Button
                data-testid="submit-finetype-button"
                type="submit"
                className="h-11 px-8 rounded-full bg-emerald-700 text-white font-medium hover:bg-emerald-800 transition-transform active:scale-95 shadow-lg shadow-emerald-700/20"
              >
                Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Strafenart löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Strafenart "{deletingFineType?.label}" wirklich löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-delete-finetype"
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

export default FineTypes;