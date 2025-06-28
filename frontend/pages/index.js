import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setResult(null);
    setError(null);

    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;
    if (!workerUrl) {
      setError('NEXT_PUBLIC_WORKER_URL not set');
      return;
    }

    try {
      const res = await fetch(workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`${workerUrl.replace(/\/$/, '')}${data.key}`);
      } else {
        setError(data.error || 'Request failed');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>URL Shortener</h1>
      <form onSubmit={submit}>
        <input
          style={{ width: '300px' }}
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          required
        />
        <button type="submit">Shorten</button>
      </form>
      {result && (
        <p>
          Short link: <a href={result}>{result}</a>
        </p>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </main>
  );
}
