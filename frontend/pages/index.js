import { useState } from 'react';
import {
  GeistProvider,
  CssBaseline,
  Input,
  Button,
  Text,
  Link,
} from '@geist-ui/react';

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
    <GeistProvider>
      <CssBaseline />
      <main style={{ padding: '2rem' }}>
        <Text h1>URL Shortener</Text>
        <form onSubmit={submit}>
          <Input
            width="300px"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
          />
          <Button type="success" htmlType="submit" style={{ marginTop: '1rem' }}>
            Shorten
          </Button>
        </form>
        {result && (
          <Text>
            Short link: <Link href={result}>{result}</Link>
          </Text>
        )}
        {error && <Text type="error">{error}</Text>}
      </main>
    </GeistProvider>
  );
}
