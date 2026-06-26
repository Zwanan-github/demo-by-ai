import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { pageLabels, pageRoutes } from '../constants';
import type { AppPage, CustomerForm } from '../types';
import { CustomerCreate } from '../pages/CustomerCreate';
import { CustomerList } from '../pages/CustomerList';
import { Reports } from '../pages/Reports';

export function AppRoutes(props: {
  currentPage: AppPage;
  form: CustomerForm;
  savedResult: string;
  setForm: (form: CustomerForm) => void;
  onReset: () => void;
  onSave: () => void;
}) {
  const { currentPage, form, savedResult, setForm, onReset, onSave } = props;
  return (
    <>
      <nav className="tabs" aria-label="主导航">
        {(Object.keys(pageLabels) as AppPage[]).map((page) => (
          <Link key={page} className={currentPage === page ? 'active' : ''} to={pageRoutes[page]}>{pageLabels[page]}</Link>
        ))}
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to="/customers" replace />} />
        <Route path="/customers" element={<CustomerList />} />
        <Route path="/customers/new" element={<CustomerCreate form={form} savedResult={savedResult} setForm={setForm} onReset={onReset} onSave={onSave} />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </>
  );
}
