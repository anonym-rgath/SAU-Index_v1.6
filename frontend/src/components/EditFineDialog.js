import React, { useState } from 'react';
import { api } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { toast } from 'sonner';

const EditFineDialog = ({ open, onOpenChange, fine, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: fine?.amount || '',
    notes: fine?.notes || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.fines.update(fine.id, {
        amount: parseFloat(formData.amount),
        notes: formData.notes || null,
      });
      onSuccess();
    } catch (error) {
      toast.error('Fehler beim Aktualisieren der Strafe');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Strafe bearbeiten</DialogTitle>
          <DialogDescription>
            Betrag und Notiz der Strafe anpassen
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Betrag (€) *</Label>
              <Input
                data-testid="edit-fine-amount-input"
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="h-12 rounded-xl border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notiz (optional)</Label>
              <Textarea
                data-testid="edit-fine-notes-input"
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Zusätzliche Informationen"
                className="rounded-xl border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-11 px-6 rounded-full bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Abbrechen
            </Button>
            <Button
              data-testid="submit-edit-fine-button"
              type="submit"
              className="h-11 px-8 rounded-full bg-emerald-700 text-white font-medium hover:bg-emerald-800 transition-transform active:scale-95 shadow-lg shadow-emerald-700/20"
            >
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFineDialog;