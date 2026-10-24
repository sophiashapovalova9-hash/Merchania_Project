import { useEffect, useState } from 'react';
import { Mail, MessageCircle, FileText, ChevronRight } from 'lucide-react';
import { api, when } from '../api';

const Support = () => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);

  const load = () => api.myTickets().then(setTickets).catch(() => {});
  useEffect(() => { load(); }, []);

  const send = async (event) => {
    event.preventDefault();
    try {
      await api.createTicket(name || 'Вопрос с сайта', message);
      setMessage('');
      setNote('Заявка сохранена в таблице SupportTicket.');
      setError('');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const faq = [
    { q: 'Как осуществляется доставка?', a: 'Мы сотрудничаем с Boxberry и Почтой России. Адрес ты пишешь при оформлении заказа, он сохраняется в Orders.ShippingAddress.' },
    { q: 'Как стать автором?', a: 'Войди как studio.pan@example.com / demo и открой панель художника.' },
    { q: 'Безопасна ли оплата?', a: 'В учебной версии оплата не списывает деньги. Кнопка «Оплатить» создаёт заказ в базе.' },
  ];

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="text-center mb-24">
        <h1 className="text-5xl font-black mb-4 tracking-tighter uppercase text-slate-900 leading-none">Центр поддержки</h1>
        <p className="text-slate-400 font-medium uppercase tracking-widest text-sm">Вопрос сохранится в базе</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 text-slate-900 font-bold">
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm text-center">
          <Mail className="w-10 h-10 text-[#49b6ff] mx-auto mb-4" />
          <h4 className="uppercase text-xs tracking-widest mb-2">Написать</h4>
          <span className="text-slate-300 text-[10px]">форма ниже</span>
        </div>
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm text-center">
          <MessageCircle className="w-10 h-10 text-[#ff499e] mx-auto mb-4" />
          <h4 className="uppercase text-xs tracking-widest mb-2">Мои заявки</h4>
          <span className="text-slate-300 text-[10px]">{tickets.length} в базе</span>
        </div>
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm text-center">
          <FileText className="w-10 h-10 text-slate-900 mx-auto mb-4" />
          <h4 className="uppercase text-xs tracking-widest mb-2">FAQ</h4>
          <span className="text-slate-300 text-[10px]">База знаний</span>
        </div>
      </div>

      <section className="mb-24 space-y-4">
        <h2 className="text-2xl font-bold mb-10 uppercase text-slate-900">Частые вопросы</h2>
        {faq.map((item, i) => (
          <button key={item.q} onClick={() => setOpen(open === i ? null : i)} className="w-full bg-white p-8 rounded-3xl border border-slate-50 text-left cursor-pointer">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800">{item.q}</span>
              <ChevronRight className="w-5 h-5 text-slate-200" />
            </div>
            {open === i && <p className="text-slate-500 mt-4 font-medium">{item.a}</p>}
          </button>
        ))}
      </section>

      <section className="bg-slate-900 rounded-[64px] p-12 md:p-20 text-white">
        <h2 className="text-4xl font-bold mb-10">Не нашли ответ?</h2>
        <form onSubmit={send} className="space-y-4 max-w-md">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Тема" className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-4 outline-none text-white font-bold" />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ваш вопрос..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-4 h-32 outline-none text-white font-bold" />
          {error && <p className="text-sm font-bold text-red-300">{error}</p>}
          {note && <p className="text-sm font-bold text-emerald-300">{note}</p>}
          <button className="btn-blue w-full py-4 text-sm font-black uppercase tracking-widest">Отправить заявку</button>
        </form>
        <div className="mt-10 space-y-3">
          {tickets.map((ticket) => (
            <div key={ticket.ticket_id} className="text-sm text-slate-300">
              <span className="font-bold text-white">{ticket.subject}</span> — {ticket.is_resolved ? 'решено' : 'открыто'} · {when(ticket.created_at)}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Support;
