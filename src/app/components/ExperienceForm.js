'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import 'react-quill-new/dist/quill.snow.css';
import './experience-form.css';
import dynamic from 'next/dynamic';
import supabase from '../utils/supabaseClient';
import Select from 'react-select';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const ExperienceForm = () => {
  const [companyName, setCompanyName] = useState('');
  const [level, setLevel] = useState('');
  const [rounds, setRounds] = useState([{ round_type: '', details: '' }]);
  const [roundTypes, setRoundTypes] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null); // New state for success message
  const [confirmIndex, setConfirmIndex] = useState(null);
  const [isClient, setIsClient] = useState(false);

  const quillRefs = useRef([]);

  useEffect(() => {
    const fetchRoundTypes = async () => {
      try {
        const response = await fetch('/api/roundTypes');
        const data = await response.json();
        setRoundTypes(data);
      } catch (err) {
        setError('Failed to load round types');
      }
    };
    const fetchCompanyNames = async () => {
      if (companyOptions.length > 0) return; // Only fetch if companyOptions is empty
      try {
        const companyResponse = await fetch('/api/companyNames');
        const companyData = await companyResponse.json();
        if (companyResponse.ok) {
          setCompanyOptions(
            companyData.map((item) => ({
              label: item.name.trim(),
              value: item.name.trim(),
            }))
          );
        } else {
          console.error('Failed to fetch company names:', companyData.error);
        }
      } catch (err) {
        setError('Failed to load company names');
      }
    };
    fetchRoundTypes();
    fetchCompanyNames();
    if (typeof window !== 'undefined') setIsClient(true);
  }, []);

  const handleRoundChange = useCallback((index, value, field) => {
    setRounds((prevRounds) => {
      const updatedRounds = [...prevRounds];
      updatedRounds[index][field] = value;
      return updatedRounds;
    });
  }, []);

  const addRound = () => setRounds([...rounds, { round_type: '', details: '' }]);

  const removeRound = (index) => {
    setRounds((prevRounds) => prevRounds.filter((_, i) => i !== index));
    setConfirmIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null); // Reset success message before submitting

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session || !data.session.access_token) {
        throw new Error('User is not authenticated or token is missing');
      }
      const token = data.session.access_token; // Access token from the session object
  
      const response = await fetch('/api/experiences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Attach token in the Authorization header
        },
        body: JSON.stringify({ company_name: companyName, level, rounds }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Submission failed');
      }
      
      // If submission is successful, set the success message
      setSuccessMessage('Experience submitted successfully! 🎉 🎊');
    } catch (error) {
      setError(error.message || 'Failed to submit experience');
    } finally {
      setLoading(false);
    }
  };

  const toolbarOptions = [
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['bold', 'italic', 'underline'],
    ['link', 'image'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['blockquote'],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    ['code-block']
    ];

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> 
          <div>
          <label className="block text-gray-700">Company Name</label>
          <Select
            value={companyName ? { label: companyName, value: companyName } : null}
            onChange={(selectedOption) => setCompanyName(selectedOption?.value || '')}
            options={companyOptions}
            placeholder="Company Name"
            className="w-full mb-3 sm:mb-0"
            isClearable
            isSearchable
          />
          </div>

          <div>
            <label className="block text-gray-700">Level</label>
            <input
              type="text"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full p-3 border rounded-md"
              required
            />
          </div>
        </div>
        {rounds.map((round, index) => (
          <div key={index} className="p-4 border rounded-md relative details-textarea">
            <button
              type="button"
              className="absolute top-2 right-2 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full"
              onClick={() => removeRound(index)}
            >
              ✖
            </button>
            <label className="block text-gray-700">Round {index + 1}</label>
            <Select
            value={round.round_type ? { label: round.round_type, value: round.round_type } : null}
            onChange={(selectedOption) => handleRoundChange(index, selectedOption?.value || '', 'round_type')}
            options={roundTypes.map((roundType) => ({
              label: roundType.name,  // Use roundType.name as the label
              value: roundType.name,  // Use roundType.name as the value
            }))}
            placeholder="Select Round Type"
            className="w-full sm:w-1/2 mb-3 sm:mb-0"
            isClearable
            isSearchable
          />
            <div>
    </div>
            
            <label className="block text-gray-700 mt-2">Details</label>
            {isClient && (
              <ReactQuill
                ref={(el) => quillRefs.current[index] = el}
                value={round.details}
                onChange={(value) => handleRoundChange(index, value, 'details')}
                className="bg-white border rounded-md"
                modules={{
                  toolbar: {
                  container: toolbarOptions,
                  }
                }}
              />
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addRound}
          className="w-full p-3 bg-blue-500 text-white rounded-md"
        >
          Add Round
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 bg-green-500 text-white rounded-md"
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
        {error && <p className="text-red-500 text-center">{error}</p>}
        {successMessage && <p className="text-green-500 text-center">{successMessage}</p>} {/* Display success message */}
      </form>
    </div>
  );
};

export default ExperienceForm;
