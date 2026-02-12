import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Users, Plus, Pencil, Trash2, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { useAuth } from '../contexts/AuthContext';
import QRCodeDialog from '../components/QRCodeDialog';

const Members = () => {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrMember, setQrMember] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);
  const [formData, setFormData] = useState({ name: '', nfc_id: '', status: 'aktiv' });
  const [sortBy, setSortBy] = useState('name-asc');

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const response = await api.members.getAll();
      setMembers(response.data);
    } catch (error) {
      toast.error('Fehler beim Laden der Mitglieder');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await api.members.update(editingMember.id, formData);
        toast.success('Mitglied aktualisiert');
      } else {
        await api.members.create(formData);
        toast.success('Mitglied erstellt');
      }
      setDialogOpen(false);
      setEditingMember(null);
      setFormData({ name: '' });
      loadMembers();
    } catch (error) {
      toast.error('Fehler beim Speichern');
    }
  };

  const handleDelete = async () => {
    try {
      await api.members.delete(deletingMember.id);
      toast.success('Mitglied gelöscht');
      setDeleteDialogOpen(false);
      setDeletingMember(null);
      loadMembers();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const openAddDialog = () => {
    setEditingMember(null);
    setFormData({ name: '', nfc_id: '', status: 'aktiv' });
    setDialogOpen(true);
  };

  const openEditDialog = (member) => {
    setEditingMember(member);
    setFormData({ name: member.name, nfc_id: member.nfc_id || '', status: member.status || 'aktiv' });
    setDialogOpen(true);
  };

  const openDeleteDialog = (member) => {
    setDeletingMember(member);
    setDeleteDialogOpen(true);
  };

  const openQRDialog = (member) => {
    setQrMember(member);
    setQrDialogOpen(true);
  };

  const getSortedMembers = () => {
    const sorted = [...members];
    
    switch (sortBy) {
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'status-aktiv':
        return sorted.sort((a, b) => {
          if (a.status === 'aktiv' && b.status !== 'aktiv') return -1;
          if (a.status !== 'aktiv' && b.status === 'aktiv') return 1;
          return a.name.localeCompare(b.name);
        });
      case 'status-passiv':
        return sorted.sort((a, b) => {
          if (a.status === 'passiv' && b.status !== 'passiv') return -1;
          if (a.status !== 'passiv' && b.status === 'passiv') return 1;
          return a.name.localeCompare(b.name);
        });
      case 'date-newest':
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'date-oldest':
        return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      default:
        return sorted;
    }
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
              Mitglieder
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Vereinsmitglieder
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                data-testid="add-member-button"
                onClick={openAddDialog}
                className="h-11 px-6 rounded-full bg-emerald-700 text-white font-medium hover:bg-emerald-800 transition-transform active:scale-95 shadow-lg shadow-emerald-700/20"
              >
                <Plus className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Mitglied</span>
                <span className="sm:hidden">Neu</span>
              </Button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <Select
            value={sortBy}
            onValueChange={setSortBy}
          >
            <SelectTrigger data-testid="sort-members-select" className="h-11 rounded-xl max-w-xs">
              <SelectValue placeholder="Sortieren nach..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="status-aktiv">Status: Aktiv zuerst</SelectItem>
              <SelectItem value="status-passiv">Status: Passiv zuerst</SelectItem>
              <SelectItem value="date-newest">Neueste zuerst</SelectItem>
              <SelectItem value="date-oldest">Älteste zuerst</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-emerald-700" />
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">
              Alle Mitglieder
            </h2>
          </div>

          <div className="space-y-2" data-testid="members-list">
            {members.length > 0 ? (
              getSortedMembers().map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-stone-100 bg-stone-50 active:bg-stone-100 transition-colors min-h-[72px]"
                  data-testid={`member-item-${member.id}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-stone-900 truncate">{member.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        member.status === 'aktiv' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-stone-200 text-stone-600'
                      }`}>
                        {member.status === 'aktiv' ? 'Aktiv' : 'Passiv'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 truncate">
                      {member.nfc_id ? `NFC: ${member.nfc_id}` : 'Keine NFC ID'}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 flex-shrink-0 ml-2">
                      <Button
                        data-testid={`qr-member-${member.id}`}
                        onClick={() => openQRDialog(member)}
                        className="h-10 w-10 p-0 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors"
                        title="QR-Code anzeigen"
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                      <Button
                        data-testid={`edit-member-${member.id}`}
                        onClick={() => openEditDialog(member)}
                        className="h-10 w-10 p-0 rounded-full bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        data-testid={`delete-member-${member.id}`}
                        onClick={() => openDeleteDialog(member)}
                        className="h-10 w-10 p-0 rounded-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-stone-400 py-8">
                Noch keine Mitglieder
              </p>
            )}
          </div>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? 'Mitglied bearbeiten' : 'Neues Mitglied'}
            </DialogTitle>
            <DialogDescription>
              {editingMember ? 'Name des Mitglieds ändern' : 'Neues Mitglied hinzufügen'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  data-testid="member-name-input"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Mitgliedsname"
                  className="h-12 rounded-xl border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-base"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="member-status-select" className="h-12 rounded-xl">
                    <SelectValue placeholder="Status wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aktiv">Aktiv</SelectItem>
                    <SelectItem value="passiv">Passiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nfc_id">NFC ID (optional)</Label>
                <Input
                  data-testid="member-nfc-input"
                  id="nfc_id"
                  value={formData.nfc_id}
                  onChange={(e) => setFormData({ ...formData, nfc_id: e.target.value })}
                  placeholder="z.B. A1B2C3D4"
                  className="h-12 rounded-xl border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-base"
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
                data-testid="submit-member-button"
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
            <AlertDialogTitle>Mitglied löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie das Mitglied "{deletingMember?.name}" wirklich löschen?
              Alle zugehörigen Strafen werden ebenfalls gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-delete-member"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <QRCodeDialog
        open={qrDialogOpen}
        onOpenChange={setQrDialogOpen}
        member={qrMember}
      />
    </div>
  );
};

export default Members;