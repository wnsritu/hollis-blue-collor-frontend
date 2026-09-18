import { Navigate } from "react-router-dom";

/**
 * @deprecated AdminTransactions has been merged into AdminPayouts ("Payouts & Transactions Ledger").
 * This component redirects to /admin/payouts.
 */
export function AdminTransactions() {
  return <Navigate to="/admin/payouts" replace />;
}

export default AdminTransactions;
