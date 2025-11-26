import { useState, useEffect } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './App.css';

function App() {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  // Inicializa com a data de hoje
  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0]; // YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(formattedToday);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Carrega e-mails da data atual ao montar
    fetchEmails(formattedToday);
  }, []); // Dependência vazia para rodar apenas na montagem

  // Busca quando a data muda no input (e não é a montagem inicial)
  useEffect(() => {
    if (selectedDate) {
      fetchEmails(selectedDate);
    }
  }, [selectedDate]);

  const fetchEmails = async (date = null) => {
    try {
      setLoading(true);
      let url = 'http://localhost:3001/api/emails';
      if (date) {
        url += `?date=${date}`;
      }
      const response = await axios.get(url);
      setEmails(response.data);
      setError(null);
      // Limpa seleção ao mudar lista
      setSelectedEmail(null);
    } catch (err) {
      console.error(err);
      setError('Falha ao carregar e-mails.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearDate = () => {
    setSelectedDate('');
    fetchEmails(); // Recarrega os últimos 20
  };

  const handleDownload = (uid, filename) => {
    window.open(`http://localhost:3001/api/emails/${uid}/attachments/${filename}`, '_blank');
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="header">
          <div className="header-top">
            <h2>Caixa de Entrada</h2>
            <button onClick={() => fetchEmails(selectedDate)} disabled={loading} title="Atualizar">
              ↻
            </button>
          </div>
          <div className="date-filter">
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            {selectedDate && (
              <button className="clear-date" onClick={handleClearDate} title="Limpar filtro">
                x
              </button>
            )}
          </div>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <div className="email-list">
          {emails.map(email => (
            <div 
              key={email.id} 
              className={`email-item ${selectedEmail?.id === email.id ? 'active' : ''}`}
              onClick={() => setSelectedEmail(email)}
            >
              <div className="email-row-top">
                <span className="email-from">{email.from}</span>
                <span className="email-date">
                   {format(new Date(email.date), "dd/MM HH:mm", { locale: ptBR })}
                </span>
              </div>
              <div className="email-subject">{email.subject}</div>
            </div>
          ))}
          {!loading && emails.length === 0 && <p className="empty-msg">Nenhum e-mail encontrado.</p>}
          {loading && emails.length === 0 && <p className="loading-msg">Carregando e-mails...</p>}
        </div>
      </div>
      
      <div className="main-content">
        {selectedEmail ? (
          <div className="email-detail">
            <div className="email-meta">
              <h1>{selectedEmail.subject}</h1>
              <p><strong>De:</strong> {selectedEmail.from}</p>
              <p><strong>Data:</strong> {format(new Date(selectedEmail.date), "PPPP 'às' p", { locale: ptBR })}</p>
              
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="attachments">
                  <strong>Anexos:</strong>
                  <ul>
                    {selectedEmail.attachments.map((att, idx) => (
                      <li key={idx}>
                        <button 
                          className="attachment-btn"
                          onClick={() => handleDownload(selectedEmail.id, att.filename)}
                        >
                          📎 {att.filename} ({(att.size / 1024).toFixed(1)} KB)
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <hr />
            
            <div 
              className="email-body"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(selectedEmail.html) 
              }} 
            />
          </div>
        ) : (
          <div className="no-selection">
            <p>Selecione um e-mail para visualizar</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;