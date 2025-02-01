'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import 'react-quill-new/dist/quill.snow.css';
import './experience-form.css';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const ExperienceForm = () => {
  const [company_name, setCompanyName] = useState('');
  const [level, setLevel] = useState('');
  const [rounds, setRounds] = useState([{ round_type: '', details: '' }]);
  const [roundTypes, setRoundTypes] = useState([]);
  const [companyNames, setCompanyNames] = useState([]);
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
      try {
        const response = await fetch('/api/companyNames');
        const data = await response.json();
        setCompanyNames(data);
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
      const response = await fetch('/api/experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name, level, rounds }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Submission failed');
      }
      
      // If submission is successful, set the success message
      setSuccessMessage('Experience submitted successfully!');
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
            <input
              list='company_names'
              type="text"
              value={company_name}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full p-3 border rounded-md"
              required
            />
            <datalist id='company_names'>
              {companyNames.map((company, idx) => (
                <option key={idx} value={company.name} />
              ))}
            </datalist>
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
            <input
              list={`round_types_list_${index}`}
              value={round.round_type}
              onChange={(e) => handleRoundChange(index, e.target.value, 'round_type')}
              className="w-full p-3 border rounded-md"
              required
            />
            <datalist id={`round_types_list_${index}`}>
              {roundTypes.map((roundType, idx) => (
                <option key={idx} value={roundType.name} />
              ))}
            </datalist>
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
