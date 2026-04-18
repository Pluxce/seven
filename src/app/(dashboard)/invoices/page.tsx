'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Card, Badge, Button, Modal, Input } from '@/components/ui';
import { DashboardLayout } from '@/components/layout';
import { Invoice, Payment, Patient } from '@/lib/types';

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  draft: 'default',
  pending: 'warning',
  paid: 'success',
  cancelled: 'error',
  overdue: 'error',
};

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  paid: 'Payée',
  cancelled: 'Annulée',
  overdue: 'En retard',
};

const paymentMethodLabels: Record<string, string> = {
  cash: 'Espèces',
  mobile_money: 'Mobile Money',
  card: 'Carte bancaire',
  bank_transfer: 'Virement',
  insurance: 'Assurance',
};

export default function InvoicesPage() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filter, setFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filter]);

  const loadData = () => {
    let filteredInvoices: Invoice[];
    
    if (user?.role === 'patient') {
      const patient = db.getPatientByUserId(user.id);
      filteredInvoices = patient ? db.getInvoices({ patientId: patient.id }) : [];
    } else {
      filteredInvoices = db.getInvoices();
      if (filter !== 'all') {
        filteredInvoices = filteredInvoices.filter(i => i.status === filter);
      }
    }
    
    setInvoices(filteredInvoices);
    setPatients(db.getPatients());
  };

  const handleCreatePayment = (paymentData: { method: string; amount: number; transactionId?: string; phoneNumber?: string; operator?: string }) => {
    if (!selectedInvoice) return;
    
    db.createPayment({
      invoiceId: selectedInvoice.id,
      amount: paymentData.amount,
      method: paymentData.method as any,
      status: 'completed',
      transactionId: paymentData.transactionId,
      phoneNumber: paymentData.phoneNumber,
      operator: paymentData.operator,
      paidAt: new Date(),
    });
    
    setIsPaymentModalOpen(false);
    setSelectedInvoice(null);
    loadData();
  };

  const totalPending = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.total, 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Factures
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              Gestion des factures et paiements
            </p>
          </div>
          {hasRole(['medecin', 'chef_cabinet', 'admin', 'super_admin']) && (
            <Button onClick={() => setIsNewInvoiceModalOpen(true)}>
              + Nouvelle facture
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <p className="text-sm text-zinc-500">Total en attente</p>
            <p className="text-2xl font-bold text-yellow-600">{totalPending.toFixed(2)} €</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-zinc-500">Total payé</p>
            <p className="text-2xl font-bold text-green-600">{totalPaid.toFixed(2)} €</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-zinc-500">Nombre de factures</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{invoices.length}</p>
          </Card>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'Toutes' },
            { value: 'pending', label: 'En attente' },
            { value: 'paid', label: 'Payées' },
            { value: 'overdue', label: 'En retard' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${filter === f.value
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {invoices.length > 0 ? (
            invoices.map((invoice) => (
              <Card key={invoice.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {invoice.invoiceNumber}
                        </h3>
                        <Badge variant={statusColors[invoice.status]}>
                          {statusLabels[invoice.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {invoice.patient?.user?.firstName} {invoice.patient?.user?.lastName}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                        {invoice.total.toFixed(2)} €
                      </p>
                      <p className="text-xs text-zinc-500">
                        Échéance: {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    
                    {invoice.status === 'pending' && user?.role === 'patient' && (
                      <Button 
                        size="sm" 
                        onClick={() => { setSelectedInvoice(invoice); setIsPaymentModalOpen(true); }}
                      >
                        Payer
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => { setSelectedInvoice(invoice); setIsViewModalOpen(true); }}
                    >
                      Voir
                    </Button>
                  </div>
                </div>
                
                {invoice.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-2">Services:</p>
                    <div className="flex flex-wrap gap-2">
                      {invoice.items.map((item) => (
                        <Badge key={item.id} variant="default" className="text-xs">
                          {item.description} - {item.total}€
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <p className="text-zinc-500">Aucune facture trouvée</p>
            </Card>
          )}
        </div>
      </div>

      <Modal
        isOpen={isPaymentModalOpen && !!selectedInvoice}
        onClose={() => { setIsPaymentModalOpen(false); setSelectedInvoice(null); }}
        title="Effectuer un paiement"
        size="lg"
      >
        {selectedInvoice && (
          <PaymentForm 
            invoice={selectedInvoice}
            onSubmit={handleCreatePayment}
            onClose={() => { setIsPaymentModalOpen(false); setSelectedInvoice(null); }}
          />
        )}
      </Modal>

      <Modal
        isOpen={isNewInvoiceModalOpen}
        onClose={() => setIsNewInvoiceModalOpen(false)}
        title="Nouvelle facture"
        size="lg"
      >
        <NewInvoiceForm 
          patients={patients}
          onClose={() => { setIsNewInvoiceModalOpen(false); loadData(); }}
        />
      </Modal>

      <Modal
        isOpen={isViewModalOpen && !!selectedInvoice}
        onClose={() => { setIsViewModalOpen(false); setSelectedInvoice(null); }}
        title=""
        size="lg"
      >
        {selectedInvoice && (
          <InvoicePreview invoice={selectedInvoice} />
        )}
      </Modal>
    </DashboardLayout>
  );
}

function PaymentForm({ 
  invoice, 
  onSubmit, 
  onClose 
}: { 
  invoice: Invoice; 
  onSubmit: (data: any) => void; 
  onClose: () => void;
}) {
  const [method, setMethod] = useState('mobile_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [operator, setOperator] = useState('Orange');
  const [transactionId, setTransactionId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      method,
      amount: invoice.total,
      phoneNumber: method === 'mobile_money' ? phoneNumber : undefined,
      operator: method === 'mobile_money' ? operator : undefined,
      transactionId: transactionId || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{invoice.invoiceNumber}</p>
            <p className="text-sm text-zinc-500">{invoice.patient?.user?.firstName} {invoice.patient?.user?.lastName}</p>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{invoice.total.toFixed(2)} €</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Mode de paiement</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { value: 'mobile_money', label: 'Mobile Money', icon: '📱' },
            { value: 'cash', label: 'Espèces', icon: '💵' },
            { value: 'card', label: 'Carte bancaire', icon: '💳' },
            { value: 'bank_transfer', label: 'Virement', icon: '🏦' },
          ].map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMethod(m.value)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                method === m.value 
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900' 
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
              }`}
            >
              <span className="text-2xl block mb-1">{m.icon}</span>
              <span className="text-sm font-medium">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {method === 'mobile_money' && (
        <>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Opérateur</label>
            <select
              className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
            >
              <option value="Orange">Orange Money</option>
              <option value="Moov">Moov Money</option>
              <option value="MTN">MTN Mobile Money</option>
              <option value="Wave">Wave</option>
            </select>
          </div>
          
          <Input
            label="Numéro de téléphone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+33 6 12 34 56 78"
            required
          />
          
          <Input
            label="ID de transaction (optionnel)"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Numéro de transaction"
          />
        </>
      )}

      {method === 'card' && (
        <Input
          label="Numéro de transaction"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="Numéro d'autorisation"
        />
      )}

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Annuler
        </Button>
        <Button type="submit" className="flex-1">
          Confirmer le paiement
        </Button>
      </div>
    </form>
  );
}

function NewInvoiceForm({ patients, onClose }: { patients: Patient[]; onClose: () => void }) {
  const [formData, setFormData] = useState<{
    patientId: string;
    items: { description: string; quantity: number; unitPrice: number; total: number }[];
    dueDate: string;
    notes: string;
  }>({
    patientId: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
    dueDate: '',
    notes: '',
  });

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    setFormData({ ...formData, items: newItems });
  };

  const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const patient = patients.find(p => p.id === formData.patientId);
    if (!patient) return;

    db.createInvoice({
      invoiceNumber: db.generateInvoiceNumber(),
      patientId: formData.patientId,
      patient,
      cabinetId: '1',
      items: formData.items.map((item, idx) => ({
        id: String(idx + 1),
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      })),
      subtotal,
      tax: 0,
      discount: 0,
      total: subtotal,
      status: 'pending',
      dueDate: new Date(formData.dueDate || Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: formData.notes,
    });
    
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Patient</label>
        <select
          className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
          value={formData.patientId}
          onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
          required
        >
          <option value="">Sélectionner un patient...</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.user.firstName} {p.user.lastName}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Services</label>
          <Button type="button" size="sm" variant="outline" onClick={addItem}>
            + Ajouter
          </Button>
        </div>
        
        {formData.items.map((item, index) => (
          <div key={index} className="flex gap-2 items-end">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Description du service"
                className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800"
                value={item.description}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                required
              />
            </div>
            <div className="w-20">
              <input
                type="number"
                placeholder="Qté"
                className="w-full rounded-full border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800 text-center"
                value={item.quantity}
                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>
            <div className="w-24">
              <input
                type="number"
                placeholder="Prix"
                className="w-full rounded-full border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800 text-right"
                value={item.unitPrice}
                onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                min={0}
                step={0.01}
              />
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="text-red-500"
              onClick={() => removeItem(index)}
            >
              ✕
            </Button>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-lg font-semibold border-t pt-4">
        <span>Total:</span>
        <span>{subtotal.toFixed(2)} €</span>
      </div>

      <Input
        label="Date d'échéance"
        type="date"
        value={formData.dueDate}
        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
      />

      <Input
        label="Notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        placeholder="Notes optionnelles..."
      />

      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Annuler
        </Button>
        <Button type="submit" className="flex-1">
          Créer la facture
        </Button>
      </div>
    </form>
  );
}

function InvoicePreview({ invoice }: { invoice: Invoice }) {
  const payments = db.getPayments({ invoiceId: invoice.id });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg overflow-hidden">
      <div className="bg-zinc-900 dark:bg-zinc-800 text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">SEVEN</h1>
            <p className="text-zinc-400 text-sm">Centre Médical Spécialisé</p>
            <p className="text-zinc-400 text-sm mt-1">Cocody Angré, Abidjan</p>
            <p className="text-zinc-400 text-sm">Côte d'Ivoire</p>
            <p className="text-zinc-400 text-sm">Tél: +225 07 00 00 000</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">FACTURE</h2>
            <p className="text-zinc-400">{invoice.invoiceNumber}</p>
          </div>
        </div>
      </div>

      <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-zinc-500 uppercase mb-1">Facturé à</p>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {invoice.patient?.user?.firstName} {invoice.patient?.user?.lastName}
            </p>
            <p className="text-sm text-zinc-500">{invoice.patient?.address || 'Adresse non spécifiée'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 uppercase mb-1">Date d'émission</p>
            <p className="text-zinc-900 dark:text-zinc-100">{new Date(invoice.createdAt).toLocaleDateString('fr-FR')}</p>
            <p className="text-xs text-zinc-500 uppercase mt-2 mb-1">Échéance</p>
            <p className="text-zinc-900 dark:text-zinc-100">{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="text-left py-2 text-xs text-zinc-500 uppercase">Description</th>
              <th className="text-center py-2 text-xs text-zinc-500 uppercase">Qté</th>
              <th className="text-right py-2 text-xs text-zinc-500 uppercase">Prix unitaire</th>
              <th className="text-right py-2 text-xs text-zinc-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="py-3 text-zinc-900 dark:text-zinc-100">{item.description}</td>
                <td className="py-3 text-center text-zinc-600 dark:text-zinc-400">{item.quantity}</td>
                <td className="py-3 text-right text-zinc-600 dark:text-zinc-400">{item.unitPrice.toFixed(2)} €</td>
                <td className="py-3 text-right text-zinc-900 dark:text-zinc-100 font-medium">{item.total.toFixed(2)} €</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Sous-total</span>
              <span className="text-zinc-900 dark:text-zinc-100">{invoice.subtotal.toFixed(2)} €</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Remise</span>
                <span className="text-green-600">-{invoice.discount.toFixed(2)} €</span>
              </div>
            )}
            {invoice.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">TVA</span>
                <span className="text-zinc-900 dark:text-zinc-100">{invoice.tax.toFixed(2)} €</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t border-zinc-200 dark:border-zinc-700 pt-2">
              <span>Total</span>
              <span className="text-zinc-900 dark:text-zinc-100">{invoice.total.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {payments.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">Paiement(s) enregistré(s)</p>
            {payments.map((payment) => (
              <div key={payment.id} className="flex justify-between text-sm">
                <span className="text-green-700 dark:text-green-300">
                  {payment.method === 'mobile_money' ? '📱 Mobile Money' : payment.method === 'cash' ? '💵 Espèces' : '💳 Carte'}
                  {payment.transactionId && ` - ${payment.transactionId}`}
                </span>
                <span className="font-medium text-green-800 dark:text-green-200">{payment.amount.toFixed(2)} €</span>
              </div>
            ))}
          </div>
        )}

        {invoice.notes && (
          <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <p className="text-xs text-zinc-500 uppercase mb-1">Notes</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{invoice.notes}</p>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-zinc-400">
          <p>Merci pour votre confiance</p>
          <p className="mt-1">SEVEN - Centre Médical Spécialisé - Abidjan</p>
        </div>
      </div>

      <div className="p-4 bg-zinc-50 dark:bg-zinc-800 flex justify-between items-center">
        <Badge variant={statusColors[invoice.status]}>
          {statusLabels[invoice.status]}
        </Badge>
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          Imprimer
        </Button>
      </div>
    </div>
  );
}
