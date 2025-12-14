import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

// Helper to map DB snake_case to app camelCase if needed, 
// but currently we mostly use matching names or will adjust query.
// Actually, simple way is to keep app state using what DB returns or map it.
// To minimize frontend breakage, we'll try to map DB data to existing App structure.

const AppContext = createContext();

const initialState = {
  user: null,
  loading: true,
  theme: 'light',
  sidebarOpen: true,
  clients: [],
  invoices: [],
  quotations: [],
  expenses: [],
  timeEntries: [],
  bankAccounts: [],
  settings: {
    businessName: 'Your Business',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    businessLogo: null,
    defaultCurrency: 'USD',
    defaultTaxRate: 10,
    invoicePrefix: 'INV',
    invoiceNextNumber: 1001,
    quotationPrefix: 'QUO',
    quotationNextNumber: 1001,
    paymentTerms: 30,
  },
  currencies: [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  ],
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      // Don't set loading to false here, we wait for data load
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'LOAD_DATA':
      return { ...state, ...action.payload, loading: false };

    // Optimistic Updates (applied immediately)
    case 'ADD_CLIENT':
      return { ...state, clients: [action.payload, ...state.clients] };
    case 'UPDATE_CLIENT':
      return { ...state, clients: state.clients.map(c => c.id === action.payload.id ? { ...c, ...action.payload } : c) };
    case 'DELETE_CLIENT':
      return { ...state, clients: state.clients.filter(c => c.id !== action.payload) };

    case 'ADD_INVOICE':
      return {
        ...state,
        invoices: [action.payload, ...state.invoices],
        settings: { ...state.settings, invoiceNextNumber: state.settings.invoiceNextNumber + 1 }
      };
    case 'UPDATE_INVOICE':
      return { ...state, invoices: state.invoices.map(i => i.id === action.payload.id ? { ...i, ...action.payload } : i) };
    case 'DELETE_INVOICE':
      return { ...state, invoices: state.invoices.filter(i => i.id !== action.payload) };

    case 'ADD_QUOTATION':
      return {
        ...state,
        quotations: [action.payload, ...state.quotations],
        settings: { ...state.settings, quotationNextNumber: state.settings.quotationNextNumber + 1 }
      };
    case 'UPDATE_QUOTATION':
      return { ...state, quotations: state.quotations.map(q => q.id === action.payload.id ? { ...q, ...action.payload } : q) };
    case 'DELETE_QUOTATION':
      return { ...state, quotations: state.quotations.filter(q => q.id !== action.payload) };

    case 'ADD_EXPENSE':
      return { ...state, expenses: [action.payload, ...state.expenses] };
    case 'UPDATE_EXPENSE':
      return { ...state, expenses: state.expenses.map(e => e.id === action.payload.id ? { ...e, ...action.payload } : e) };
    case 'DELETE_EXPENSE':
      return { ...state, expenses: state.expenses.filter(e => e.id !== action.payload) };

    case 'ADD_TIME_ENTRY':
      return { ...state, timeEntries: [action.payload, ...state.timeEntries] };
    case 'UPDATE_TIME_ENTRY':
      return { ...state, timeEntries: state.timeEntries.map(e => e.id === action.payload.id ? { ...e, ...action.payload } : e) };
    case 'DELETE_TIME_ENTRY':
      return { ...state, timeEntries: state.timeEntries.filter(e => e.id !== action.payload) };

    case 'ADD_BANK_ACCOUNT':
      return { ...state, bankAccounts: [action.payload, ...state.bankAccounts] };
    case 'UPDATE_BANK_ACCOUNT':
      return { ...state, bankAccounts: state.bankAccounts.map(b => b.id === action.payload.id ? { ...b, ...action.payload } : b) };
    case 'DELETE_BANK_ACCOUNT':
      return { ...state, bankAccounts: state.bankAccounts.filter(b => b.id !== action.payload) };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Sync wrapper
  const enhancedDispatch = async (action) => {
    // 1. Optimistic update
    dispatch(action);

    // 2. DB Sync
    if (!state.user && action.type !== 'SET_USER' && action.type !== 'LOAD_DATA') return;

    const { type, payload } = action;
    const userId = state.user?.id;

    try {
      switch (type) {
        case 'ADD_CLIENT':
          await supabase.from('clients').insert({ ...payload, user_id: userId });
          break;
        case 'UPDATE_CLIENT':
          await supabase.from('clients').update(payload).eq('id', payload.id);
          break;
        case 'DELETE_CLIENT':
          await supabase.from('clients').delete().eq('id', payload);
          break;

        case 'ADD_INVOICE': {
          const { items, ...invoiceData } = payload;
          // Insert invoice
          // Insert invoice
          const { error: invError } = await supabase.from('invoices').insert({
            id: payload.id, // Explicitly pass the ID we generated
            user_id: userId,
            client_id: payload.clientId || null,
            bank_account_id: payload.bankAccountId || null,
            status: payload.status,
            subtotal: payload.subtotal,
            total: payload.total,
            issue_date: payload.issueDate,
            due_date: payload.dueDate,
            invoice_number: payload.invoiceNumber,
            tax_rate: payload.taxRate,
            tax_amount: payload.taxAmount,
            discount_amount: payload.discountAmount,
            enable_tax: payload.enableTax,
            enable_discount: payload.enableDiscount,
            billing_type: payload.billingType || 'quantity',
            terms: payload.terms || '', // Map terms
            notes: payload.notes || ''
          });
          if (invError) throw invError;

          // Insert items
          if (items && items.length > 0) {
            const itemsToInsert = items.map(item => ({
              invoice_id: payload.id,
              description: item.description,
              quantity: item.quantity,
              rate: item.rate
            }));
            await supabase.from('invoice_items').insert(itemsToInsert);
          }
          break;
        }
        case 'UPDATE_INVOICE': {
          // Fully update invoice (map all fields)
          await supabase.from('invoices').update({
            client_id: payload.clientId || null,
            bank_account_id: payload.bankAccountId || null,
            status: payload.status,
            subtotal: payload.subtotal,
            total: payload.total,
            issue_date: payload.issueDate,
            due_date: payload.dueDate,
            paid_date: payload.paidDate,
            invoice_number: payload.invoiceNumber,
            tax_rate: payload.taxRate,
            tax_amount: payload.taxAmount,
            discount_amount: payload.discountAmount,
            enable_tax: payload.enableTax,
            enable_discount: payload.enableDiscount,
            billing_type: payload.billingType || 'quantity',
            terms: payload.terms || '',
            notes: payload.notes || ''
          }).eq('id', payload.id);

          // Update items: Delete all items for this invoice and re-insert
          // This is the safest way to handle adds/removes/edits without complex diffing
          if (items) {
            await supabase.from('invoice_items').delete().eq('invoice_id', payload.id);

            if (items.length > 0) {
              const itemsToInsert = items.map(item => ({
                invoice_id: payload.id,
                description: item.description,
                quantity: item.quantity,
                rate: item.rate
              }));
              await supabase.from('invoice_items').insert(itemsToInsert);
            }
          }
          break;
        }
        case 'DELETE_INVOICE':
          await supabase.from('invoices').delete().eq('id', payload);
          break;

        case 'ADD_QUOTATION': {
          const { items, ...quotationData } = payload;
          const { error: quoError } = await supabase.from('quotations').insert({
            id: payload.id,
            user_id: userId,
            client_id: payload.clientId || null,
            bank_account_id: payload.bankAccountId || null,
            status: payload.status,
            subtotal: payload.subtotal,
            total: payload.total,
            issue_date: payload.issueDate,
            valid_until: payload.validUntil,
            quotation_number: payload.quotationNumber,
            tax_rate: payload.taxRate,
            tax_amount: payload.taxAmount,
            discount_amount: payload.discountAmount,
            enable_tax: payload.enableTax,
            enable_discount: payload.enableDiscount,
            currency: payload.currency,
            notes: payload.notes || '',
            billing_type: payload.billingType || 'quantity', // Added new field
            terms: payload.terms || '' // Added new field
          });
          if (quoError) throw quoError;

          if (items && items.length > 0) {
            const itemsToInsert = items.map(item => ({
              quotation_id: payload.id,
              description: item.description,
              quantity: item.quantity,
              rate: item.rate
            }));
            await supabase.from('quotation_items').insert(itemsToInsert);
          }
          break;
        }

        case 'UPDATE_QUOTATION': {
          const { items, ...quotationData } = payload;

          await supabase.from('quotations').update({
            client_id: payload.clientId || null,
            bank_account_id: payload.bankAccountId || null,
            status: payload.status,
            subtotal: payload.subtotal,
            total: payload.total,
            issue_date: payload.issueDate,
            valid_until: payload.validUntil,
            quotation_number: payload.quotationNumber,
            tax_rate: payload.taxRate,
            tax_amount: payload.taxAmount,
            discount_amount: payload.discountAmount,
            enable_tax: payload.enableTax,
            enable_discount: payload.enableDiscount,
            currency: payload.currency,
            notes: payload.notes || '',
            billing_type: payload.billingType || 'quantity',
            terms: payload.terms || ''
          }).eq('id', payload.id);

          if (items) {
            await supabase.from('quotation_items').delete().eq('quotation_id', payload.id);

            if (items.length > 0) {
              const itemsToInsert = items.map(item => ({
                quotation_id: payload.id,
                description: item.description,
                quantity: item.quantity,
                rate: item.rate
              }));
              await supabase.from('quotation_items').insert(itemsToInsert);
            }
          }
          break;
        }

        case 'DELETE_QUOTATION':
          await supabase.from('quotations').delete().eq('id', payload);
          break;

        // ... Implement other cases similar logic ...
        // BANK ACCOUNTS
        case 'ADD_BANK_ACCOUNT': {
          const { id, bankName, accountName, accountNumber, routingNumber, swiftCode, iban, currency } = payload;
          await supabase.from('bank_accounts').insert({
            id, // Preserve UUID generated by frontend or let DB generate? Frontend generates usually.
            user_id: userId,
            bank_name: bankName,
            account_name: accountName,
            account_number: accountNumber,
            routing_number: routingNumber,
            swift_code: swiftCode,
            iban,
            currency
          });
          break;
        }
        case 'UPDATE_BANK_ACCOUNT': {
          const { id, bankName, accountName, accountNumber, routingNumber, swiftCode, iban, currency } = payload;
          await supabase.from('bank_accounts').update({
            bank_name: bankName,
            account_name: accountName,
            account_number: accountNumber,
            routing_number: routingNumber,
            swift_code: swiftCode,
            iban,
            currency
          }).eq('id', id);
          break;
        }
        case 'DELETE_BANK_ACCOUNT':
          await supabase.from('bank_accounts').delete().eq('id', payload);
          break;

        // SETTINGS
        // We need to split settings into profile columns and settings jsonb
        case 'UPDATE_SETTINGS':
          const updates = { ...payload };
          const profileUpdates = {};

          // Extract top-level profile fields
          if (updates.businessName !== undefined) profileUpdates.business_name = updates.businessName;
          if (updates.businessEmail !== undefined) profileUpdates.business_email = updates.businessEmail;
          if (updates.businessPhone !== undefined) profileUpdates.business_phone = updates.businessPhone;
          if (updates.businessAddress !== undefined) profileUpdates.business_address = updates.businessAddress;
          if (updates.businessLogo !== undefined) profileUpdates.logo_url = updates.businessLogo;

          // Everything else goes into settings jsonb
          // We should probably save the FULL settings object to jsonb too, or just the remainder.
          // For simplicity, let's update specific columns AND update the full settings jsonb
          // The reducer already updated state.settings.
          // BUT we need the NEW state to save to jsonb, or we merge payload here.
          // We don't have access to next state here easily.
          // Let's use the payload merge.
          const newSettings = { ...state.settings, ...payload };

          await supabase.from('profiles').update({
            ...profileUpdates,
            settings: newSettings
          }).eq('id', userId);
          break;
      }
    } catch (error) {
      console.error('Supabase Sync Error:', error);
    }
  };

  // Auth & Data Loading
  useEffect(() => {
    let mounted = true;

    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth check timed out');
        dispatch({ type: 'SET_USER', payload: null });
      }
    }, 5000);

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!mounted) return;

        clearTimeout(timeoutId);
        dispatch({ type: 'SET_USER', payload: session?.user ?? null });

        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          dispatch({ type: 'LOAD_DATA', payload: initialState });
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          clearTimeout(timeoutId);
          dispatch({ type: 'SET_USER', payload: null });
          // Fallback to sample data on error if needed, or just empty state
          dispatch({ type: 'LOAD_DATA', payload: initialState });
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      // Only dispatch if user actually changed to avoid loop
      // But here we can't easily check previous state without ref or dependency.
      // Simply dispatching SET_USER is fine as it updates state.
      // We rely on the fact that if user is same, React/Reducer might re-render but Logic is idempotent.
      // Ideally we check against current state, but state is not in dependnecy.
      // We will just call loadUserData.

      if (currentUser) {
        // We might need to check if we already have this user's data to avoid reloading?
        // For now, let's just reload to be safe on auth change.
        loadUserData(currentUser.id);
      }

      // We need to update user state if it changed from what we initialized
      dispatch({ type: 'SET_USER', payload: currentUser });
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (userId) => {
    try {
      const [
        { data: profile },
        { data: clients },
        { data: invoices },
        { data: quotations },
        { data: expenses },
        { data: bankAccounts },
        // Add time entries, recurring...
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('clients').select('*'),
        supabase.from('invoices').select('*, items:invoice_items(*)').order('created_at', { ascending: false }),
        supabase.from('quotations').select('*, items:quotation_items(*)').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
        supabase.from('bank_accounts').select('*'),
      ]);

      // Transform data back to app shape (camelCase)
      // INVOICES
      const formattedInvoices = (invoices || []).map(inv => ({
        ...inv,
        clientId: inv.client_id,
        bankAccountId: inv.bank_account_id,
        invoiceNumber: inv.invoice_number,
        issueDate: inv.issue_date,
        dueDate: inv.due_date,
        paidDate: inv.paid_date,
        taxRate: inv.tax_rate,
        taxAmount: inv.tax_amount,
        discountAmount: inv.discount_amount,
        enableTax: inv.enable_tax,
        discountAmount: inv.discount_amount,
        enableTax: inv.enable_tax,
        enableDiscount: inv.enable_discount,
        enableTax: inv.enable_tax,
        enableDiscount: inv.enable_discount,
        billingType: inv.billing_type, // Map snake_case to camelCase
        terms: inv.terms,
        notes: inv.notes,
        // Items are already nested but might need camelCasing inside if component uses it
        items: inv.items || []
      }));

      const formattedQuotations = (quotations || []).map(q => ({
        ...q,
        clientId: q.client_id,
        bankAccountId: q.bank_account_id,
        quotationNumber: q.quotation_number,
        issueDate: q.issue_date,
        validUntil: q.valid_until,
        taxRate: q.tax_rate,
        taxAmount: q.tax_amount,
        discountAmount: q.discount_amount,
        enableTax: q.enable_tax,
        enableDiscount: q.enable_discount,
        items: q.items || []
      }));

      const formattedBankAccounts = (bankAccounts || []).map(b => ({
        ...b,
        bankName: b.bank_name,
        accountName: b.account_name,
        accountNumber: b.account_number,
        routingNumber: b.routing_number,
        swiftCode: b.swift_code,
      }));

      // Merge Settings
      const loadedSettings = { ...initialState.settings, ...(profile?.settings || {}) };
      if (profile) {
        loadedSettings.businessName = profile.business_name || loadedSettings.businessName;
        loadedSettings.businessEmail = profile.business_email || loadedSettings.businessEmail;
        loadedSettings.businessPhone = profile.business_phone || loadedSettings.businessPhone;
        loadedSettings.businessAddress = profile.business_address || loadedSettings.businessAddress;
        loadedSettings.businessLogo = profile.logo_url || loadedSettings.businessLogo;
      }

      dispatch({
        type: 'LOAD_DATA',
        payload: {
          clients: clients || [],
          invoices: formattedInvoices,
          quotations: formattedQuotations,
          expenses: expenses || [],
          bankAccounts: formattedBankAccounts,
          settings: loadedSettings,
          // ... others
        }
      });

    } catch (e) {
      console.error("Error loading data", e);
    }
  };

  // Theme Sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  // Use enhancedDispatch instead of plain dispatch
  return (
    <AppContext.Provider value={{ state, dispatch: enhancedDispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export default AppContext;
