"use client";

import { useState, useEffect } from "react";
import { 
    PersonCircle, CheckCircleFill, XCircleFill, ArrowLeft, 
    PatchCheckFill, Search, Filter, FileEarmarkText, Eye, FileEarmarkPerson, X, Ban
} from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";

export default function AdminUsersContent() {
  const { user } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [reviewUser, setReviewUser] = useState<any>(null);
  const [userToSuspend, setUserToSuspend] = useState<any>(null);

  // Feedback State
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error", message: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
      setLoading(true);
      try {
          const endpoint = activeTab === "pending" 
            ? "/api/admin/users?filter=pending" 
            : "/api/admin/users";
            
          const res = await fetch(endpoint, { cache: "no-store" });
          const data = await res.json();
          if(Array.isArray(data)) setUsers(data);
      } catch (error) { 
          console.error(error); 
      } finally { 
          setLoading(false); 
      }
  };

  const handleVerification = async (userId: string, action: "approve" | "reject") => {
      setProcessingId(userId);
      try {
          const res = await fetch("/api/admin/users", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, action })
          });

          if (res.ok) {
              setFeedback({ type: "success", message: `User ${action}d successfully.` });
              
              // Close modal if open
              setReviewUser(null);

              // Update List Locally
              if (activeTab === "pending") {
                  setUsers(prev => prev.filter(u => u._id !== userId));
              } else {
                  // Update specific user status in 'all' view without refetching
                  setUsers(prev => prev.map(u => u._id === userId ? {
                      ...u, 
                      isVerified: action === 'approve',
                      settings: { ...u.settings, verificationStatus: action === 'approve' ? 'verified' : 'rejected' }
                  } : u));
              }
          } else {
              setFeedback({ type: "error", message: "Action failed." });
          }
      } catch (error) {
          setFeedback({ type: "error", message: "Network error." });
      } finally {
          setProcessingId(null);
      }
  };

  // --- 2. STATUS LOGIC (Suspend/Activate) ---
  const handleStatusChange = async () => {
      if (!userToSuspend) return;
      
      const newStatus = userToSuspend.status === 'suspended' ? 'active' : 'suspended';
      const userId = userToSuspend._id;

      // 🔍 DEBUG: Log what we are attempting to do
      console.log("🛠️ [FRONTEND] Initiating Status Change:", { userId, newStatus });

      setProcessingId(userId);
      
      try {
          const payload = { userId, action: "update_status", status: newStatus };
          
          // 🔍 DEBUG: Log the exact payload
          console.log("🚀 [FRONTEND] Sending Payload:", payload);

          const res = await fetch("/api/admin/users", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload) 
          });

          console.log("📡 [FRONTEND] API Status Code:", res.status);

          const data = await res.json();
          console.log("📦 [FRONTEND] API Response Data:", data);

          if (res.ok) {
              setFeedback({ type: "success", message: `User marked as ${newStatus}.` });
              // Optimistic update
              setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: newStatus } : u));
              setUserToSuspend(null); // Close modal
          } else {
              console.error("❌ [FRONTEND] Error Message:", data.message);
              setFeedback({ type: "error", message: "Update failed." });
          }
      } catch (error) {
          console.error("🔥 [FRONTEND] Network/Logic Error:", error);
          setFeedback({ type: "error", message: "Network error." });
      } finally {
          setProcessingId(null);
      }
  };
  
  // Filter users based on Search Term
  const filteredUsers = users.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
        
        {/* HEADER & SEARCH */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/admin" className="text-gray-400 hover:text-navy"><ArrowLeft /></Link>
                <h1 className="text-2xl font-bold text-navy">User Management</h1>
            </div>

            {/* ✅ NEW: USER COUNTS DISPLAY */}
            <div className="hidden md:flex items-center gap-4 bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm text-xs font-bold text-gray-500">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>Freelancers: <span className="text-navy text-sm ml-1">{users.filter(u => u.role === 'freelancer').length}</span></span>
                </div>
                <div className="w-px h-4 bg-gray-200"></div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>Clients: <span className="text-navy text-sm ml-1">{users.filter(u => u.role === 'client').length}</span></span>
                </div>
            </div>

            {/* SEARCH BAR */}
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-3.5 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search users..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-navy transition-all shadow-sm"
                />
            </div>
        </div>

        {/* MOBILE COUNTS (Visible only on small screens) */}
        <div className="flex md:hidden justify-between gap-4 bg-white border border-gray-200 px-4 py-3 rounded-xl shadow-sm text-xs font-bold text-gray-500">
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Freelancers: <span className="text-navy">{users.filter(u => u.role === 'freelancer').length}</span></span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Clients: <span className="text-navy">{users.filter(u => u.role === 'client').length}</span></span>
            </div>
        </div>

        {/* TABS */}
        <div className="flex gap-4 border-b border-gray-200">
            <button 
                onClick={() => setActiveTab("all")}
                className={`pb-3 px-4 text-sm font-bold transition-colors ${activeTab === "all" ? "text-navy border-b-2 border-navy" : "text-gray-400 hover:text-navy"}`}
            >
                All Users
            </button>
            <button 
                onClick={() => setActiveTab("pending")}
                className={`pb-3 px-4 text-sm font-bold transition-colors ${activeTab === "pending" ? "text-navy border-b-2 border-navy" : "text-gray-400 hover:text-navy"}`}
            >
                Pending Verification
            </button>
        </div>

        {/* USERS LIST */}
        {loading ? (
            <div className="p-10 text-center animate-pulse text-gray-400">Loading Users...</div>
        ) : users.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed text-gray-400">
                {activeTab === "pending" ? "No pending verification requests." : "No users found."}
            </div>
        ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">User</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Role</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredUsers.map(u => (
                            <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden">
                                            {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover"/> : <PersonCircle className="text-3xl text-gray-300 ml-1 mt-1"/>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-navy flex items-center gap-1">
                                                {u.name} {u.isVerified && <PatchCheckFill className="text-blue-500 text-xs" />}
                                            </p>
                                            <p className="text-xs text-gray-500">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'client' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {u.settings?.verificationStatus === 'pending' ? (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold text-orange-500 bg-orange-100 px-2 py-1 rounded w-fit">Pending</span>
                                            {u.identityDocument && (
                                                <a 
                                                    href={u.identityDocument} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                                                >
                                                    <FileEarmarkText /> View ID
                                                </a>
                                            )}
                                        </div>
                                    ) : u.isVerified ? (
                                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Verified</span>
                                    ) : (
                                        <span className="text-xs text-gray-400">Unverified</span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {u.settings?.verificationStatus === 'pending' ? (
                                            <button 
                                                onClick={() => setReviewUser(u)}
                                                className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                                            >
                                                <Eye /> Review
                                            </button>
                                        ) : (
                                            // ✅ TOGGLE SUSPEND / ACTIVE
                                            <button 
                                                onClick={() => setUserToSuspend(u)}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
                                                    u.status === 'suspended' 
                                                    ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100" 
                                                    : "bg-white text-red-600 border-red-200 hover:bg-red-50"
                                                }`}
                                            >
                                                {u.status === 'suspended' ? "Reactivate" : "Suspend"}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* --- REVIEW VERIFICATION MODAL --- */}
        {reviewUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-full border border-gray-200 overflow-hidden">
                                {reviewUser.avatar ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={reviewUser.avatar} className="w-full h-full object-cover" />
                                ) : <PersonCircle className="text-3xl text-gray-300 m-1" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-navy text-sm">{reviewUser.name}</h3>
                                <p className="text-xs text-gray-500">{reviewUser.email}</p>
                            </div>
                        </div>
                        <button onClick={() => setReviewUser(null)} className="text-gray-400 hover:text-red-500"><X className="text-2xl" /></button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto space-y-6">
                        
                        {/* Info Block */}
                        <div className="flex gap-4">
                            <div className="flex-1 bg-blue-50 border border-blue-100 p-3 rounded-xl">
                                <span className="text-[10px] uppercase font-bold text-blue-400 block mb-1">Declared Location</span>
                                <span className="text-sm font-bold text-navy">{reviewUser.country || "Not set"}</span>
                            </div>
                            <div className="flex-1 bg-purple-50 border border-purple-100 p-3 rounded-xl">
                                <span className="text-[10px] uppercase font-bold text-purple-400 block mb-1">Document Type</span>
                                <span className="text-sm font-bold text-navy capitalize">
                                    {(reviewUser.identityDocType || "ID Card").replace("_", " ")}
                                </span>
                            </div>
                        </div>

                        {/* Documents Display */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                <FileEarmarkPerson /> Submitted Documents
                            </h4>
                            
                            {reviewUser.identityDocuments && reviewUser.identityDocuments.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {reviewUser.identityDocuments.map((docUrl: string, index: number) => (
                                        <div key={index} className="group relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100 aspect-video">
                                            <a href={docUrl} target="_blank" rel="noopener noreferrer">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img 
                                                    src={docUrl} 
                                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                                                    alt={`Document ${index + 1}`} 
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                    <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-navy text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                                        Click to Zoom
                                                    </span>
                                                </div>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
                                    No documents attached.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                        <button 
                            onClick={() => handleVerification(reviewUser._id, "reject")}
                            disabled={!!processingId}
                            className="flex-1 py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors shadow-sm disabled:opacity-50"
                        >
                            Reject Request
                        </button>
                        <button 
                            onClick={() => handleVerification(reviewUser._id, "approve")}
                            disabled={!!processingId}
                            className="flex-1 py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy-light transition-colors shadow-lg disabled:opacity-50"
                        >
                            {processingId ? "Processing..." : "Approve Verification"}
                        </button>
                    </div>

                </div>
            </div>
        )}

        {/* --- SUSPEND CONFIRMATION MODAL --- */}
        {userToSuspend && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 ${userToSuspend.status === 'suspended' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {userToSuspend.status === 'suspended' ? <CheckCircleFill /> : <Ban />}
                    </div>
                    <h3 className="text-xl font-bold text-navy mb-2">
                        {userToSuspend.status === 'suspended' ? "Reactivate Account?" : "Suspend Account?"}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        {userToSuspend.status === 'suspended' 
                            ? "This will restore the user's access to the platform immediately."
                            : "This will immediately block the user from logging in and hide their profile."
                        }
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => setUserToSuspend(null)} className="flex-1 py-2 text-gray-500 font-bold bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                        <button 
                            onClick={handleStatusChange} 
                            disabled={!!processingId}
                            className={`flex-1 py-2 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 ${
                                userToSuspend.status === 'suspended' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                            }`}
                        >
                            {processingId ? "Processing..." : "Confirm"}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* FEEDBACK MODAL */}
        {feedback && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in zoom-in">
                <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl text-center">
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 text-2xl ${feedback.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {feedback.type === 'success' ? <CheckCircleFill /> : <XCircleFill />}
                    </div>
                    <h3 className="font-bold text-navy mb-1">{feedback.type === 'success' ? 'Success' : 'Error'}</h3>
                    <p className="text-sm text-gray-500 mb-6">{feedback.message}</p>
                    <button 
                        onClick={() => setFeedback(null)} 
                        className="w-full py-2 bg-gray-100 text-navy font-bold rounded-lg hover:bg-gray-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        )}

    </div>
  );
}