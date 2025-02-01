'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
// import './experience-form.css';
import 'react-quill-new/dist/quill.snow.css';
import dynamic from 'next/dynamic';


// Dynamically import ReactQuill without SSR
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const ExperienceForm = () => {
  const [company_name, setCompanyName] = useState('');
  const [level, setLevel] = useState('');
  const [rounds, setRounds] = useState([{ round_type: '', details: '' }]);
  const [roundTypes, setRoundTypes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmIndex, setConfirmIndex] = useState(null);
  const [companyNames, setCompanyNames] = useState([]);
  const [isClient, setIsClient] = useState(false); // Flag to check if we are on the client side

  // Ref to store ReactQuill instance
  const quillRefs = useRef([]);

  const handleRoundChange = useCallback((index, value, field) => {
    setRounds((prevRounds) => {
      const updatedRounds = [...prevRounds]; // Create a shallow copy of the previous rounds
      updatedRounds[index][field] = value;  // Update the specific round with the new value
      return updatedRounds;  // Return the updated rounds array
    });
  }, []);

  const addRound = () => {
    setRounds([...rounds, { round_type: '', details: '' }]);
  };

  const handleRemoveRound = (index) => {
    if (rounds[index].details.trim() === '') {
      removeRound(index);
    } else {
      setConfirmIndex(index); // Open modal to confirm removal
    }
  };

  const removeRound = (index) => {
    setRounds((prevRounds) => prevRounds.filter((_, i) => i !== index));
    setConfirmIndex(null); // Close modal
  };

  useEffect(() => {
    const fetchRoundTypes = async () => {
      try {
        const response = await fetch('/api/roundTypes');
        const data = await response.json();
        setRoundTypes(data);  // Store the fetched round types in the state
      } catch (err) {
        console.error('Failed to fetch round types:', err);
        setError('Failed to load round types');
      }
    };
    const fetchCompanyNames = async () => { 
      try {
        const response = await fetch('/api/companyNames'); 
        const data = await response.json();
        setCompanyNames(data); 
      } catch (err) {
        console.error('Failed to fetch company names:', err);
        setError('Failed to load company names');
      }
    };
    fetchRoundTypes();
    fetchCompanyNames();

    if (typeof window !== 'undefined') {
      setIsClient(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name,
          level,
          rounds,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        console.log('Interview Experience added:', result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to submit experience');
    } finally {
      setLoading(false);
    }
  };

  // Toolbar options for font and color, including custom sizes
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
    <div className="app-container">
      <form onSubmit={handleSubmit} className=" bg-dark-100 p-6 rounded-md shadow-lg">
        <div className="form-group flex gap-6">
          <div className="flex-1">
            <label htmlFor="company_name" className="form-label">Company Name</label>
            <input
              list='company_names'
              id="company_name"
              type="text"
              value={company_name}
              onChange={(e) => setCompanyName(e.target.value)}
              className="input-field"
              required
              autoComplete="off"
            />
            <datalist id='company_names'>
              {companyNames.map((company, idx) => (
                <option key={idx} value={company.name} />
              ))}
            </datalist>
          </div>
          <div className="flex-1">
            <label htmlFor="level" className="form-label">Level</label>
            <input
              id="level"
              type="text"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="input-field"
              required
              autoComplete="off"
            />
          </div>
        </div>

        <div className="form-group">
          {rounds.map((round, index) => (
            <div key={index} className="relative round-container flex flex-col gap-2 mb-4 border border-gray-300 rounded-lg p-4 shadow-sm">
              <button 
                onClick={() => handleRemoveRound(index)} 
                title="Remove Round"
                className="absolute top-2 right-2 flex items-center justify-center rounded-full w-10 h-10 bg-red-500 text-white hover:bg-red-600 transition text-lg font-bold"
              >
                ✖
              </button>
              <div className="form-group flex gap-1 items-center">
                <label htmlFor={`round_type_${index}`} className="round-label w-1/6 ml-2">Round {index + 1}</label>
                <input
                  list={`round_types_list_${index}`}
                  name="round_type"
                  value={round.round_type}
                  onChange={(e) => handleRoundChange(index, e.target.value, "round_type")}
                  className="input-field w-1/3 p-2 border border-gray-300 rounded-md"
                  required
                  autoComplete="off"
                />
                <datalist id={`round_types_list_${index}`}>
                  {roundTypes.map((roundType, idx) => (
                    <option key={idx} value={roundType.name} />
                  ))}
                </datalist>

                {confirmIndex !== null && (
                  <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                    <div className="bg-gray-600 p-6 rounded-md shadow-lg">
                      <p>Are you sure you want to remove this round?</p>
                      <div className="mt-4 flex justify-end">
                        <button onClick={() => setConfirmIndex(null)} className="mr-2 px-4 py-2 bg-gray-400 rounded">Cancel</button>
                        <button onClick={() => removeRound(confirmIndex)} className="px-4 py-2 bg-red-500 text-white rounded">Remove</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor={`details_${index}`} className="round-label">Details</label>
                <div className="w-full p-4 border border-gray-300 rounded-md">
                  {isClient && (
                    <ReactQuill
                      ref={(el) => quillRefs.current[index] = el}
                      value={round.details}
                      theme='snow'
                      style={{ color: 'black', backgroundColor: 'white' }}
                      onChange={(value) => handleRoundChange(index, value, "details")}
                      className="w-full bg-white border border-gray-300 p-3 rounded-md shadow-md min-h-[200px]"
                      modules={{
                        toolbar: {
                          container: toolbarOptions,
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addRound} className="add-round-button w-1/3 ml-6">
            Add Round
          </button>
        </div>

        <div className="form-group">
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
};

export default ExperienceForm;
