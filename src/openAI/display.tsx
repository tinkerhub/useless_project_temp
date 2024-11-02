import { useEffect, useState } from 'react';

interface Entry {
  id: number;
  response: string;
}

interface Data {
  future: Entry[];
  past: Entry[];
}

interface DisplayProps {
  id: number;
  type: 'future' | 'past'; 
}

const Display = ({ id, type }: DisplayProps) => {
  const [story, setStory] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/Response.json');
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        const data: Data = await res.json();

        const entry = data[type].find(entry => entry.id === id);
        if (entry) {
          setStory(entry.response);
        } else {
          setStory(''); // Handle case where entry is not found
        }
      } catch (error) {
        console.error(error); // Log the error
        setStory('Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, type]); 

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <p>{story}</p>
    </div>
  );
};

export default Display;
