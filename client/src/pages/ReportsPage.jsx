import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function ReportsPage() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      setError('Selecione as datas de início e fim');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('A data inicial deve ser menor ou igual à data final');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/emails?startDate=${startDate}&endDate=${endDate}`);
      setEmails(response.data);
    } catch (err) {
      console.error(err);
      setError('Falha ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (email) => {
    const emailDate = new Date(email.date).toISOString().split('T')[0];
    navigate(`/?emailId=${email.id}&date=${emailDate}`);
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>Relatório de E-mails</h1>
        <nav className="reports-nav">
          <button onClick={() => navigate('/')}>Voltar para Caixa de Entrada</button>
        </nav>
      </div>

      <div className="reports-filters">
        <div className="date-range-picker">
          <label>
            Data Inicial:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label>
            Data Final:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
          <button onClick={fetchReport} disabled={loading}>
            {loading ? 'Carregando...' : 'Gerar Relatório'}
          </button>
        </div>
      </div>

      {error && <div className="error-msg reports-error">{error}</div>}

      <div className="reports-table-container">
        <table className="reports-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Remetente</th>
              <th>Assunto</th>
              <th>Anexos</th>
              <th>Preview</th>
            </tr>
          </thead>
          <tbody>
            {emails.map(email => (
              <tr key={email.id} onClick={() => handleRowClick(email)} className="clickable-row">
                <td>{format(new Date(email.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</td>
                <td>{truncateText(email.from, 30)}</td>
                <td>{truncateText(email.subject, 40)}</td>
                <td className="attachments-count">{email.attachments?.length || 0}</td>
                <td className="preview-cell">{truncateText(stripHtml(email.html), 50)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && emails.length === 0 && (
          <p className="empty-msg">
            {startDate && endDate
              ? 'Nenhum e-mail encontrado no período selecionado.'
              : 'Selecione um período e clique em "Gerar Relatório".'
            }
          </p>
        )}
        {loading && <p className="loading-msg">Carregando e-mails...</p>}
      </div>

      {emails.length > 0 && (
        <div className="reports-summary">
          <p>Total de e-mails encontrados: <strong>{emails.length}</strong></p>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
