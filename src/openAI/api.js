import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { message } = req.body;

    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo', // or 'gpt-4'
        messages: [{ role: 'user', content: message }],
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, // Use environment variable for API key
          'Content-Type': 'application/json',
        },
      });

      const botMessage = response.data.choices[0].message.content;
      res.status(200).json({ message: botMessage });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch response from ChatGPT' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
