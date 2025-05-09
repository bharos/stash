'use client';
import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useDarkMode } from '../context/DarkModeContext';
import supabase from '../utils/supabaseClient';

const TokenHistory = () => {
  const { user } = useUser();
  const { darkMode } = useDarkMode();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10; // Number of transactions per page
  
  const fetchTransactions = async (pageNumber = 1) => {
    if (!user?.user_id) return;
    
    try {
      setLoading(true);
      const offset = (pageNumber - 1) * limit;
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        return;
      }
      
      const token = sessionData.session.access_token;
      const response = await fetch(`/api/tokenTransactions?limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch transaction history');
      }
      
      const data = await response.json();
      setTransactions(data.transactions);
      setTotalCount(data.total);
      setPage(pageNumber);
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user?.user_id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const formatAmount = (amount, type) => {
    if (type === 'earn') {
      return `+${amount}`;
    } else {
      return `-${Math.abs(amount)}`;
    }
  };
  
  const totalPages = Math.ceil(totalCount / limit);
  
  const handlePrevPage = () => {
    if (page > 1) {
      fetchTransactions(page - 1);
    }
  };
  
  const handleNextPage = () => {
    if (page < totalPages) {
      fetchTransactions(page + 1);
    }
  };

  return (
    <div className={`w-full max-w-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-6 rounded-lg shadow-lg border`}>
      <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Coin Transaction History
      </h2>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      
      {loading ? (
        <p className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading transaction history...</p>
      ) : transactions.length === 0 ? (
        <p className={`text-center py-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          No transactions found.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className={`py-2 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Date</th>
                  <th className={`py-2 text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Description</th>
                  <th className={`py-2 text-right ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className={`py-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
                      {formatDate(tx.created_at)}
                    </td>
                    <td className={`py-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {tx.description}
                    </td>
                    <td className={`py-3 text-right font-medium ${
                      tx.transaction_type === 'earn' 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`}>
                      {formatAmount(tx.amount, tx.transaction_type)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <button 
                onClick={handlePrevPage}
                disabled={page === 1}
                className={`px-3 py-1 rounded text-sm ${
                  page === 1 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : darkMode 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>
              
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Page {page} of {totalPages}
              </span>
              
              <button 
                onClick={handleNextPage}
                disabled={page === totalPages}
                className={`px-3 py-1 rounded text-sm ${
                  page === totalPages 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : darkMode 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TokenHistory;
