"use client";

import { useState, useEffect, useRef, useCallback, useId } from "react";
import {
  Globe,
  ShieldLock,
  Bell,
  Save,
  CheckCircleFill,
  PersonBadge,
  Eye,
  Phone,
  Envelope,
  PlayBtn,
  Lightning,
  ToggleOn,
  ToggleOff,
  Moon,
  Sun,
  Trash,
  ExclamationTriangle,
  CloudUpload,
  XCircleFill,
  ChevronDown,
  ExclamationTriangleFill,
  QrCodeScan,
} from "react-bootstrap-icons";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import { uploadToCloudinary } from "@/utils/upload";
import PageLoader from "@/components/PageLoader";
import { AFRICAN_COUNTRIES } from "@/utils/data";

export default function SettingsContent() {
  const { t, user, setLanguage, refreshUser } = useLanguage();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [idFiles, setIdFiles] = useState<File[]>([]);
  const [docType, setDocType] = useState("national_id");
  const idInputRef = useRef<HTMLInputElement>(null);

  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [isCustomCountry, setIsCustomCountry] = useState(false);

  const [formData, setFormData] = useState({
    country: "Cameroon",
    verificationStatus: "none",
    identityDocuments: [] as string[],
    identityDocType: "national_id",

    language: "en",
    contentLanguage: "en",
    autoplayVideo: true,
    reduceAnimations: false,
    soundEffects: true,

    password: "",
    twoFactorEnabled: false,

    profileVisibility: "public",
    showOnlineStatus: true,
    allowDataCollection: true,
    theme: "light",
    canHire: false,

    notifications: {
      email: true,
      sms: false,
      push: true,
      inApp: true,
      marketing: false,
    },
  });

  useEffect(() => {
    if (user) fetchSettings();
  }, [user]);

  useEffect(() => {
    if (window.location.hash === "#security-section") {
      setActiveTab("security");
      // Wait for tab switch, then scroll
      setTimeout(() => {
        document
          .getElementById("security-section")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/users/${user._id}`);
      const data = await res.json();

      let status = data.verificationStatus || "none";
      if (data.isVerified) status = "verified";

      setFormData((prev) => ({
        ...prev,
        country: data.country || prev.country,
        ...data.settings,
        verificationStatus: status,
        identityDocuments: data.identityDocuments || [],
        identityDocType: data.identityDocType || "national_id",
        twoFactorEnabled: data.twoFactorEnabled || false,
        canHire: data.canHire || false,
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        userId: user._id,
        ...formData,
        newPassword: formData.password || undefined,
      };

      const res = await fetch("/api/users/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");

      const updatedUserFromDb = await res.json();

      const currentUser = JSON.parse(localStorage.getItem("afriqUser") || "{}");
      const mergedUser = { ...currentUser, ...updatedUserFromDb };
      localStorage.setItem("afriqUser", JSON.stringify(mergedUser));

      if (refreshUser) await refreshUser();
      setLanguage(formData.language as any);

      setFeedback({ type: "success", message: t.settings.success });
      setFormData((prev) => ({ ...prev, password: "" }));
    } catch (error) {
      console.error("Save Error:", error);
      setFeedback({ type: "error", message: t.settings.errorSave });
    } finally {
      setSaving(false);
    }
  }, [
    user,
    formData,
    refreshUser,
    setLanguage,
    t.settings.success,
    t.settings.errorSave,
  ]);

  const handleRequestVerification = useCallback(async () => {
    if (
      idFiles.length === 0 &&
      (!formData.identityDocuments || formData.identityDocuments.length === 0)
    ) {
      return setFeedback({ type: "error", message: t.settings.errorNoDoc });
    }

    setSaving(true);

    try {
      let finalDocUrls = formData.identityDocuments || [];

      if (idFiles.length > 0) {
        const newUrls: string[] = [];
        for (const file of idFiles) {
          const url = await uploadToCloudinary(file);
          if (url) {
            newUrls.push(url);
          }
        }

        if (newUrls.length === 0) throw new Error("Upload failed");
        finalDocUrls = newUrls;
      }

      const res = await fetch("/api/users/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          verificationStatus: "pending",
          identityDocuments: finalDocUrls,
          identityDocType: docType,
        }),
      });

      if (!res.ok) throw new Error("API Failed");

      setFormData((prev) => ({
        ...prev,
        verificationStatus: "pending",
        identityDocuments: finalDocUrls,
      }));
      setIdFiles([]);
      setFeedback({ type: "success", message: t.settings.verificationSent });
    } catch (error) {
      setFeedback({ type: "error", message: t.workspace.errorUpload });
    } finally {
      setSaving(false);
    }
  }, [
    idFiles,
    formData,
    docType,
    user._id,
    t.settings.errorNoDoc,
    t.settings.verificationSent,
    t.workspace.errorUpload,
  ]);

  const handleLogout = () => {
    localStorage.removeItem("afriqUser");
    router.push("/login");
  };

  const handleDeactivateConfirm = async () => {
    if (confirmText !== "DELETE") return;
    setSaving(true);
    try {
      await fetch("/api/users/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, isActive: false }),
      });

      handleLogout();
    } catch (error) {
      setFeedback({ type: "error", message: "Failed to deactivate account." });
      setSaving(false);
    }
  };

  // --- 2FA SETUP (REAL PRODUCTION) ---
  const handle2FASetup = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/2fa?userId=${user._id}`);
      const data = await res.json();

      if (data.qrCode) {
        setQrCodeUrl(data.qrCode);
        setSecretKey(data.secret);
        setShow2FAModal(true);
      } else {
        setFeedback({ type: "error", message: "Could not generate QR Code." });
      }
    } catch (error) {
      console.error(error);
      setFeedback({
        type: "error",
        message: t.settings.errorSave || "Connection failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirm2FA = async () => {
    if (!verifyCode || verifyCode.length < 6) {
      alert("Please enter the 6-digit code."); // Or use setFeedback
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          token: verifyCode,
          secret: secretKey,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setFormData((prev) => ({ ...prev, twoFactorEnabled: true }));
        setShow2FAModal(false);
        setFeedback({ type: "success", message: t.settings.twoFaSuccess });
        setVerifyCode(""); // Clear code
        // Optional: Refresh user context here if needed
      } else {
        alert(t.settings.twoFaInvalid || "Invalid Code. Try again.");
      }
    } catch (error) {
      setFeedback({ type: "error", message: "Verification failed." });
    } finally {
      setSaving(false);
    }
  };

  // --- REUSABLE COMPONENTS ---
  const Toggle = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (val: boolean) => void;
  }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`text-2xl transition-colors ${checked ? "text-green-500" : "text-gray-300"}`}
    >
      {checked ? <ToggleOn /> : <ToggleOff />}
    </button>
  );

  const CustomSelect = ({
    label,
    value,
    onChange,
    options,
    disabled = false,
  }: any) => {
    const id = useId();
    return (
      <div className="relative">
        <label
          htmlFor={id}
          className="block text-xs font-bold text-gray-500 uppercase mb-1"
        >
          {label}
        </label>
        <div className="relative">
          <select
            id={id}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full p-3 pr-10 bg-white border border-gray-200 rounded-xl text-sm text-navy outline-none focus:border-navy appearance-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
          >
            {options.map((opt: any) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
            <ChevronDown className="text-xs" />
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: "account", label: t.settings.account, icon: <PersonBadge /> },
    { id: "general", label: t.nav.general, icon: <Globe /> },
    { id: "security", label: t.settings.security, icon: <ShieldLock /> },
    { id: "visibility", label: t.settings.visibility, icon: <Eye /> },
    { id: "notifications", label: t.notificationsPage.title, icon: <Bell /> },
    {
      id: "data",
      label: t.settings.dataPrivacy,
      icon: <ExclamationTriangle />,
    },
  ];

  const getThemeIcon = (value: string) => {
    if (value === "light") return <Sun className="inline mr-1" />;
    if (value === "dark") return <Moon className="inline mr-1" />;
    return null;
  };

  const verificationBtnLabel = saving
    ? t.proposal.submitting
    : formData.verificationStatus === "rejected"
      ? t.settings.resubmit
      : t.settings.submitVerify;

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <h1 className="text-2xl font-bold text-navy mb-6">{t.settings.title}</h1>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 flex md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-2 md:pb-0">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-navy text-white shadow-md"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* ACCOUNT PREFERENCES */}
          {activeTab === "account" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-navy border-b border-gray-100 pb-2">
                {t.settings.accountPref}
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    {t.auth.location}
                  </label>

                  {!isCustomCountry ? (
                    <div className="space-y-2">
                      <select
                        value={
                          AFRICAN_COUNTRIES.includes(formData.country)
                            ? formData.country
                            : "Other"
                        }
                        onChange={(e) => {
                          if (e.target.value === "Other") {
                            setIsCustomCountry(true);
                            setFormData({ ...formData, country: "" });
                          } else {
                            setFormData({
                              ...formData,
                              country: e.target.value,
                            });
                          }
                        }}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm text-navy outline-none focus:border-navy appearance-none"
                      >
                        {AFRICAN_COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value="Other">Other (Type Manually)</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) =>
                          setFormData({ ...formData, country: e.target.value })
                        }
                        placeholder="Enter your country"
                        className="flex-1 p-3 bg-white border border-gray-200 rounded-xl text-sm text-navy outline-none focus:border-navy"
                      />
                      <button
                    type="button"
                        onClick={() => setIsCustomCountry(false)}
                        className="px-3 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    {t.settings.theme}
                  </span>
                  <div
                    className="flex bg-gray-50 p-1 rounded-xl border border-gray-200"
                    role="group"
                  >
                    {["light", "dark", "system"].map((tv) => (
                      <button
                        key={tv}
                        type="button"
                        // ✅ FIX: Update local form data instead of calling context directly
                        onClick={() => setFormData({ ...formData, theme: tv })}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                          // ✅ FIX: Check formData.theme to show active state
                          formData.theme === tv
                            ? "bg-white text-navy shadow-sm"
                            : "text-gray-400"
                        }`}
                      >
                        {getThemeIcon(tv)}
                        {tv}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="font-bold text-navy text-sm">
                      {t.settings.idVerify}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {t.manage.status}:{" "}
                      <span className="font-bold uppercase">
                        {formData.verificationStatus}
                      </span>
                    </p>
                  </div>

                  {formData.verificationStatus === "pending" && (
                    <span className="text-xs font-bold text-orange-500 bg-white border border-orange-200 px-3 py-1 rounded-full">
                      {t.workspace.pendingReview}
                    </span>
                  )}

                  {(formData.verificationStatus === "verified" ||
                    user?.isVerified) && (
                    <span className="text-xs font-bold text-green-600 bg-white border border-green-200 px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircleFill /> {t.settings.verified}
                    </span>
                  )}

                  {formData.verificationStatus === "rejected" && (
                    <span className="text-xs font-bold text-red-600 bg-white border border-red-200 px-3 py-1 rounded-full flex items-center gap-1">
                      <XCircleFill /> {t.manage.reject}
                    </span>
                  )}
                </div>

                {formData.verificationStatus !== "verified" &&
                  formData.verificationStatus !== "pending" &&
                  !user?.isVerified && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
                      {formData.verificationStatus === "rejected" && (
                        <div className="bg-red-50 text-red-800 text-xs p-3 rounded-lg border border-red-100 flex items-start gap-2">
                          <ExclamationTriangle className="text-sm mt-0.5 flex-shrink-0" />
                          <p>
                            <strong>{t.settings.verifyFailed}:</strong>{" "}
                            {t.settings.verifyFailDesc}
                          </p>
                        </div>
                      )}

                      <div className="bg-blue-100 text-blue-800 text-xs p-3 rounded-lg border border-blue-200 flex items-start gap-2">
                        <ExclamationTriangle className="text-sm mt-0.5 flex-shrink-0" />
                        <p>
                          <strong>Important:</strong> {t.settings.verifyTip}
                        </p>
                      </div>

                      <CustomSelect
                        label={t.settings.docType}
                        value={docType}
                        onChange={(e: any) => setDocType(e.target.value)}
                        options={[
                          { value: "national_id", label: "National ID Card" },
                          {
                            value: "passport",
                            label: "International Passport",
                          },
                          {
                            value: "drivers_license",
                            label: "Driver's License",
                          },
                          { value: "govt_id", label: "Other Govt Issued ID" },
                        ]}
                      />

                      <button
                        type="button"
                        onClick={() => idInputRef.current?.click()}
                        className="w-full p-6 bg-white border-2 border-dashed rounded-xl text-center hover:bg-blue-50/50 border-blue-200 transition-colors flex flex-col items-center justify-center gap-2"
                      >
                        <CloudUpload className="text-3xl text-blue-300" />
                        <div className="text-center">
                          <span className="text-xs font-bold text-navy block">
                            {t.workspace.uploadFiles}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {t.settings.frontBack}
                          </span>
                        </div>
                        {idFiles.length > 0 ? (
                          <div className="flex flex-wrap gap-2 justify-center mt-2">
                            {idFiles.map((f, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-600 border border-gray-200"
                              >
                                {f.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          formData.identityDocuments?.length > 0 && (
                            <span className="text-xs text-green-600 font-bold mt-1">
                              <CheckCircleFill className="inline mr-1" />{" "}
                              {t.settings.docsOnFile}
                            </span>
                          )
                        )}
                        <input
                          type="file"
                          multiple
                          ref={idInputRef}
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={(e) =>
                            e.target.files &&
                            setIdFiles(Array.from(e.target.files))
                          }
                        />
                      </button>

                      <button
                        type="button"
                        onClick={handleRequestVerification}
                        disabled={saving}
                        className="w-full py-3 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy-light shadow-md transition-all disabled:opacity-50"
                      >
                        {verificationBtnLabel}
                      </button>
                    </div>
                  )}

                {formData.verificationStatus === "pending" && (
                  <div className="text-center py-8 text-gray-400 text-xs italic">
                    {t.settings.reviewTime}
                  </div>
                )}
              </div>
              {user?.role === "freelancer" && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-navy text-sm">
                      {t.settings.enableHiring || "Also Want to Hire Talent?"}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-md">
                      {t.settings.enableHiringDesc ||
                        "Turn this on to post jobs and hire other freelancers, without creating a separate client account."}
                    </p>
                  </div>
                  <Toggle
                    checked={formData.canHire}
                    onChange={(v) => setFormData({ ...formData, canHire: v })}
                  />
                </div>
              )}
            </div>
          )}

          {/* GENERAL PREFERENCES */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-navy border-b border-gray-100 pb-2">
                {t.nav.general} {t.settings.preferences}
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <CustomSelect
                  label={t.settings.appLang}
                  value={formData.language}
                  onChange={(e: any) =>
                    setFormData({ ...formData, language: e.target.value })
                  }
                  options={[
                    { value: "en", label: "English" },
                    { value: "fr", label: "Français" },
                    { value: "ar", label: "العربية" },
                  ]}
                />
                <CustomSelect
                  label={t.settings.contentLang}
                  value={formData.contentLanguage}
                  onChange={(e: any) =>
                    setFormData({
                      ...formData,
                      contentLanguage: e.target.value,
                    })
                  }
                  options={[
                    { value: "en", label: "English" },
                    { value: "fr", label: "Français" },
                    { value: "mixed", label: "Show All" },
                  ]}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-navy flex items-center gap-2">
                    <PlayBtn /> {t.settings.autoplay}
                  </span>
                  <Toggle
                    checked={formData.autoplayVideo}
                    onChange={(v) =>
                      setFormData({ ...formData, autoplayVideo: v })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-navy flex items-center gap-2">
                    <Lightning /> {t.settings.reduceAnim}
                  </span>
                  <Toggle
                    checked={formData.reduceAnimations}
                    onChange={(v) =>
                      setFormData({ ...formData, reduceAnimations: v })
                    }
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h4 className="text-red-600 font-bold text-sm mb-2">
                  {t.settings.dangerZone}
                </h4>
                <button
                  onClick={() => setShowDeactivateModal(true)}
                  className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors w-full md:w-auto text-sm font-medium border border-red-100"
                >
                  <Trash /> {t.settings.deactivate}
                </button>
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-6" id="security-section">
              <h3 className="text-lg font-bold text-navy border-b border-gray-100 pb-2">
                {t.settings.security}
              </h3>

              <div>
                <label
                  htmlFor="passwordInput"
                  className="block text-xs font-bold text-gray-500 uppercase mb-1"
                >
                  {t.settings.password}
                </label>
                <input
                  id="passwordInput"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder={t.settings.newPassword}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-navy transition-colors"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-navy text-sm">
                      {t.settings.twoFa}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {t.settings.twoFaDesc}
                    </p>
                  </div>
                  {formData.twoFactorEnabled ? (
                    <span className="text-green-600 font-bold text-xs flex items-center gap-1">
                      <CheckCircleFill /> {t.settings.enabled}
                    </span>
                  ) : (
                    <button
                      onClick={handle2FASetup}
                      className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50"
                    >
                      {t.settings.setup}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-navy border-b border-gray-100 pb-2">
                {t.notificationsPage.title}
              </h3>
              <div className="space-y-2">
                {[
                  { id: "push", label: t.settings.pushNotif, icon: <Bell /> },
                  {
                    id: "inApp",
                    label: t.settings.inAppNotif,
                    icon: <Lightning />,
                  },
                  {
                    id: "email",
                    label: t.settings.emailNotif,
                    icon: <Envelope />,
                  },
                  { id: "sms", label: t.settings.smsNotif, icon: <Phone /> },
                ].map((opt) => (
                  <div
                    key={opt.id}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-navy flex items-center gap-3 text-gray-600">
                      {opt.icon} {opt.label}
                    </span>
                    <Toggle
                      checked={
                        formData.notifications[
                          opt.id as keyof typeof formData.notifications
                        ]
                      }
                      onChange={(v) =>
                        setFormData({
                          ...formData,
                          notifications: {
                            ...formData.notifications,
                            [opt.id]: v,
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VISIBILITY */}
          {activeTab === "visibility" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-navy border-b border-gray-100 pb-2">
                {t.settings.visibility}
              </h3>

              <div>
                <span className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  {t.settings.profilePrivacy}
                </span>
                <div className="flex flex-col gap-2">
                  {["public", "clients_only", "private"].map((vis) => (
                    <label
                      key={vis}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="radio"
                        name="visibility"
                        checked={formData.profileVisibility === vis}
                        onChange={() =>
                          setFormData({ ...formData, profileVisibility: vis })
                        }
                        className="text-navy focus:ring-navy accent-navy"
                      />
                      <span className="capitalize text-sm font-medium text-navy">
                        {vis.replace("_", " ")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <span className="text-sm font-medium text-navy">
                  {t.settings.onlineStatus}
                </span>
                <Toggle
                  checked={formData.showOnlineStatus}
                  onChange={(v) =>
                    setFormData({ ...formData, showOnlineStatus: v })
                  }
                />
              </div>
            </div>
          )}

          {/* DATA & PRIVACY */}
          {activeTab === "data" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-navy border-b border-gray-100 pb-2">
                {t.settings.dataPrivacy}
              </h3>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h4 className="font-bold text-navy text-sm mb-2">
                  {t.settings.dataDownload}
                </h4>
                <p className="text-xs text-gray-500 mb-3">
                  {t.settings.dataDownloadDesc}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setFeedback({
                      type: "success",
                      message: t.settings.archiveRequested,
                    })
                  }
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-navy hover:bg-gray-100"
                >
                  {t.settings.requestArchive}
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-navy block">
                      {t.settings.allowData}
                    </span>
                    <span className="text-xs text-gray-400">
                      {t.settings.allowDataDesc}
                    </span>
                  </div>
                  <Toggle
                    checked={formData.allowDataCollection}
                    onChange={(v) =>
                      setFormData({ ...formData, allowDataCollection: v })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-navy block">
                      {t.settings.searchVis}
                    </span>
                    <span className="text-xs text-gray-400">
                      {t.settings.searchVisDesc}
                    </span>
                  </div>
                  <Toggle
                    checked={formData.profileVisibility === "public"}
                    onChange={(v) =>
                      setFormData({
                        ...formData,
                        profileVisibility: v ? "public" : "private",
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-navy text-white py-3 rounded-xl font-bold shadow-lg hover:bg-navy-light transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {saving ? (
                t.proposal.submitting
              ) : (
                <>
                  <Save /> {t.settings.save}
                </>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
            >
              {t.nav.logout}
            </button>
          </div>
        </div>
      </div>

      {/* --- DEACTIVATE CONFIRMATION MODAL --- */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 text-2xl bg-red-100 text-red-600">
              <ExclamationTriangleFill />
            </div>
            <h3 className="font-bold text-navy text-lg mb-2">
              {t.settings.deactivateTitle}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {t.settings.deactivateDesc}
              <br />
              <br />
              {t.settings.typeDelete} <strong>DELETE</strong>{" "}
              {t.settings.toConfirm}.
            </p>

            <input
              type="text"
              placeholder="Type DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl mb-4 text-center font-bold outline-none focus:border-red-500 uppercase"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                {t.proposal.cancel}
              </button>
              <button
                onClick={handleDeactivateConfirm}
                disabled={confirmText !== "DELETE" || saving}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? t.manage.processing : t.settings.deactivate}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FEEDBACK MODAL --- */}
      {feedback && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in zoom-in">
          <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl text-center">
            <div
              className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 text-2xl ${feedback.type === "success" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
            >
              {feedback.type === "success" ? (
                <CheckCircleFill />
              ) : (
                <XCircleFill />
              )}
            </div>
            <h3 className="font-bold text-navy mb-1">
              {feedback.type === "success" ? "Success" : "Error"}
            </h3>
            <p className="text-sm text-gray-500 mb-6">{feedback.message}</p>
            <button
              onClick={() => setFeedback(null)}
              className="w-full py-2 bg-gray-100 text-navy font-bold rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t.settings.success ? "Close" : "Close"}
            </button>
          </div>
        </div>
      )}

      {/* --- 2FA SETUP MODAL --- */}
      {show2FAModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center">
            <h3 className="font-bold text-navy text-lg mb-4">
              {t.settings.scanQr}
            </h3>

            {/* QR CODE DISPLAY */}
            <div className="bg-white p-4 border border-gray-200 rounded-xl mb-4 inline-block">
              {qrCodeUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrCodeUrl}
                  alt="2FA QR Code"
                  className="w-40 h-40 object-contain"
                />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center bg-gray-100 rounded-lg">
                  <span className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin"></span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 mb-4 px-4">
              {t.settings.scanQrDesc}
            </p>

            {/* INPUT FOR CODE */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-navy uppercase mb-1 text-left ml-1">
                {t.settings.enterCode || "Enter 6-digit Code"}
              </label>
              <input
                type="text"
                value={verifyCode}
                onChange={(e) =>
                  setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                } // Only numbers, max 6
                placeholder="123 456"
                className="w-full p-3 text-center text-2xl font-mono tracking-widest border border-gray-200 rounded-xl outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShow2FAModal(false);
                  setVerifyCode("");
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                {t.proposal.cancel}
              </button>
              <button
                onClick={confirm2FA}
                disabled={verifyCode.length < 6 || saving}
                className="flex-1 py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy-light disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
              >
                {saving && (
                  <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                )}
                {t.settings.verifyEnable}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
