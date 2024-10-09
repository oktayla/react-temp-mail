import { useState, useEffect } from 'react';
import { Copy, Inbox, RefreshCw, Trash, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const API_URL = 'https://api.mail.tm';

const TempMailService = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [accountId, setAccountId] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);

  useEffect(() => {
    if (token) {
      fetchMessages();
    } else {
      createAccount();
    }
  }, [token]);

  const generateCredentials = (domain) => {
    const randomString = Math.random().toString(36).substring(2, 10);
    const password = Math.random().toString(36).substring(2, 10);
    const email = `${randomString}@${domain}`;

    return { address: email, password };
  }

  const getDomain = async () => {
    try {
      const response = await fetch(`${API_URL}/domains`);
      const data = await response.json();
      const availableDomains = data['hydra:member'].map(domain => domain.domain);
      if (availableDomains.length > 0) {
        return availableDomains[0];
      }

      return null;
    } catch (err) {
      return null;
    }
  }

  const createAccount = async () => {
    if (token) return;
    setLoading(true);
    setError('');
    try {
      const domain = await getDomain();
      const credentials = generateCredentials(domain);

      const response = await fetch(`${API_URL}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) throw new Error('Failed to create account');
      const data = await response.json();
      setEmail(data.address);
      setAccountId(data.id);
      await getToken(credentials);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getToken = async (credentials) => {
    try {
      const response = await fetch(`${API_URL}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) throw new Error('Failed to get token');
      const data = await response.json();
      setToken(data.token);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data['hydra:member']);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const deleteAccount = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/accounts/${accountId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete account');
      setEmail('');
      setPassword('');
      setToken('');
      setAccountId('');
      setMessages([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const viewEmail = async (id) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/messages/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch email');
      const data = await response.json();
      setSelectedEmail(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-center">Temporary Email Service</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Email Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              <input
                type="text"
                value={email}
                readOnly
                disabled
                className="border p-2 rounded flex-grow"
              />
              <Button
                onClick={() => copyToClipboard(email)}
                variant="outline"
                size="icon"
                className="ml-2"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={createAccount} disabled={loading || token} className="flex-grow">
                <Inbox className="mr-2 h-4 w-4" />
                Create
              </Button>
              {token && (
                <Button onClick={deleteAccount} variant="destructive" disabled={loading}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {token && (
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Inbox</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchMessages} disabled={loading} className="w-full mb-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              {messages.length === 0 ? (
                <p className="text-center text-gray-500">
                  Your inbox is empty.<br/>Waiting for incoming emails.
                </p>
              ) : (
                <ul className="space-y-2">
                  {messages.map((message) => (
                    <li key={message.id} className="flex items-center justify-between border p-2 rounded">
                      <div className="flex-grow">
                        <strong className="block">{message.from.address}</strong>
                        <span className="text-sm text-gray-600">{message.subject}</span>
                      </div>
                      <Button onClick={() => viewEmail(message.id)} variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="my-6">
        <CardContent className="p-4">
          <p className="text-sm text-gray-700">Forget about spam, advertising emails, hacking, and bot attacks! 🛡️ Keep your real inbox clean and secure. ✅ Temp Mail provides a temporary, secure, anonymous, and free disposable email address. ✉️💻</p>
        </CardContent>
      </Card>

      {selectedEmail && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Email Content
              <Button onClick={() => setSelectedEmail(null)} variant="outline" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>From:</strong> {selectedEmail.from.address}</p>
            <p><strong>Subject:</strong> {selectedEmail.subject}</p>
            <div className="mt-4 border-t pt-4">
              <div dangerouslySetInnerHTML={{ __html: selectedEmail.html || selectedEmail.text }} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TempMailService;
