import React, { useEffect, useState } from 'react';

const SingleExperiencePage = ({ experienceId }) => {
  const [experience, setExperience] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExperience = async () => {
      try {
        const response = await fetch(`/api/experiences?experienceId=${experienceId}`);
        const data = await response.json();
        
        if (response.ok) {
          setExperience(data.experiences[0]);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError(err.message);
      }
    };

    if (experienceId) {
      fetchExperience();
    }
  }, [experienceId]);

  if (error) return <div>Error: {error}</div>;
  if (!experience) return <div>Loading...</div>;

  return (
    <div>
      <h1>{experience.company_name} - {experience.level}</h1>
      <p>{experience.username}</p>
      <ul>
        {experience.rounds.map(round => (
          <li key={round.id}>
            {round.round_type}: {round.details}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SingleExperiencePage;
