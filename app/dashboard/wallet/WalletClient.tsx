"use client";

import { useState, useEffect } from "react";
import { 
    Wallet2, ArrowDownLeft, ArrowUpRight, ClockHistory, Phone,
    CreditCard, Bank, CheckCircleFill, X, PlusLg, DashLg, ShieldLock, 
    ExclamationCircleFill, Person, Building
} from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import PageLoader from "@/components/PageLoader";

export default function WalletContent() {
  const { t, user, currency, convertPrice } = useLanguage();
  
  const [balance, setBalance] = useState({ available: 0, escrow: 0, pending: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // --- MODAL STATES ---
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  
  // --- FORM STATES ---
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [method, setMethod] = useState<"MOMO" | "BANK">("MOMO"); // Payment Method Toggle
  const [bankName, setBankName] = useState("");      // NEW: For Bank Withdrawals
  const [accountNumber, setAccountNumber] = useState(""); // NEW: For Bank Withdrawals
  
  // --- FEEDBACK STATES ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); // For Withdrawal Success Modal
  const [feedback, setFeedback] = useState<{ type: "error" | "success", message: string } | null>(null);
  const [showSecurityBanner, setShowSecurityBanner] = useState(true);

  // --- LOAD DATA ---
  useEffect(() => {
    if (user) fetchWalletData();
  }, [user]);

  const fetchWalletData = async () => {
      try {
          const res = await fetch(`/api/wallet?userId=${user._id}`, { cache: "no-store" });
          const data = await res.json();
          if (data.balance) setBalance(data.balance);
          if (Array.isArray(data.transactions)) setTransactions(data.transactions);
      } catch (error) {
          console.error(error);
      } finally {
          setLoading(false);
      }
  };

  // --- ACTION: DEPOSIT ---
  const handleDeposit = async () => {
      setFeedback(null);
      if (!amount || Number(amount) < 100) return setFeedback({ type: "error", message: t.wallet.errorAmount || "Minimum deposit is 100 XAF" });
      
      setIsProcessing(true);

      try {
          // 1. Request Payment Link
          const res = await fetch("/api/wallet/deposit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user._id, amount: Number(amount) })
          });
          
          const data = await res.json();

          if (!res.ok) throw new Error(data.message || "Deposit failed");

          // 2. Redirect to Swychr Payment Page
          if (data.url) {
              window.location.href = data.url; 
          } else {
              throw new Error("No payment link returned");
          }

      } catch (error: any) {
          setIsProcessing(false);
          setFeedback({ type: "error", message: error.message || t.wallet.errorGeneric });
      }
  };

  // --- ACTION: WITHDRAW ---
  const handleWithdraw = async () => {
      setFeedback(null);
      const val = Number(amount);
      
      // Basic Validation
      if (!val || val < 1000) return setFeedback({ type: "error", message: "Minimum withdrawal is 1,000 XAF" });
      if (val > balance.available) return setFeedback({ type: "error", message: t.wallet.errorFunds });
      if (!beneficiaryName.trim()) return setFeedback({ type: "error", message: "Beneficiary Name is required" });

      // Method Specific Validation
      if (method === "MOMO") {
          if (!phone || phone.length < 9) return setFeedback({ type: "error", message: t.wallet.errorMomo });
      } else if (method === "BANK") {
          if (!bankName.trim()) return setFeedback({ type: "error", message: "Bank Name is required" });
          if (!accountNumber.trim()) return setFeedback({ type: "error", message: "Account Number is required" });
      }

      setIsProcessing(true);

      try {
          const res = await fetch("/api/wallet/withdraw", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  userId: user._id,
                  amount: val,
                  beneficiaryName,
                  // Conditional Payload based on Method
                  provider: method, 
                  phone: method === "MOMO" ? phone : undefined,
                  bankName: method === "BANK" ? bankName : undefined,
                  accountNumber: method === "BANK" ? accountNumber : undefined
              })
          });
          
          const data = await res.json();

          if (!res.ok) throw new Error(data.message || "Withdrawal failed");

          setIsProcessing(false);
          setShowSuccess(true);
          
          setTimeout(() => {
              setShowSuccess(false);
              setShowWithdrawModal(false);
              setAmount("");
              setPhone("");
              setBeneficiaryName("");
              setBankName("");
              setAccountNumber("");
              fetchWalletData(); 
          }, 3000);

      } catch (error: any) {
          setIsProcessing(false);
          setFeedback({ type: "error", message: error.message || t.wallet.errorGeneric });
      }
  };

  // --- HELPER: FEE CALCULATOR ---
  const getWithdrawalDetails = () => {
      const val = Number(amount) || 0;
      if (val === 0) return null;
      
      const fixed = 450;
      const percent = val * 0.015; // 1.5%
      const totalFee = Math.ceil(fixed + percent);
      const net = val - totalFee;
      
      return { fee: totalFee, net };
  };

  const withdrawStats = getWithdrawalDetails();

  const filteredTransactions = transactions.filter(tx => {
      if (filter === "in") return tx.type === "deposit" || tx.type === "payment_release";
      if (filter === "out") return tx.type === "withdrawal" || tx.type === "payment_hold";
      return true;
  });

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">

      {/* SECURITY BANNER */}
      {user && !user.twoFactorEnabled && showSecurityBanner && (
        <div className="mb-6 bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-start gap-4 relative animate-in slide-in-from-top-2 shadow-sm">
          <div className="bg-orange-100 p-2 rounded-full text-orange-600 shrink-0">
            <ShieldLock className="text-xl" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-navy mb-1">{t.wallet.securityTitle}</h4>
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">{t.wallet.securityText}</p>
            <Link href="/dashboard/settings" className="text-xs font-bold text-white bg-navy px-4 py-2 rounded-lg hover:bg-navy-light transition-colors inline-block">
              {t.wallet.enable2fa}
            </Link>
          </div>
          <button onClick={() => setShowSecurityBanner(false)} className="text-gray-400 hover:text-orange-500 transition-colors p-1">
            <X className="text-xl" />
          </button>
        </div>
      )}
      
      {/* --- BALANCE CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Balance */}
          <div className="bg-navy text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Wallet2 className="text-9xl" />
              </div>
              
              <p className="text-sm text-gray-300 font-medium mb-1">{t.wallet.available}</p>
              <h2 className="text-3xl font-bold tracking-tight">{convertPrice(balance.available)}</h2>
              
              {/* FIXED BUTTON LAYOUT: Grid to enforce width + Responsive Text */}
              <div className="relative z-10 grid grid-cols-2 gap-3 mt-6 w-full"> 
                  <button 
                    onClick={() => setShowDepositModal(true)}
                    className="bg-gold text-navy py-3 px-1 md:px-2 rounded-xl text-xs lg:text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-white hover:text-navy transition-all shadow-md group whitespace-nowrap"
                  >
                      <PlusLg className="text-lg group-hover:scale-110 transition-transform" /> 
                      <span>{t.wallet.deposit}</span>
                  </button>
                  <button 
                    onClick={() => setShowWithdrawModal(true)}
                    className="bg-white/10 text-white border border-white/20 py-3 px-1 md:px-2 rounded-xl text-xs lg:text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-white/20 transition-all backdrop-blur-sm whitespace-nowrap"
                  >
                      <DashLg className="text-lg" /> 
                      <span>{t.wallet.withdraw}</span>
                  </button>
              </div>
          </div>

          {/* Secondary Stats */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ClockHistory /></div>
                  <span className="text-sm text-gray-500 font-bold">{t.wallet.escrow}</span>
              </div>
              <p className="text-2xl font-bold text-navy">{convertPrice(balance.escrow)}</p>
              <p className="text-xs text-gray-400 mt-1">{t.wallet.escrowDesc}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Bank /></div>
                  <span className="text-sm text-gray-500 font-bold">{t.wallet.pending}</span>
              </div>
              <p className="text-2xl font-bold text-navy">{convertPrice(balance.pending)}</p>
              <p className="text-xs text-gray-400 mt-1">{t.wallet.pendingDesc}</p>
          </div>
      </div>

      {/* --- TRANSACTION HISTORY --- */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="font-bold text-navy text-lg">{t.wallet.history}</h3>
              <div className="flex bg-gray-50 p-1 rounded-xl">
                  {["all", "in", "out"].map(f => (
                      <button 
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filter === f ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                          {t.wallet[f as keyof typeof t.wallet] || f}
                      </button>
                  ))}
              </div>
          </div>

          <div className="divide-y divide-gray-50">
              {loading ? (
                  <div className="p-10 text-center text-gray-400 flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-gray-200 border-t-navy rounded-full animate-spin"></div>
                      <span className="text-xs">Loading transactions...</span>
                  </div>
              ) : filteredTransactions.length === 0 ? (
                  <div className="p-12 text-center">
                      <ClockHistory className="text-4xl text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">{t.wallet.noTrans}</p>
                  </div>
              ) : (
                  filteredTransactions.map(tx => (
                      <div key={tx._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm ${
                                  tx.type === 'deposit' || tx.type === 'payment_release' 
                                  ? 'bg-green-50 text-green-600' 
                                  : 'bg-red-50 text-red-600'
                              }`}>
                                  {tx.type === 'deposit' || tx.type === 'payment_release' ? <ArrowDownLeft /> : <ArrowUpRight />}
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-navy capitalize">{tx.description || tx.type.replace('_', ' ')}</p>
                                  <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()} • <span className="uppercase">{tx.paymentMethod}</span></p>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className={`font-bold text-sm ${
                                  tx.type === 'deposit' || tx.type === 'payment_release' ? 'text-green-600' : 'text-navy'
                              }`}>
                                  {tx.type === 'deposit' || tx.type === 'payment_release' ? '+' : '-'} {convertPrice(tx.amount)}
                              </p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                                  tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                              }`}>
                                  {tx.status}
                              </span>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>

      {/* --- DEPOSIT MODAL --- */}
      {showDepositModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-navy">{t.wallet.deposit}</h3>
                      <button onClick={() => setShowDepositModal(false)} className="text-gray-400 hover:text-red-500"><X className="text-2xl" /></button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                      {feedback && feedback.type === 'error' && (
                          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2">
                              <ExclamationCircleFill /> {feedback.message}
                          </div>
                      )}

                      <p className="text-sm text-gray-500">{t.wallet.depositDesc}</p>

                      <div>
                          <label className="block text-xs font-bold text-navy uppercase mb-2">{t.wallet.amount} ({currency})</label>
                          <div className="relative">
                              <input 
                                  type="number" 
                                  value={amount} 
                                  onChange={e => setAmount(e.target.value)} 
                                  className="w-full p-3 pl-4 border border-gray-200 rounded-xl font-mono text-lg text-navy focus:border-navy outline-none" 
                                  placeholder="5000" 
                              />
                              <span className="absolute right-4 top-3.5 text-gray-400 text-sm font-bold">XAF</span>
                          </div>
                      </div>
                      
                      <div className="text-xs text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-100">
                          <p><strong>Note:</strong> You will be redirected to the secure payment page where you can choose <strong>Mobile Money, Card, or Bank Transfer</strong>.</p>
                      </div>
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-gray-50">
                      <button 
                          onClick={handleDeposit}
                          disabled={isProcessing}
                          className="w-full bg-navy text-white py-3 rounded-xl font-bold shadow-lg hover:bg-navy-light transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                      >
                          {isProcessing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                          {isProcessing ? "Redirecting..." : t.wallet.confirm}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- WITHDRAW MODAL (UPDATED: Method Selector) --- */}
      {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
                  {showSuccess ? (
                      <div className="p-10 flex flex-col items-center justify-center text-center animate-in zoom-in">
                          <CheckCircleFill className="text-6xl text-green-500 mb-4 drop-shadow-sm" />
                          <h3 className="text-xl font-bold text-navy">{t.wallet.requestSent}</h3>
                          <p className="text-sm text-gray-500 mt-2 max-w-[200px] mx-auto">
                              {t.wallet.adminReview}
                          </p>
                      </div>
                  ) : (
                      <>
                          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                              <h3 className="font-bold text-navy">{t.wallet.withdraw}</h3>
                              <button onClick={() => setShowWithdrawModal(false)} className="text-gray-400 hover:text-red-500"><X className="text-2xl" /></button>
                          </div>
                          
                          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                              {feedback && (
                                  <div className={`text-xs p-3 rounded-lg flex items-center gap-2 ${feedback.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                      {feedback.type === 'error' ? <ExclamationCircleFill /> : <CheckCircleFill />} {feedback.message}
                                  </div>
                              )}
                              
                              {/* METHOD SELECTOR */}
                              <div>
                                  <label className="block text-xs font-bold text-navy uppercase mb-2">Withdrawal Method</label>
                                  <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                                      <button 
                                        onClick={() => setMethod("MOMO")}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${method === "MOMO" ? "bg-white text-navy shadow-sm" : "text-gray-500"}`}
                                      >
                                          <Phone /> Mobile Money
                                      </button>
                                      <button 
                                        onClick={() => setMethod("BANK")}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${method === "BANK" ? "bg-white text-navy shadow-sm" : "text-gray-500"}`}
                                      >
                                          <Bank /> Bank Transfer
                                      </button>
                                  </div>
                              </div>

                              <div className="bg-blue-50 p-3 rounded-lg flex justify-between items-center text-sm border border-blue-100">
                                  <span className="text-gray-600">{t.wallet.available}:</span>
                                  <span className="font-bold text-navy">{convertPrice(balance.available)}</span>
                              </div>
                              
                              {/* Amount Input */}
                              <div>
                                  <label className="block text-xs font-bold text-navy uppercase mb-1">{t.wallet.amount}</label>
                                  <input 
                                      type="number" 
                                      value={amount} 
                                      onChange={e => setAmount(e.target.value)} 
                                      className="w-full p-3 border border-gray-200 rounded-xl font-mono text-lg text-navy outline-none focus:border-navy" 
                                      placeholder="10000" 
                                  />
                              </div>

                              {/* Live Fee Calculation */}
                              {withdrawStats && (
                                  <div className="space-y-2 text-xs border-l-2 border-gray-200 pl-3 py-1">
                                      <div className="flex justify-between text-gray-500">
                                          <span>Withdrawal Fee (1.5% + 450):</span>
                                          <span className="font-mono text-red-500">- {withdrawStats.fee.toLocaleString()} XAF</span>
                                      </div>
                                      <div className="flex justify-between font-bold text-navy text-sm pt-1 border-t border-dashed border-gray-200 mt-1">
                                          <span>You Receive:</span>
                                          <span className="text-green-600">{withdrawStats.net.toLocaleString()} XAF</span>
                                      </div>
                                  </div>
                              )}

                              {/* Beneficiary Details */}
                              <div className="space-y-3 pt-2 border-t border-gray-50">
                                  <div>
                                      <label className="block text-xs font-bold text-navy uppercase mb-1">Beneficiary Name</label>
                                      <div className="relative">
                                          <Person className="absolute top-3.5 left-3 text-gray-400"/>
                                          <input 
                                              type="text" 
                                              value={beneficiaryName} 
                                              onChange={e => setBeneficiaryName(e.target.value)} 
                                              className="w-full p-3 pl-10 border border-gray-200 rounded-xl text-sm text-navy outline-none focus:border-navy" 
                                              placeholder="Account Holder Name" 
                                          />
                                      </div>
                                  </div>

                                  {/* DYNAMIC FIELDS BASED ON METHOD */}
                                  {method === "MOMO" && (
                                      <div className="animate-in slide-in-from-top-1">
                                          <label className="block text-xs font-bold text-navy uppercase mb-1">Phone Number (MOMO)</label>
                                          <div className="relative">
                                              <Phone className="absolute top-3.5 left-3 text-gray-400"/>
                                              <input 
                                                  type="tel" 
                                                  value={phone} 
                                                  onChange={e => setPhone(e.target.value)} 
                                                  className="w-full p-3 pl-10 border border-gray-200 rounded-xl text-sm text-navy outline-none focus:border-navy" 
                                                  placeholder="+237 6XX XXX XXX" 
                                              />
                                          </div>
                                      </div>
                                  )}

                                  {method === "BANK" && (
                                      <div className="space-y-3 animate-in slide-in-from-top-1">
                                          <div>
                                              <label className="block text-xs font-bold text-navy uppercase mb-1">Bank Name</label>
                                              <div className="relative">
                                                  <Building className="absolute top-3.5 left-3 text-gray-400"/>
                                                  <input 
                                                      type="text" 
                                                      value={bankName} 
                                                      onChange={e => setBankName(e.target.value)} 
                                                      className="w-full p-3 pl-10 border border-gray-200 rounded-xl text-sm text-navy outline-none focus:border-navy" 
                                                      placeholder="e.g. UBA, Ecobank" 
                                                  />
                                              </div>
                                          </div>
                                          <div>
                                              <label className="block text-xs font-bold text-navy uppercase mb-1">Account Number</label>
                                              <div className="relative">
                                                  <CreditCard className="absolute top-3.5 left-3 text-gray-400"/>
                                                  <input 
                                                      type="text" 
                                                      value={accountNumber} 
                                                      onChange={e => setAccountNumber(e.target.value)} 
                                                      className="w-full p-3 pl-10 border border-gray-200 rounded-xl text-sm text-navy outline-none focus:border-navy" 
                                                      placeholder="0000000000" 
                                                  />
                                              </div>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          </div>

                          <div className="p-4 border-t border-gray-100 bg-gray-50">
                              <button 
                                  onClick={handleWithdraw} 
                                  disabled={isProcessing || (withdrawStats?.net || 0) <= 0} 
                                  className="w-full bg-navy text-white py-3 rounded-xl font-bold shadow-lg hover:bg-navy-light transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                              >
                                  {isProcessing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                  {isProcessing ? "Processing..." : t.wallet.confirm}
                              </button>
                          </div>
                      </>
                  )}
              </div>
          </div>
      )}

    </div>
  );
}