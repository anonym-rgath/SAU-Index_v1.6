import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Scan } from 'lucide-react';

const ScanDemoDialog = ({ open, onOpenChange, onScanComplete }) => {
  const [members, setMembers] = useState([]);
  const [scannedMember, setScannedMember] = useState(null);

  useEffect(() => {
    if (open) {
      loadMembers();
      simulateScan();
    }
  }, [open]);

  const loadMembers = async () => {
    try {
      const response = await api.members.getAll();
      setMembers(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Mitglieder', error);
    }
  };

  const simulateScan = () => {
    setTimeout(() => {
      if (members.length > 0) {
        const randomMember = members[Math.floor(Math.random() * members.length)];
        setScannedMember(randomMember);
      }
    }, 500);
  };

  useEffect(() => {
    if (members.length > 0 && open) {
      simulateScan();
    }
  }, [members]);

  const handleContinue = () => {
    if (scannedMember) {
      onScanComplete(scannedMember.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>NFC/QR Scan (Demo)</DialogTitle>
          <DialogDescription>
            Simulierter Scan eines Mitglieds
          </DialogDescription>
        </DialogHeader>
        <div className="py-8 text-center">
          {scannedMember ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="bg-emerald-100 p-6 rounded-2xl">
                  <Scan className="w-12 h-12 text-emerald-700" />
                </div>
              </div>
              <p className="text-stone-900 font-semibold text-lg mb-2">
                Mitglied erkannt
              </p>
              <p className="text-2xl font-bold text-emerald-700 mb-4">
                {scannedMember.name}
              </p>
              <p className="text-sm text-stone-500">
                In der echten Version würde hier ein NFC/QR-Code gescannt.
              </p>
            </>
          ) : (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
            </div>
          )}
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
            data-testid="scan-continue-button"
            onClick={handleContinue}
            disabled={!scannedMember}
            className="h-11 px-8 rounded-full bg-emerald-700 text-white font-medium hover:bg-emerald-800 transition-transform active:scale-95 shadow-lg shadow-emerald-700/20"
          >
            Strafe buchen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScanDemoDialog;