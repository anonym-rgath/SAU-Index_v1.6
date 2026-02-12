import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Users, Plus, Trash2, Shield, UserCog, Eye } from 'lucide-react';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'vorstand',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.users.getAll();
      setUsers(response.data);
    } catch (error) {
      toast.error('Fehler beim Laden der Benutzer');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast.error('Bitte alle Felder ausfüllen');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setSubmitting(true);
    try {
      await api.users.create(formData);
      toast.success('Benutzer erstellt');
      setAddDialogOpen(false);
      setFormData({ username: '', password: '', role: 'vorstand' });
      loadUsers();
    } catch (error) {
      const message = error.response?.data?.detail || 'Fehler beim Erstellen';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.users.delete(deletingUser.id);
      toast.success('Benutzer gelöscht');
      setDeleteDialogOpen(false);
      setDeletingUser(null);
      loadUsers();
    } catch (error) {
      const message = error.response?.data?.detail || 'Fehler beim Löschen';
      toast.error(message);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'spiess': return 'Spieß';
      case 'vorstand': return 'Vorstand';
      default: return role;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-red-500" />;
      case 'spiess': return <UserCog className="w-4 h-4 text-emerald-600" />;
      case 'vorstand': return <Eye className="w-4 h-4 text-blue-500" />;
      default: return null;
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
              Benutzerverwaltung
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Benutzerkonten verwalten
            </p>
          </div>
          
          <Button
            data-testid="add-user-button"
            onClick={() => setAddDialogOpen(true)}
            className="h-10 px-4 rounded-full bg-emerald-700 text-white font-medium hover:bg-emerald-800 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Benutzer
          </Button>
        </div>

        <Card className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-emerald-700" />
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">
              Alle Benutzer
            </h2>
          </div>

          <div className="space-y-2" data-testid="users-list">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 rounded-xl border border-stone-100 bg-stone-50"
                data-testid={`user-item-${user.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">{user.username}</p>
                    <p className="text-sm text-stone-500">{getRoleLabel(user.role)}</p>
                  </div>
                </div>
                
                <Button
                  data-testid={`delete-user-${user.id}`}
                  onClick={() => {
                    setDeletingUser(user);
                    setDeleteDialogOpen(true);
                  }}
                  className="h-10 w-10 p-0 rounded-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Benutzer erstellen Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Neuer Benutzer</DialogTitle>
            <DialogDescription>
              Erstellen Sie ein neues Benutzerkonto
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Benutzername</Label>
                <Input
                  data-testid="new-user-username"
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="z.B. Max Mustermann"
                  className="h-12 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  data-testid="new-user-password"
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mindestens 6 Zeichen"
                  className="h-12 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rolle</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger data-testid="new-user-role" className="h-12 rounded-xl">
                    <SelectValue placeholder="Rolle wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin (Vollzugriff)</SelectItem>
                    <SelectItem value="spiess">Spieß (Vollzugriff außer Benutzerverwaltung)</SelectItem>
                    <SelectItem value="vorstand">Vorstand (eingeschränkt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => setAddDialogOpen(false)}
                className="h-11 px-6 rounded-full bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
              >
                Abbrechen
              </Button>
              <Button
                data-testid="submit-new-user"
                type="submit"
                disabled={submitting}
                className="h-11 px-8 rounded-full bg-emerald-700 text-white font-medium hover:bg-emerald-800"
              >
                {submitting ? 'Erstellen...' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Löschen Bestätigung */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Benutzer löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Benutzer "{deletingUser?.username}" wirklich löschen? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-delete-user"
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

export default UserManagement;
