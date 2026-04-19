"use client";
import { useRef, useState } from "react";

const B = "#2e4799";
const BG = "#eef1fa";

const emptyRow = () => ({ p: "", q: "", r: "" });
const toNum = (v) => parseFloat(v) || 0;
const fmt = (n) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
function n2w(n) {
  n = Math.floor(n);
  if (!n) return "Zero";
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? " "+ones[n%10] : "");
  if (n < 1000) return ones[Math.floor(n/100)] + " Hundred" + (n%100 ? " "+n2w(n%100) : "");
  if (n < 100000) return n2w(Math.floor(n/1000)) + " Thousand" + (n%1000 ? " "+n2w(n%1000) : "");
  if (n < 10000000) return n2w(Math.floor(n/100000)) + " Lakh" + (n%100000 ? " "+n2w(n%100000) : "");
  return n2w(Math.floor(n/10000000)) + " Crore" + (n%10000000 ? " "+n2w(n%10000000) : "");
}

// Reusable editable input — transparent, no border, just text
function EI({ value, onChange, placeholder = "", style = {}, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        border: "none", outline: "none", background: "transparent",
        fontFamily: "inherit", color: "inherit", width: "100%", padding: 0,
        ...style,
      }}
      onFocus={e => (e.target.style.background = "rgba(46,71,153,0.09)")}
      onBlur={e => (e.target.style.background = "transparent")}
    />
  );
}

// Dashed-underline field (for bill meta like Name, Address etc.)
function Field({ label, value, onChange, placeholder = "", fullWidth = false, type = "text" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5, gridColumn: fullWidth ? "1/-1" : undefined }}>
      <span style={{ fontWeight:700, fontSize:11.5, whiteSpace:"nowrap", color:"#222" }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          border:"none", borderBottom:`1px dashed ${B}`, outline:"none",
          background:"transparent", fontFamily:"inherit", fontSize:12,
          color:"#111", flex:1, padding:"0 3px",
        }}
        onFocus={e => { e.target.style.background="rgba(46,71,153,0.07)"; e.target.style.borderRadius="2px 2px 0 0"; }}
        onBlur={e => { e.target.style.background="transparent"; e.target.style.borderRadius="0"; }}
      />
    </div>
  );
}

export default function BillTemplate({ initialData = {} }) {
  const printRef = useRef(null);

  // ── Shop info (all editable) ──
  const [propr,    setPropr]    = useState(initialData.propr    ?? "प्रोप्रा. रवि कनकने");
  const [gstin,    setGstin]    = useState(initialData.gstin    ?? "GSTIN : 23AXXPK2953L1ZU");
  const [shopPhone,setShopPhone]= useState(initialData.shopPhone?? "मो. 9300134968");
  const [shop1,    setShop1]    = useState(initialData.shop1    ?? "यूनियन कम्युनिकेशन");
  const [andText,  setAndText]  = useState(initialData.andText  ?? "एण्ड");
  const [shop2,    setShop2]    = useState(initialData.shop2    ?? "गृहशोभा इलेक्ट्रॉनिक एंड फर्नीचर");
  const [shopAddr, setShopAddr] = useState(initialData.shopAddr ?? "यूनियन बैंक के पास, साईं मंदिर, खितोला बाजार");
  const [finText,  setFinText]  = useState(initialData.finText  ?? "फायनेंस सुविधा उपलब्ध");
  const [forText,  setForText]  = useState(initialData.forText  ?? "For– यूनियन कम्युनिकेशन");
  const [sigText,  setSigText]  = useState(initialData.sigText  ?? "Prop/Authorised Signature");

  // ── Table headers ──
  const [hNo,  setHNo]  = useState("No.");
  const [hPar, setHPar] = useState("Particular");
  const [hQty, setHQty] = useState("Qty");
  const [hRate,setHRate]= useState("Rate");
  const [hAmt, setHAmt] = useState("Amount");

  // ── Tax labels ──
  const [cgstLbl, setCgstLbl] = useState("CGST 9%");
  const [sgstLbl, setSgstLbl] = useState("SGST 9%");
  const [totalLbl,setTotalLbl]= useState("Total");
  const [inWordLbl,setInWordLbl]=useState("In Word :");
  const [cgstRate, setCgstRate]= useState(9);
  const [sgstRate, setSgstRate]= useState(9);

  // ── Footer notes ──
  const [notes, setNotes] = useState(initialData.notes ?? [
    "नोट– फायनेंस पे किस्त समय पर जमा करें।",
    "किस्त बाउंस होती है तो इसके लिये ग्राहक स्वयं जिम्मेदार होगा।",
    "बिका हुआ माल न बदला जारेगा न ही वापिस होगा।",
    "किसी भी समान पे वारंटी सर्विस सेंटर कि होगी। ग्राहक को स्वयं जाना पड़ेगा।",
  ]);

  // ── Bill meta ──
  const [billNo,  setBillNo]  = useState(initialData.billNo  ?? "");
  const [date,    setDate]    = useState(initialData.date    ?? new Date().toISOString().split("T")[0]);
  const [cname,   setCname]   = useState(initialData.cname   ?? "");
  const [caddr,   setCaddr]   = useState(initialData.caddr   ?? "");
  const [cmobile, setCmobile] = useState(initialData.cmobile ?? "");

  // ── Rows ──
  const [rows, setRows] = useState(initialData.rows ?? Array.from({length:10}, emptyRow));
  const updateRow = (i, f, v) => setRows(prev => prev.map((r,idx) => idx===i ? {...r,[f]:v} : r));
  const addRow    = () => setRows(prev => [...prev, emptyRow()]);
  const removeRow = (i) => setRows(prev => prev.filter((_,idx) => idx!==i));

  // ── Calculations ──
  const subtotal = rows.reduce((s,r) => s + toNum(r.q)*toNum(r.r), 0);
  const cgst = subtotal * (cgstRate/100);
  const sgst = subtotal * (sgstRate/100);
  const total = subtotal + cgst + sgst;
  const inWords = total > 0 ? n2w(total) + " Rupees Only" : "—";

  // ── Print ──
  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open("","_blank","width=870,height=920");
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8"/><title>Bill #${billNo}</title>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;900&display=swap" rel="stylesheet"/>
      <style>
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Noto Sans Devanagari',sans-serif;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
        .bw{max-width:780px;margin:0 auto;border:2px solid #2e4799;}
        input{border:none!important;outline:none!important;background:transparent!important;width:100%;font-family:inherit;}
        .no-print{display:none!important;}
        @page{size:A4;margin:8mm;}
      </style></head><body><div class="bw">${content}</div></body></html>`);
    win.document.close();
    setTimeout(()=>{win.focus();win.print();win.close();},800);
  };

  const tdIn = (val, onChange, align="left", type="text") => ({
    value: val, onChange: e => onChange(e.target.value), type,
    style:{
      border:"none", outline:"none", background:"transparent",
      fontFamily:"inherit", fontSize:11.5, color:"#111",
      width:"100%", padding:"2px 2px", textAlign: align,
    },
  });

  return (
    <div style={{ minHeight:"100vh", background:"#c9d4e8", padding:"16px 10px",
      display:"flex", flexDirection:"column", alignItems:"center",
      fontFamily:"'Noto Sans Devanagari',sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;900&display=swap');
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}
        input[type=number]{-moz-appearance:textfield;}
        input:hover{background:rgba(46,71,153,0.06)!important;border-radius:2px;}
        @media print{.no-print{display:none!important;}}
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{ display:"flex", gap:10, marginBottom:14, width:"100%", maxWidth:780, justifyContent:"flex-end" }}>
        <button onClick={addRow} style={{ padding:"6px 16px", background:B, color:"#fff", border:"none", borderRadius:5, fontSize:13, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>+ Add Row</button>
        <button onClick={handlePrint} style={{ padding:"6px 18px", background:"#1a7a4a", color:"#fff", border:"none", borderRadius:5, fontSize:13, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>🖨 Print Bill</button>
      </div>

      {/* ══ BILL ══ */}
      <div ref={printRef} style={{ background:"#fff", width:"100%", maxWidth:780, border:`2px solid ${B}`, fontFamily:"'Noto Sans Devanagari',sans-serif" }}>

        {/* ── HEADER ── */}
        <div style={{ borderBottom:`2px solid ${B}` }}>
          {/* Meta row */}
          <div style={{ display:"flex", justifyContent:"space-between", gap:4, fontSize:10, color:B, fontWeight:700, padding:"5px 10px 2px" }}>
            <EI value={propr}     onChange={setPropr}     style={{ fontSize:10, fontWeight:700, color:B, textAlign:"left",   flex:1 }}/>
            <EI value={gstin}     onChange={setGstin}     style={{ fontSize:10, fontWeight:700, color:B, textAlign:"center", flex:1 }}/>
            <EI value={shopPhone} onChange={setShopPhone} style={{ fontSize:10, fontWeight:700, color:B, textAlign:"right",  flex:1 }}/>
          </div>

          {/* Shop name */}
          <div style={{ textAlign:"center", padding:"2px 8px 0" }}>
            <div style={{ fontSize:30, fontWeight:900, color:B, lineHeight:1.1 }}>
              <EI value={shop1} onChange={setShop1} style={{ fontSize:30, fontWeight:900, color:B, textAlign:"center" }}/>
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:B, display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
              —&nbsp;
              <EI value={andText} onChange={setAndText} style={{ fontSize:13, fontWeight:700, color:B, textAlign:"center", width:70 }}/>
              &nbsp;—
            </div>
            <div style={{ fontSize:19, fontWeight:800, color:B }}>
              <EI value={shop2} onChange={setShop2} style={{ fontSize:19, fontWeight:800, color:B, textAlign:"center" }}/>
            </div>
          </div>

          {/* Address strip */}
          <div style={{ background:B, margin:"5px 8px 4px", padding:"4px 8px" }}>
            <EI value={shopAddr} onChange={setShopAddr} style={{ fontSize:11, fontWeight:700, color:"#fff", textAlign:"center" }}/>
          </div>

          {/* Product SVG icons */}
          <div style={{ display:"flex", justifyContent:"space-around", alignItems:"center", padding:"5px 12px 8px" }}>
            {/* Speakers */}
            <svg width="46" height="38" viewBox="0 0 46 38">
              <rect x="1" y="4" width="13" height="28" rx="2" stroke={B} strokeWidth="1.2" fill={BG}/>
              <circle cx="7.5" cy="22" r="5.5" stroke={B} strokeWidth="1.1" fill="none"/>
              <circle cx="7.5" cy="22" r="2.2" fill={B} opacity=".35"/>
              <rect x="2.5" y="7" width="8" height="5" rx="1" stroke={B} strokeWidth=".9" fill="none"/>
              <rect x="24" y="4" width="13" height="28" rx="2" stroke={B} strokeWidth="1.2" fill={BG}/>
              <circle cx="30.5" cy="22" r="5.5" stroke={B} strokeWidth="1.1" fill="none"/>
              <circle cx="30.5" cy="22" r="2.2" fill={B} opacity=".35"/>
              <rect x="25.5" y="7" width="8" height="5" rx="1" stroke={B} strokeWidth=".9" fill="none"/>
            </svg>
            {/* Clock */}
            <svg width="36" height="38" viewBox="0 0 36 38">
              <rect x="2" y="8" width="32" height="24" rx="3" stroke={B} strokeWidth="1.2" fill={BG}/>
              <circle cx="18" cy="20" r="7.5" stroke={B} strokeWidth="1.1" fill="none"/>
              <polyline points="18,14 18,20 22,23" stroke={B} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
              <rect x="7" y="1" width="5" height="8" rx="1" fill={B} opacity=".45"/>
              <rect x="24" y="1" width="5" height="8" rx="1" fill={B} opacity=".45"/>
            </svg>
            {/* Washing machine */}
            <svg width="34" height="38" viewBox="0 0 34 38">
              <rect x="2" y="1" width="30" height="36" rx="2" stroke={B} strokeWidth="1.2" fill={BG}/>
              <rect x="2" y="1" width="30" height="8" rx="2" fill={B} opacity=".18"/>
              <circle cx="17" cy="24" r="8.5" stroke={B} strokeWidth="1.1" fill="none"/>
              <circle cx="17" cy="24" r="4" stroke={B} strokeWidth="1" fill={B} opacity=".15"/>
              <circle cx="6" cy="5" r="1.7" fill={B}/>
              <circle cx="11" cy="5" r="1.7" fill={B} opacity=".5"/>
            </svg>
            {/* Dining */}
            <svg width="54" height="38" viewBox="0 0 54 38">
              <rect x="5" y="15" width="44" height="7" rx="2" stroke={B} strokeWidth="1.2" fill={BG}/>
              <line x1="13" y1="22" x2="10" y2="37" stroke={B} strokeWidth="1.4"/>
              <line x1="41" y1="22" x2="44" y2="37" stroke={B} strokeWidth="1.4"/>
              <line x1="19" y1="22" x2="19" y2="37" stroke={B} strokeWidth="1.4"/>
              <line x1="35" y1="22" x2="35" y2="37" stroke={B} strokeWidth="1.4"/>
              <rect x="7" y="4" width="11" height="12" rx="1" stroke={B} strokeWidth="1" fill="none"/>
              <rect x="36" y="4" width="11" height="12" rx="1" stroke={B} strokeWidth="1" fill="none"/>
            </svg>
            {/* Sofa */}
            <svg width="54" height="38" viewBox="0 0 54 38">
              <rect x="8" y="18" width="38" height="16" rx="3" stroke={B} strokeWidth="1.2" fill={BG}/>
              <rect x="12" y="13" width="30" height="9" rx="2" stroke={B} strokeWidth="1.2" fill={BG}/>
              <rect x="2" y="15" width="9" height="19" rx="2" stroke={B} strokeWidth="1.2" fill={BG}/>
              <rect x="43" y="15" width="9" height="19" rx="2" stroke={B} strokeWidth="1.2" fill={BG}/>
              <line x1="14" y1="34" x2="14" y2="38" stroke={B} strokeWidth="1.4"/>
              <line x1="40" y1="34" x2="40" y2="38" stroke={B} strokeWidth="1.4"/>
            </svg>
            {/* TV */}
            <svg width="48" height="38" viewBox="0 0 48 38">
              <rect x="2" y="4" width="44" height="26" rx="3" stroke={B} strokeWidth="1.2" fill={BG}/>
              <rect x="5" y="7" width="38" height="20" rx="1" stroke={B} strokeWidth="1" fill="none"/>
              <line x1="20" y1="30" x2="17" y2="36" stroke={B} strokeWidth="1.4"/>
              <line x1="28" y1="30" x2="31" y2="36" stroke={B} strokeWidth="1.4"/>
              <line x1="14" y1="36" x2="34" y2="36" stroke={B} strokeWidth="1.2"/>
            </svg>
            {/* Mobile */}
            <svg width="22" height="38" viewBox="0 0 22 38">
              <rect x="2" y="1" width="18" height="36" rx="3" stroke={B} strokeWidth="1.2" fill={BG}/>
              <rect x="4" y="5" width="14" height="23" rx="1" stroke={B} strokeWidth="1" fill="none"/>
              <circle cx="11" cy="32.5" r="1.8" fill={B} opacity=".4"/>
              <rect x="7.5" y="2.5" width="7" height="1.2" rx=".6" fill={B} opacity=".4"/>
            </svg>
          </div>
        </div>

        {/* ── BILL META FIELDS ── */}
        <div style={{ padding:"6px 12px 8px", borderBottom:`1px solid ${B}` }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"5px 24px" }}>
            <Field label="Bill No." value={billNo}  onChange={setBillNo}  placeholder="—" />
            <Field label="Date"     value={date}    onChange={setDate}    type="date" />
            <Field label="Name"     value={cname}   onChange={setCname}   placeholder="ग्राहक का नाम" />
            <Field label="Mobile"   value={cmobile} onChange={setCmobile} placeholder="मोबाइल नं." />
            <Field label="Address"  value={caddr}   onChange={setCaddr}   placeholder="पता" fullWidth />
          </div>
        </div>

        {/* ── ITEMS TABLE ── */}
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11.5 }}>
          <thead>
            <tr style={{ background:B, color:"#fff" }}>
              {[
                [hNo,  setHNo,  30,  "center"],
                [hPar, setHPar, null,"left"  ],
                [hQty, setHQty, 52,  "center"],
                [hRate,setHRate,84,  "center"],
                [hAmt, setHAmt, 94,  "center"],
              ].map(([val, setter, w, align], idx) => (
                <th key={idx} style={{ padding:"5px 6px", borderRight: idx<4?"1px solid #6b82cc":"none",
                  width: w||undefined, fontWeight:700 }}>
                  <EI value={val} onChange={setter} style={{ color:"#fff", fontWeight:700, fontSize:11.5, textAlign:align }}/>
                </th>
              ))}
              <th className="no-print" style={{ width:24, background:B }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const amt = toNum(row.q) * toNum(row.r);
              const bg  = i%2 ? BG : "#fff";
              const bdr = `1px solid #c8d0e8`;
              return (
                <tr key={i} style={{ borderBottom: bdr }}>
                  <td style={{ padding:"3px 4px", borderRight:bdr, textAlign:"center", color:"#777", background:bg, fontSize:11 }}>{i+1}</td>
                  <td style={{ padding:"2px 4px", borderRight:bdr, background:bg }}>
                    <input value={row.p} onChange={e=>updateRow(i,"p",e.target.value)} placeholder="विवरण / Item"
                      style={{ border:"none", outline:"none", background:"transparent", fontFamily:"inherit", fontSize:11.5, color:"#111", width:"100%", padding:"2px" }}/>
                  </td>
                  <td style={{ padding:"2px 2px", borderRight:bdr, background:bg }}>
                    <input type="number" value={row.q} onChange={e=>updateRow(i,"q",e.target.value)} placeholder="0"
                      style={{ border:"none", outline:"none", background:"transparent", fontFamily:"inherit", fontSize:11.5, color:"#111", width:"100%", textAlign:"center", padding:"2px" }}/>
                  </td>
                  <td style={{ padding:"2px 2px", borderRight:bdr, background:bg }}>
                    <input type="number" value={row.r} onChange={e=>updateRow(i,"r",e.target.value)} placeholder="0.00"
                      style={{ border:"none", outline:"none", background:"transparent", fontFamily:"inherit", fontSize:11.5, color:"#111", width:"100%", textAlign:"right", padding:"2px" }}/>
                  </td>
                  <td style={{ padding:"3px 8px", textAlign:"right", fontWeight:600, color:"#222", background:bg }}>
                    {amt>0 ? fmt(amt) : ""}
                  </td>
                  <td className="no-print" style={{ textAlign:"center", background:bg }}>
                    <button onClick={()=>removeRow(i)} style={{ background:"none", border:"none", color:"#d44", fontSize:11, cursor:"pointer", padding:"0 2px" }}>✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── FINANCE + TAXES ── */}
        <div style={{ display:"flex", borderTop:`2px solid ${B}` }}>
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:B, padding:"12px 16px" }}>
            <EI value={finText} onChange={setFinText} style={{ fontSize:18, fontWeight:900, color:"#fff", textAlign:"center" }}/>
          </div>
          <div style={{ width:200, borderLeft:`2px solid ${B}`, fontSize:12 }}>
            {/* CGST */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 10px", borderBottom:`1px solid #c8d0e8` }}>
              <EI value={cgstLbl} onChange={setCgstLbl} style={{ fontSize:12, color:"#555", width:80 }}/>
              <span style={{ fontWeight:600 }}>₹{fmt(cgst)}</span>
            </div>
            {/* SGST */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 10px", borderBottom:`1px solid #c8d0e8` }}>
              <EI value={sgstLbl} onChange={setSgstLbl} style={{ fontSize:12, color:"#555", width:80 }}/>
              <span style={{ fontWeight:600 }}>₹{fmt(sgst)}</span>
            </div>
            {/* Total */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 10px", background:B, color:"#fff" }}>
              <EI value={totalLbl} onChange={setTotalLbl} style={{ fontSize:13, fontWeight:800, color:"#fff", width:60 }}/>
              <span style={{ fontWeight:800, fontSize:13 }}>₹{fmt(total)}</span>
            </div>
          </div>
        </div>

        {/* ── IN WORDS ── */}
        <div style={{ display:"flex", alignItems:"center", borderTop:`1px solid ${B}`, padding:"5px 10px", fontSize:11 }}>
          <EI value={inWordLbl} onChange={setInWordLbl} style={{ fontSize:11, fontWeight:700, color:"#333", width:72, flexShrink:0 }}/>
          <span style={{ fontStyle:"italic", color:"#222", marginLeft:6 }}>{inWords}</span>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end",
          borderTop:`2px solid ${B}`, padding:"8px 12px", background:BG }}>
          <div style={{ flex:1 }}>
            {notes.map((n, i) => (
              <div key={i}>
                <EI value={n} onChange={v => setNotes(prev => prev.map((x,idx)=>idx===i?v:x))}
                  style={{ fontSize:10.5, color:"#333", width:"100%" }}/>
              </div>
            ))}
          </div>
          <div style={{ textAlign:"right", minWidth:155, marginLeft:12 }}>
            <EI value={forText} onChange={setForText} style={{ fontSize:11, fontWeight:700, color:"#222", textAlign:"right" }}/>
            <div style={{ borderTop:`1px solid ${B}`, paddingTop:3, marginTop:28 }}>
              <EI value={sigText} onChange={setSigText} style={{ fontSize:10, color:"#555", textAlign:"center" }}/>
            </div>
          </div>
        </div>

      </div>{/* /bill */}
    </div>
  );
}
