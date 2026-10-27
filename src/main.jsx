import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Search, ScanBarcode, UserRoundPlus, Plus, Minus, Trash2, CreditCard, CalendarClock, Receipt, History, Wallet, X, Camera, Printer, CheckCircle2, CircleDollarSign, ShieldCheck, ChevronLeft } from 'lucide-react';
import './style.css';

const seedProducts = [
  { id: '10001', barcode: '7891000100011', name: 'Produto demonstrativo A', price: 50 },
  { id: '10002', barcode: '7891000100028', name: 'Produto demonstrativo B', price: 24.9 },
  { id: '10003', barcode: '7891000100035', name: 'Produto demonstrativo C', price: 12 },
  { id: 'REF-001', barcode: 'REF-001', name: 'Referência manual 001', price: 35 }
];
const money = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
function App() {
  const [products] = useState(seedProducts);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState('');
  const [customerOpen, setCustomerOpen] = useState(false);
  const [payment, setPayment] = useState('Pix');
  const [saleType, setSaleType] = useState('À vista');
  const [paid, setPaid] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState('Aponte a câmera para o código de barras.');
  const [recent, setRecent] = useState(() => { try { return JSON.parse(localStorage.getItem('nexus-recent-sales') || '[]'); } catch { return []; } });
  const [view, setView] = useState('sale');
  const [toast, setToast] = useState('');
  const [installmentCount, setInstallmentCount] = useState('3');
  const videoRef = useRef(null); const controlsRef = useRef(null); const readerRef = useRef(null);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const filtered = products.filter(p => `${p.name} ${p.id} ${p.barcode}`.toLowerCase().includes(search.toLowerCase()));
  const notify = msg => { setToast(msg); window.setTimeout(() => setToast(''), 2600); };
  function addProduct(p) { setCart(old => { const found = old.find(x => x.id === p.id); return found ? old.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x) : [...old, { ...p, qty: 1 }]; }); setSearch(''); }
  function changeQty(id, delta) { setCart(old => old.map(x => x.id === id ? { ...x, qty: Math.max(1, x.qty + delta) } : x)); }
  function removeItem(id) { if (window.confirm('Remover este item da venda?')) setCart(old => old.filter(x => x.id !== id)); }
  function findBarcode(code) { const value = String(code || '').trim(); if (!value) return; const found = products.find(p => p.barcode.toLowerCase() === value.toLowerCase() || p.id.toLowerCase() === value.toLowerCase()); if (found) { addProduct(found); setScanMessage(`Encontrado: ${found.name}`); notify(`Produto adicionado: ${found.name}`); } else { setSearch(value); setScanMessage(`Código ${value} não está no catálogo demonstrativo. Você pode buscar/adicionar uma referência cadastrada.`); notify('Código lido, mas não existe no catálogo de exemplo.'); } }
  async function startScanner() { setScannerOpen(true); setScanMessage('Solicitando acesso à câmera...'); }
  useEffect(() => {
    if (!scannerOpen || !videoRef.current) return;
    let cancelled = false;
    const reader = new BrowserMultiFormatReader(); readerRef.current = reader;
    reader.decodeFromVideoDevice(undefined, videoRef.current, (result, error, controls) => {
      controlsRef.current = controls;
      if (cancelled || !result) return;
      const text = result.getText(); setScanMessage(`Código lido: ${text}`); controls.stop(); controlsRef.current = null; setScannerOpen(false); findBarcode(text);
    }).catch(err => { setScanMessage('Não foi possível abrir a câmera. Verifique a permissão e use localhost ou HTTPS.'); console.error(err); });
    return () => { cancelled = true; controlsRef.current?.stop(); controlsRef.current = null; };
  }, [scannerOpen]);
  function closeScanner() { controlsRef.current?.stop(); controlsRef.current = null; setScannerOpen(false); }
  function finishSale() {
    if (!cart.length) return notify('Adicione pelo menos um produto.');
    if (saleType === 'À vista' && payment === 'Dinheiro' && paid && Number(paid.replace(',', '.')) < total) return notify('O valor recebido não cobre o total.');
    const sale = { id: `CX-${Date.now().toString().slice(-7)}`, date: new Date().toLocaleString('pt-BR'), customer: customer.trim() || 'Consumidor não identificado', items: cart, total, type: saleType, payment: saleType === 'À vista' ? payment : 'A prazo', status: saleType === 'À vista' ? 'Recebida' : 'Pendente' };
    const next = [sale, ...recent].slice(0, 30); setRecent(next); localStorage.setItem('nexus-recent-sales', JSON.stringify(next));
    notify(saleType === 'À vista' ? 'Venda demonstrativa registrada!' : 'Venda a prazo demonstrativa registrada!');
    if (window.confirm('Venda registrada neste navegador. Deseja imprimir o comprovante demonstrativo?')) { setView('receipt'); setReceiptSale(sale); }
    setCart([]); setCustomer(''); setPaid('');
  }
  const [receiptSale, setReceiptSale] = useState(null);
  function printReceipt(sale) { setReceiptSale(sale); setView('receipt'); setTimeout(() => window.print(), 100); }
  return <div className="app-shell">
    <header className="topbar"><div className="brandmark">N</div><div className="brand"><b>NEXUS ERP</b><span>Caixa · Operação de vendas</span></div><div className="top-spacer"/><span className="status"><i/> Caixa demonstrativo</span><button className="icon-btn top-action" title="Vendas recentes" onClick={() => setView('recent')}><History size={19}/></button></header>
    <main className="main">
      {view === 'sale' && <>
        <div className="page-heading"><div><div className="eyebrow">PONTO DE VENDA</div><h1>Nova venda</h1><p>Adicione produtos e escolha como o cliente vai pagar.</p></div><button className="outline-btn" onClick={() => { if(cart.length && !window.confirm('Limpar a venda atual?')) return; setCart([]); setCustomer(''); }}><Trash2 size={16}/> Limpar venda</button></div>
        <div className="layout-grid"><section className="left-column">
          <div className="panel"><div className="panel-title"><span className="step">1</span><div><h2>Cliente <small>· opcional</small></h2><p>Identifique o cliente se necessário.</p></div></div><div className="customer-row"><div className="search-wrap"><Search size={18}/><input value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="Nome, CPF ou telefone"/></div><button className="square-btn" title="Cadastrar cliente (demonstração)" onClick={()=>{setCustomerOpen(true)}}><UserRoundPlus size={19}/></button></div></div>
          <div className="panel product-panel"><div className="panel-title"><span className="step">2</span><div><h2>Adicionar produtos</h2><p>Busque por nome, referência ou código de barras.</p></div></div><div className="search-row"><div className="search-wrap"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produto ou referência..." onKeyDown={e=>{if(e.key==='Enter' && filtered.length===1)addProduct(filtered[0]);}}/></div><button className="scan-btn" onClick={startScanner}><ScanBarcode size={19}/><span>Ler código</span></button></div><div className="catalog-label">CATÁLOGO DE TESTE <span>{filtered.length} itens</span></div><div className="product-list">{filtered.map(p=><div className="product-row" key={p.id}><div className="product-icon"><Receipt size={18}/></div><div className="product-info"><b>{p.name}</b><span>Ref. {p.id} · {p.barcode}</span></div><b className="product-price">{money(p.price)}</b><button className="add-btn" onClick={()=>addProduct(p)}><Plus size={17}/></button></div>)}{!filtered.length&&<div className="empty-small">Nenhum item de demonstração encontrado para “{search}”.</div>}</div><div className="demo-note">Os produtos acima são exemplos locais. Nenhuma consulta de estoque é realizada.</div></div>
        </section><section className="right-column"><div className="panel cart-panel"><div className="cart-header"><div><div className="eyebrow">VENDA ATUAL</div><h2>Carrinho <span className="count">{cart.reduce((s,x)=>s+x.qty,0)}</span></h2></div><ShoppingCartIcon/></div>{!cart.length?<div className="empty-cart"><div className="empty-icon"><Receipt size={27}/></div><b>Seu carrinho está vazio</b><span>Adicione produtos para começar a venda.</span></div>:<div className="cart-items">{cart.map(item=><div className="cart-item" key={item.id}><div className="cart-item-main"><b>{item.name}</b><span>{money(item.price)} cada</span><div className="qty-controls"><button onClick={()=>changeQty(item.id,-1)} aria-label="Diminuir"><Minus size={14}/></button><b>{item.qty}</b><button onClick={()=>changeQty(item.id,1)} aria-label="Aumentar"><Plus size={14}/></button></div></div><div className="cart-item-side"><b>{money(item.price*item.qty)}</b><button className="remove-btn" onClick={()=>removeItem(item.id)} title="Remover item"><Trash2 size={15}/></button></div></div>)}</div>}<div className="totals"><div><span>Subtotal</span><b>{money(total)}</b></div><div className="grand-total"><span>Total da venda</span><strong>{money(total)}</strong></div></div><div className="payment-section"><div className="panel-title compact"><span className="step">3</span><div><h2>Pagamento</h2><p>Escolha o tipo de venda.</p></div></div><div className="segmented"><button className={saleType==='À vista'?'selected':''} onClick={()=>setSaleType('À vista')}><CircleDollarSign size={17}/> À vista</button><button className={saleType==='A prazo'?'selected':''} onClick={()=>setSaleType('A prazo')}><CalendarClock size={17}/> A prazo</button></div>{saleType==='À vista'?<><label className="field-label">Forma de pagamento</label><div className="payment-options">{['Pix','Dinheiro','Débito','Crédito'].map(p=><button key={p} className={payment===p?'payment-choice active':'payment-choice'} onClick={()=>setPayment(p)}><span className="pay-symbol">{p==='Pix'?'✳':p==='Dinheiro'?'R$':p==='Débito'?'▤':'▣'}</span>{p}</button>)}</div>{payment==='Dinheiro'&&<div className="cash-field"><label>Valor recebido (opcional)</label><input value={paid} onChange={e=>setPaid(e.target.value)} placeholder="Ex.: 100,00" inputMode="decimal"/>{paid&&Number(paid.replace(',','.'))>=total&&<span>Troco: {money(Number(paid.replace(',','.'))-total)}</span>}</div>}</>:<div className="installment-box"><label>Quantidade de parcelas</label><select value={installmentCount} onChange={e=>setInstallmentCount(e.target.value)}>{[1,2,3,4,5,6,8,10,12].map(n=><option key={n} value={n}>{n}x</option>)}</select><p>Simulação de {installmentCount} parcelas. A identificação do cliente e as condições finais devem ser confirmadas antes de uma venda real.</p></div>}<button className="finish-btn" onClick={finishSale} disabled={!cart.length}><CheckCircle2 size={19}/>{saleType==='À vista'?'Registrar venda':'Registrar venda a prazo'}<span>{money(total)}</span></button><div className="secure-note"><ShieldCheck size={14}/> Ação demonstrativa · não registra no Supabase</div></div></div><div className="quick-links"><button onClick={()=>setView('recent')}><History size={17}/> Vendas recentes</button><button onClick={()=>notify('Abertura e fechamento serão implementados na próxima etapa.')}><Wallet size={17}/> Caixa / turno</button><button onClick={()=>notify('Cancelamentos exigirão autorização do administrador.')}><ShieldCheck size={17}/> Cancelamento autorizado</button></div></section></div>
      </>}
      {view==='recent'&&<><div className="page-heading"><div><div className="eyebrow">HISTÓRICO LOCAL</div><h1>Vendas recentes</h1><p>Registros salvos apenas neste navegador para testar o fluxo.</p></div><button className="outline-btn" onClick={()=>setView('sale')}><ChevronLeft size={16}/> Voltar ao Caixa</button></div><div className="panel recent-panel">{recent.length===0?<div className="empty-cart"><History size={30}/><b>Nenhuma venda registrada</b><span>Faça uma venda de teste para ela aparecer aqui.</span></div>:recent.map(s=><div className="recent-row" key={s.id}><div className="recent-badge"><Receipt size={18}/></div><div className="recent-info"><b>{s.id} · {s.customer}</b><span>{s.date} · {s.type} · {s.payment}</span><small>{s.items.map(i=>`${i.qty}× ${i.name}`).join(', ')}</small></div><div className="recent-total"><b>{money(s.total)}</b><span className={s.status==='Recebida'?'paid-status':'pending-status'}>{s.status}</span></div><button className="square-btn" title="Imprimir comprovante" onClick={()=>printReceipt(s)}><Printer size={17}/></button></div>)}</div></>}
      {view==='receipt'&&<><div className="page-heading no-print"><div><div className="eyebrow">COMPROVANTE DEMONSTRATIVO</div><h1>Comprovante</h1><p>Confira os dados antes de imprimir.</p></div><button className="outline-btn" onClick={()=>setView('sale')}><ChevronLeft size={16}/> Voltar ao Caixa</button></div><div className="receipt-sheet"><div className="receipt-brand">NEXUS ERP</div><h2>Comprovante de venda · DEMONSTRAÇÃO</h2>{receiptSale&&<><p><b>Venda:</b> {receiptSale.id}</p><p><b>Data:</b> {receiptSale.date}</p><p><b>Cliente:</b> {receiptSale.customer}</p><p><b>Pagamento:</b> {receiptSale.payment} · {receiptSale.type}</p><hr/>{receiptSale.items.map(i=><div className="receipt-line" key={i.id}><span>{i.qty} × {i.name}</span><span>{money(i.qty*i.price)}</span></div>)}<hr/><div className="receipt-total"><b>TOTAL</b><b>{money(receiptSale.total)}</b></div><p className="receipt-disclaimer">Documento demonstrativo, sem validade fiscal. Não representa pagamento real.</p></>}<button className="finish-btn no-print" onClick={()=>window.print()}><Printer size={18}/> Imprimir comprovante</button></div></>}
    </main>
    <footer> NEXUS ERP · Protótipo local · Sem estoque, Supabase ou integração fiscal </footer>
    {toast&&<div className="toast"><CheckCircle2 size={18}/>{toast}</div>}
    {scannerOpen&&<div className="modal-backdrop"><div className="scanner-modal"><div className="modal-head"><div><h2>Ler código de barras</h2><p>Permita o acesso à câmera quando solicitado.</p></div><button className="icon-btn" onClick={closeScanner}><X/></button></div><div className="video-frame"><video ref={videoRef} muted playsInline/><div className="scan-line"/><div className="scan-corners"/></div><p className="scan-message"><Camera size={16}/>{scanMessage}</p><p className="camera-help">Se a câmera não abrir, confira a permissão do navegador. A câmera requer localhost ou HTTPS.</p><button className="outline-btn full-width" onClick={closeScanner}>Fechar leitor</button></div></div>}
    {customerOpen&&<div className="modal-backdrop"><div className="small-modal"><div className="modal-head"><h2>Identificar cliente</h2><button className="icon-btn" onClick={()=>setCustomerOpen(false)}><X/></button></div><p className="muted">Protótipo local: digite o nome ou telefone no campo Cliente. O cadastro real será integrado depois.</p><button className="finish-btn" onClick={()=>setCustomerOpen(false)}>Entendi</button></div></div>}
  </div>;
}
function ShoppingCartIcon(){return <div className="cart-icon"><Receipt size={20}/></div>}

createRoot(document.getElementById('root')).render(<App/>);
