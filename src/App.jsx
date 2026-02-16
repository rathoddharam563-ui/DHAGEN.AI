import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  onSnapshot, 
  query, 
  addDoc, 
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Howl } from 'howler';
import { 
  Loader2, Sparkles, Download, ArrowRight, 
  ImageIcon, Zap, Palette, Wand2, User, 
  LogOut, Info, XCircle, Check, ChevronRight, 
  BookOpen, ScrollText, Cpu, Layout, ShieldCheck,
  RefreshCw, BarChart3, Binary, Layers, Sun, Moon,
  History, Trash2, ZapOff, Target, Users, LayoutGrid,
  Bot, MessageSquare, Star, Lightbulb, Share2, 
  Orbit, Wind, Zap as ZapIcon, AlertTriangle
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: //ADD YOUR DATA HEARE,//
  authDomain: //ADD YOUR DATA HEARE,//
  projectId: //ADD YOUR DATA HEARE,//
  storageBucket: //ADD YOUR DATA HEARE,//
  messagingSenderId://ADD YOUR DATA HEARE,//
  appId: //ADD YOUR DATA HEARE,//
  measurementId://ADD YOUR DATA HEARE,//
};
// 🔥 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


const appId = //ADD YOUR DATA HEARE,//; // same as your projectId

// --- Configuration ---

const apiKey = //ADD YOUR DATA HEARE,//
const IMAGEN_URL = //ADD YOUR DATA HEARE,//;
const GEMINI_LLM_URL = //ADD YOUR DATA HEARE,//

const STYLE_PRESETS = [
  { id: 'none', label: 'Default', prompt: '' },
  { id: 'cinematic', label: 'Cinematic', prompt: 'cinematic lighting, dramatic shadows, 35mm lens, film grain, masterpiece' },
  { id: 'anime', label: 'Anime', prompt: 'vibrant anime style, Makoto Shinkai aesthetic, high detail cel shaded, studio ghibli colors' },
  { id: '3d', label: '3D Render', prompt: 'unreal engine 5 render, octane render, raytraced shadows, hyper-detailed 3D, 4k' },
  { id: 'realistic', label: 'Realistic', prompt: 'photorealistic, 8k resolution, raw photo, fujifilm, incredibly detailed skin and textures' },
  { id: 'cyberpunk', label: 'Cyberpunk', prompt: 'neon night, cyberpunk aesthetic, rainy streets, futuristic tech, pink and teal glow' }
];

// --- Sound Setup ---
const celebrationSound = new Howl({
  src: ['https://assets.mixkit.net/active_storage/sfx/2013/2013-preview.mp3'],
  volume: 0.5,
  html5: true,
  preload: true
});

const clickSound = new Howl({
  src: ['https://assets.mixkit.net/active_storage/sfx/2568/2568-preview.mp3'],
  volume: 0.2,
  html5: true,
  preload: true
});

// --- High Performance Ultra-Premium CSS ---
const customStyles = `
  @keyframes light-sweep { 0% { left: -100%; } 100% { left: 200%; } }
  @keyframes orb-pulse { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.1); } }
  @keyframes grain-shift { 0% { transform: translate(0,0); } 100% { transform: translate(-5%, -5%); } }

  .ultra-glass { 
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%);
    backdrop-filter: blur(35px) saturate(180%); 
    -webkit-backdrop-filter: blur(35px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1); 
    box-shadow: 
      inset 0 1px 1px 0 rgba(255, 255, 255, 0.15),
      0 20px 50px 0 rgba(0, 0, 0, 0.4);
    isolation: isolate;
    position: relative;
    overflow: hidden;
  }

  .ultra-glass::before {
    content: '';
    position: absolute;
    top: 0; left: -100%; width: 50%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
    transform: skewX(-25deg);
    transition: 0.75s;
    z-index: 10;
  }
  
  .ultra-glass:hover::before {
    animation: light-sweep 1.2s ease-in-out forwards;
  }
  
  .light .ultra-glass { 
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.005) 100%);
    border: 1px solid rgba(0, 0, 0, 0.08); 
    box-shadow: inset 0 1px 2px 0 rgba(255, 255, 255, 0.8), 0 15px 35px 0 rgba(0, 0, 0, 0.05);
  }

  .cgi-bg {
    background: radial-gradient(circle at center, #1e1e24 0%, #0d0d0f 100%);
    position: fixed;
    inset: 0;
    z-index: -10;
  }

  .noise-overlay {
    position: fixed;
    inset: -20%;
    background: url("https://grainy-gradients.vercel.app/noise.svg");
    opacity: 0.035;
    pointer-events: none;
    animation: grain-shift 8s steps(10) infinite;
    z-index: -5;
  }

  .glow-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    mix-blend-mode: screen;
    animation: orb-pulse 15s ease-in-out infinite;
    will-change: transform, opacity;
  }
`;

// --- Utility: Exponential Backoff ---
const fetchWithRetry = async (url, options, retries = 5, initialDelay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
    } catch (error) {
      if (i === retries - 1) throw error;
    }
    await new Promise(res => setTimeout(res, initialDelay * Math.pow(2, i)));
  }
  throw new Error("Connection failed after multiple retries");
};

// --- Components ---

const Counter = ({ value, duration = 2 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let frame;
    let startTime;
    const animateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easedProgress = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easedProgress * value));
      if (progress < 1) frame = requestAnimationFrame(animateCount);
    };
    frame = requestAnimationFrame(animateCount);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return <span>{count.toLocaleString()}</span>;
};

// --- Main Application ---
export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ name: '', credits: 10 });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userNameInput, setUserNameInput] = useState('');
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeStyle, setActiveStyle] = useState('none');
  const [prompt, setPrompt] = useState('');
  const [enhancedPromptDisplay, setEnhancedPromptDisplay] = useState('');
  const [generatedImg, setGeneratedImg] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✨ Gemini API States
  const [imageLore, setImageLore] = useState('');
  const [critique, setCritique] = useState(null);
  const [suggestedRemixes, setSuggestedRemixes] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- Firebase Full-Stack Logic ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth failed:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Persistent Profile Sync
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    const unsubProfile = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        if (data.name) setIsLoggedIn(true);
      }
    }, (err) => console.error("Profile sync error:", err));

    // Persistent History Sync
    const historyColRef = collection(db, 'artifacts', appId, 'users', user.uid, 'history');
    const unsubHistory = onSnapshot(historyColRef, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setHistory(docs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    }, (err) => console.error("History sync error:", err));

    return () => { unsubProfile(); unsubHistory(); };
  }, [user]);

  // Glossy CGI Background System
  const GlossyBackground = useMemo(() => (
    <>
      <div className={`cgi-bg transition-colors duration-1000 ${isDarkMode ? '' : 'bg-[#F9FAFB] !radial-gradient(circle, #f0f2f5 0%, #e5e7eb 100%)'}`} />
      <div className="noise-overlay" />
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-8]">
        <div className="glow-orb w-[80vw] h-[80vw] top-[-30%] left-[-10%] bg-cyan-500/10" style={{ animationDuration: '20s' }} />
        <div className="glow-orb w-[60vw] h-[60vw] bottom-[-20%] right-[-10%] bg-purple-600/10" style={{ animationDuration: '25s', animationDelay: '-5s' }} />
        <div className="glow-orb w-[40vw] h-[40vw] top-[20%] right-[10%] bg-blue-400/5" style={{ animationDuration: '18s', animationDelay: '-2s' }} />
      </div>
    </>
  ), [isDarkMode]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setUserNameInput('');
    setGeneratedImg(null);
    setPrompt('');
    setImageLore('');
    setCritique(null);
    setSuggestedRemixes([]);
  }, []);

  /**
   * Enhanced Watermark System
   * Used specifically during the download action to ensure branding is embedded.
   */
  const handleDownload = useCallback((imageUrl) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw primary image
      ctx.drawImage(img, 0, 0);
      
      // Watermark Config
      const text = "DHAGEN AI";
      const fontSize = Math.max(canvas.width * 0.03, 24);
      ctx.font = `black ${fontSize}px sans-serif`;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      
      // Premium Glow Shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Glassy White Text
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      
      const padding = fontSize * 1.2;
      ctx.fillText(text, canvas.width - padding, canvas.height - padding);
      
      // Trigger Download
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png', 1.0);
      link.download = `DHAGEN-MASTER-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  }, []);

  const getEnhancedPrompt = async (rawPrompt, styleId) => {
    const styleData = STYLE_PRESETS.find(s => s.id === styleId);
    const styleInstruction = styleData?.prompt ? `Apply a ${styleData.label} style.` : "";
    try {
      const response = await fetchWithRetry(GEMINI_LLM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ text: `Professional prompt engineer task: Convert input "${rawPrompt}" into high-detail artistic directive. ${styleInstruction} Add cinematic lighting, depth of field, 8k textures. Max 50 words. Return ONLY the new prompt.` }] 
          }]
        })
      });
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || rawPrompt;
    } catch (err) { return `${rawPrompt}, ${styleData?.prompt || 'highly detailed, cinematic'}`; }
  };

  const performNeuralAnalysis = async (base64Img, usedPrompt) => {
    setIsAnalyzing(true);
    try {
      const cleanBase64 = base64Img.split(',')[1];
      const response = await fetchWithRetry(GEMINI_LLM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [
              { text: `Analyze AI image from prompt "${usedPrompt}". 
              1. 2-sentence Lore. 2. Quality Score 1-100. 3. Lighting & Composition technique. 4. 3 short "remix" prompts.
              JSON response keys: "lore", "score", "lighting", "composition", "remixes" (array).` },
              { inlineData: { mimeType: "image/png", data: cleanBase64 } }
            ] 
          }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await response.json();
      const content = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
      setImageLore(content.lore);
      setCritique({ score: content.score, lighting: content.lighting, composition: content.composition });
      setSuggestedRemixes(content.remixes);
    } catch (err) { console.error(err); } finally { setIsAnalyzing(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!userNameInput.trim() || !user) return;
    
    setIsCelebrating(true);
    try {
      const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
      await setDoc(userDocRef, { name: userNameInput, credits: 10 }, { merge: true });
      celebrationSound.play();
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#06b6d4', '#1e1e24', '#ffffff'] });
      setTimeout(() => setIsLoggedIn(true), 2500);
    } catch (err) {
      setError("System sync failed. Please refresh.");
    } finally {
      setIsCelebrating(false);
    }
  };

  const handleGenerate = async (e, type = 'new', overridePrompt = null) => {
    if (e) e.preventDefault();
    const activePrompt = overridePrompt || prompt;
    if (!activePrompt.trim() || userData.credits <= 0) return;

    setIsLoading(true); setError(null);
    try { clickSound.play(); } catch(e) {}
    try {
      const finalPrompt = type === 'remix' ? activePrompt : await getEnhancedPrompt(activePrompt, activeStyle);
      if (type !== 'remix') setEnhancedPromptDisplay(finalPrompt);

      const response = await fetchWithRetry(IMAGEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          instances: { prompt: finalPrompt }, 
          parameters: { sampleCount: 1 } 
        })
      });

      const result = await response.json();
      const base64Raw = `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
      
      setGeneratedImg(base64Raw);

      // Backend Persistence
      const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
      await updateDoc(userDocRef, { credits: userData.credits - 1 });
      
      const historyColRef = collection(db, 'artifacts', appId, 'users', user.uid, 'history');
      await addDoc(historyColRef, { 
        prompt: finalPrompt, 
        image: base64Raw.length < 1000000 ? base64Raw : null, 
        timestamp: serverTimestamp() 
      });

      performNeuralAnalysis(base64Raw, finalPrompt);
    } catch (err) { 
      setError("Neural Grid Failure: Could not establish a stable projection."); 
    } finally { setIsLoading(false); }
  };

  const deleteHistory = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'history', id));
    } catch (err) { console.error(err); }
  };

  // Premium Glass Button Component
  const PremiumButton = ({ children, onClick, disabled, className = "", icon: Icon, variant = "primary" }) => (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative ultra-glass px-5 md:px-8 py-3 md:py-4 rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3
        ${variant === "primary" ? 'bg-cyan-500/10 border-cyan-400/30 text-cyan-400 shadow-[0_10px_20px_-5px_rgba(6,182,212,0.3)]' : 'bg-white/5 text-slate-300'}
        ${disabled ? 'opacity-20 cursor-not-allowed' : 'hover:border-cyan-400/60'}
        ${className}
      `}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </motion.button>
  );

  if (!isLoggedIn) {
    return (
      
      <div className={`min-h-screen flex items-center justify-center p-4 md:p-6 font-sans ${isDarkMode ? 'text-white' : 'text-[#151518]'}`}>
        
        <style>{customStyles}</style>
        {GlossyBackground}
        <AnimatePresence>
          {!isCelebrating ? (
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-lg ultra-glass rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-16 space-y-8 md:space-y-12 text-center shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_15px_40px_rgba(6,182,212,0.4)]">
                <Sparkles className="text-white w-10 h-10 md:w-12 md:h-12" />
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">DHAGEN <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">AI</span></h1>
                <p className="text-slate-500 text-[9px] md:text-xs font-black uppercase tracking-[0.4em] opacity-60">Full-Stack Visual Studio</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-6 md:space-y-8">
                <input autoFocus type="text" required value={userNameInput} onChange={(e) => setUserNameInput(e.target.value)} placeholder="ENTER IDENTITY"
                  className={`w-full px-6 md:px-8 py-5 md:py-6 rounded-2xl text-center text-xs md:text-sm font-black tracking-[0.3em] outline-none transition-all border ${isDarkMode ? 'bg-white/5 border-white/10 focus:border-cyan-500 text-white' : 'bg-black/5 border-black/10 focus:border-cyan-500 text-black'}`}
                />
                <PremiumButton className="w-full py-5 md:py-6">Initialize Session</PremiumButton>
              </form>
            </motion.div>
          ) : (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6 px-6">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-tight">Welcome, {userNameInput}</h2>
              <div className="flex items-center justify-center gap-4 text-cyan-400 font-black uppercase tracking-[0.5em] text-[10px] md:text-xs">
                <Loader2 className="animate-spin w-5 h-5" /> Establishing Neural Link
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-1000 font-sans ${isDarkMode ? 'bg-[#0d0d0f] text-white' : 'bg-[#f0f2f5] text-[#151518] light'}`}>
      <style>{customStyles}</style>
      {GlossyBackground}

      <header className="fixed top-0 w-full z-[100] px-4 md:px-8 py-4 md:py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between ultra-glass rounded-[1.5rem] md:rounded-[2rem] px-4 md:px-8 py-3 md:py-4">
          <div className="flex items-center gap-3 md:gap-4 cursor-pointer group" onClick={() => setGeneratedImg(null)}>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-cyan-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/40 group-hover:rotate-12 transition-transform">
              <Sparkles className="text-white w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span className="font-black text-lg md:text-2xl tracking-tighter uppercase group-hover:tracking-normal transition-all">DHAGEN</span>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden sm:flex gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/5 items-center">
               <ZapIcon className={`w-3 h-3 md:w-3.5 md:h-3.5 ${userData.credits > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
               <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{userData.credits} Credits</span>
            </div>
            <button onClick={toggleTheme} className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 transition-all">
              {isDarkMode ? <Sun className="w-4 h-4 md:w-5 md:h-5 text-amber-400" /> : <Moon className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />}
            </button>
            <button onClick={logout} className="p-2.5 md:p-3 text-slate-500 hover:text-rose-500 transition-all"><LogOut className="w-4 h-4 md:w-5 md:h-5" /></button>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-28 md:pt-40 pb-20 md:pb-24 px-4 md:px-8 space-y-12 md:space-y-20 z-10">
        <div className="max-w-7xl mx-auto w-full space-y-12 md:space-y-16">
          
          {/* CGI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {[
              { label: 'Neural Visuals', value: 12450, icon: ImageIcon, color: 'text-cyan-400' },
              { label: 'Active Links', value: 982, icon: Users, color: 'text-purple-400' },
              { label: 'Fidelity', value: 99, unit: '%', icon: Target, color: 'text-emerald-400' }
            ].map((stat, i) => (
              <motion.div key={i} whileHover={{ y: -5 }} className="ultra-glass p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-center space-y-2 group">
                <stat.icon className={`w-4 h-4 md:w-5 md:h-5 mx-auto mb-2 md:mb-3 opacity-30 group-hover:opacity-100 transition-opacity ${stat.color}`} />
                <p className={`text-3xl md:text-4xl font-black leading-none ${stat.color}`}>
                  <Counter value={stat.value} />{stat.unit}
                </p>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <section className="space-y-6 md:space-y-10">
            <div className="ultra-glass rounded-[2.5rem] md:rounded-[3.5rem] p-4 md:p-6 relative group border-cyan-400/10">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-focus-within:opacity-20 transition-opacity hidden md:block"><Orbit className="w-24 h-24" /></div>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Type a concept to project..."
                className="w-full bg-transparent border-none focus:ring-0 text-xl md:text-3xl px-4 md:px-10 pt-8 md:pt-12 pb-4 md:pb-6 min-h-[140px] md:min-h-[160px] resize-none placeholder:text-slate-600 font-medium leading-relaxed"
              />
              
              <div className="px-4 md:px-10 pb-6 md:pb-10 space-y-8 md:space-y-12">
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {STYLE_PRESETS.map(style => (
                    <button key={style.id} onClick={() => { setActiveStyle(style.id); try { clickSound.play(); } catch(e) {} }}
                      className={`px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all border ${activeStyle === style.id ? 'bg-cyan-500 border-cyan-400 text-white shadow-xl shadow-cyan-500/30' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/30'}`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8 border-t border-white/10 pt-8 md:pt-12">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-inner shrink-0">
                      <Wind className="w-6 h-6 md:w-7 md:h-7 text-cyan-500 animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] md:text-xs font-black uppercase text-cyan-400 tracking-widest">Neural Link Enabled</span>
                      <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60 italic">Session: {user?.uid.slice(0, 8)}</span>
                    </div>
                  </div>
                  <PremiumButton 
                    onClick={handleGenerate} 
                    disabled={isLoading || !prompt.trim() || userData.credits <= 0} 
                    className="w-full md:w-auto md:min-w-[320px] h-16 md:h-20" 
                    icon={isLoading ? Loader2 : Wand2}
                  >
                    {userData.credits <= 0 ? "Insufficient Credits" : isLoading ? "Synthesizing Neural Mesh..." : "Execute Visual Projection"}
                  </PremiumButton>
                </div>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 md:p-6 ultra-glass border-rose-500/20 rounded-2xl md:rounded-3xl flex items-center gap-4 text-rose-400">
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
                <p className="text-[10px] md:text-xs font-black uppercase tracking-widest">{error}</p>
              </motion.div>
            )}

            {enhancedPromptDisplay && !isLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="ultra-glass p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] space-y-3 opacity-40 group hover:opacity-60 transition-opacity">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Original Vector</p>
                  <p className="text-xs md:text-sm italic leading-relaxed">"{prompt}"</p>
                </div>
                <div className="ultra-glass p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] space-y-3 border-cyan-400/20 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
                  <p className="text-[8px] md:text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em]">Optimized Directive</p>
                  <p className="text-xs md:text-sm font-bold leading-relaxed text-white">"{enhancedPromptDisplay}"</p>
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {generatedImg && (
                <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 md:space-y-12">
                  <div className="relative group ultra-glass rounded-[2.5rem] md:rounded-[4rem] p-3 md:p-4 overflow-hidden aspect-[16/9] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)]">
                    <img src={generatedImg} alt="Neural Export" className="w-full h-full object-cover rounded-[1.8rem] md:rounded-[3.2rem] transition-transform duration-1000 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-4 md:gap-6 px-4">
                      <PremiumButton onClick={() => handleGenerate(null, 'variation')} icon={RefreshCw} className="h-12 md:h-16 w-full max-w-[200px]">Remake</PremiumButton>
                      <PremiumButton onClick={() => handleDownload(generatedImg)} variant="secondary" icon={Download} className="h-12 md:h-16 w-full max-w-[200px]">Download Master</PremiumButton>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
                    <div className="md:col-span-12 lg:col-span-8 space-y-6 md:space-y-8">
                      <div className="ultra-glass p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] space-y-6 relative overflow-hidden bg-gradient-to-br from-cyan-400/5 to-transparent">
                        <h3 className="text-cyan-400 font-black text-[10px] md:text-[11px] uppercase tracking-[0.5em] flex items-center gap-3 md:gap-4">
                          <BookOpen className="w-4 h-4 md:w-5 md:h-5" /> Neural Narrative
                        </h3>
                        {isAnalyzing ? (
                          <div className="flex items-center gap-3 md:gap-4 text-slate-500 font-black uppercase tracking-widest animate-pulse text-[10px]">
                            <Binary className="w-4 h-4 md:w-5 md:h-5" /> Decoding Latent Lore...
                          </div>
                        ) : (
                          <p className="text-slate-200 text-lg md:text-xl leading-relaxed font-serif italic border-l-2 border-cyan-500/20 pl-4 md:pl-8">
                            {imageLore || "Visual stream processing complete. Interpretative layers initializing..."}
                          </p>
                        )}
                      </div>

                      <div className="ultra-glass p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] space-y-4 md:space-y-6">
                        <h4 className="text-slate-500 font-black text-[9px] md:text-[10px] uppercase tracking-[0.4em] flex items-center gap-2 md:gap-3">
                          <Palette className="w-3 h-3 md:w-4 md:h-4 text-purple-400" /> Style Remakes
                        </h4>
                        <div className="flex flex-wrap gap-3 md:gap-4">
                          {suggestedRemixes.length > 0 ? suggestedRemixes.map((remix, i) => (
                            <button key={i} onClick={(e) => handleGenerate(e, 'remix', remix)} className="ultra-glass px-4 md:px-6 py-2 md:py-3 text-[8px] md:text-[9px] rounded-xl font-black uppercase tracking-widest border border-white/5 hover:border-cyan-500/30 transition-all text-slate-400 hover:text-cyan-400">
                              {remix}
                            </button>
                          )) : (
                            <p className="text-[8px] md:text-[10px] text-slate-600 font-black uppercase tracking-widest opacity-40 italic">Awaiting variation analysis...</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-12 lg:col-span-4 flex flex-col gap-6 md:gap-8">
                      <div className="ultra-glass p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] space-y-6 md:space-y-8 flex-grow shadow-[0_0_60px_rgba(139,92,246,0.1)]">
                        <div className="flex items-center justify-between">
                          <h3 className="text-purple-400 font-black text-[9px] md:text-[10px] uppercase tracking-[0.4em]">Fidelity</h3>
                          {critique && (
                            <span className="text-3xl md:text-4xl font-black text-white bg-white/5 px-4 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl border border-white/10 shadow-2xl">
                              {critique.score}
                            </span>
                          )}
                        </div>

                        {isAnalyzing ? (
                          <div className="space-y-4 md:space-y-6">
                            <div className="h-1.5 md:h-2 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ repeat: Infinity, duration: 1.5 }} className="h-full w-1/3 bg-purple-500" />
                            </div>
                            <p className="text-[8px] md:text-[10px] text-slate-600 font-black uppercase tracking-widest text-center">Scanning Geometry...</p>
                          </div>
                        ) : critique ? (
                          <div className="space-y-4 md:space-y-6">
                            <div className="bg-white/5 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/5 space-y-1 md:space-y-2">
                                <span className="text-[8px] md:text-[9px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2"><Layers className="w-3 h-3 md:w-4 md:h-4" /> Composition</span>
                                <p className="text-xs md:text-sm font-bold text-slate-300">{critique.composition}</p>
                            </div>
                            <div className="bg-white/5 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/5 space-y-1 md:space-y-2">
                                <span className="text-[8px] md:text-[9px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2"><ZapIcon className="w-3 h-3 md:w-4 md:h-4" /> Lighting Grid</span>
                                <p className="text-xs md:text-sm font-bold text-slate-300">{critique.lighting}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center opacity-10 py-10"><BarChart3 className="w-12 h-12 md:w-16 md:h-16" /></div>
                        )}
                        <div className="pt-4 md:pt-6 border-t border-white/5 flex items-center gap-3 md:gap-4 text-emerald-500">
                           <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />
                           <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Encrypted Session</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* History Grid - Premium Render */}
          {history.length > 0 && (
            <section className="space-y-8 md:space-y-10">
              <div className="flex items-center justify-between border-b border-white/10 pb-6 md:pb-8">
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter flex items-center gap-3 md:gap-5 uppercase leading-none">
                  <History className="w-6 h-6 md:w-8 md:h-8 text-cyan-500" /> Neural Archive
                </h3>
                <span className="text-[8px] md:text-[10px] font-black uppercase text-slate-600 tracking-[0.5em] hidden sm:block">Persistent History</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-8">
                {history.map(item => (
                  <motion.div key={item.id} whileHover={{ scale: 1.05, y: -5 }} className="group relative ultra-glass p-2 md:p-3 rounded-[1.8rem] md:rounded-[2.5rem] overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt="Past" className="aspect-square object-cover rounded-[1.2rem] md:rounded-[1.8rem] shadow-2xl" loading="lazy" />
                    ) : (
                      <div className="aspect-square bg-slate-800 rounded-[1.2rem] md:rounded-[1.8rem] flex items-center justify-center opacity-20"><ImageIcon className="w-6 h-6 md:w-8 md:h-8" /></div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3 md:gap-4 px-2">
                       {item.image && <button onClick={() => handleDownload(item.image)} className="p-3 md:p-4 bg-white rounded-xl md:rounded-2xl text-slate-950 shadow-2xl scale-75 md:scale-100"><Download className="w-4 h-4 md:w-5 md:h-5" /></button>}
                       <button onClick={() => deleteHistory(item.id)} className="p-3 md:p-4 bg-rose-500 rounded-xl md:rounded-2xl text-white shadow-2xl scale-75 md:scale-100"><Trash2 className="w-4 h-4 md:w-5 md:h-5" /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ✅ AI Disclaimer + Branding Footer */}
      <footer className={`py-12 md:py-20 px-4 md:px-10 transition-colors border-t border-white/5 ${isDarkMode ? 'bg-black/40' : 'bg-white/80'} z-10`}>
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-12 md:gap-16">
          
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="w-full max-w-3xl">
            <div className="ultra-glass p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] flex flex-col md:flex-row items-center gap-6 md:gap-8 text-center md:text-left border-white/20">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20 shadow-inner">
                <Check className="w-6 h-6 md:w-8 md:h-8 text-cyan-500" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] text-cyan-400">AI Safety Protocols</p>
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-bold opacity-60 uppercase tracking-widest">
                  DHAGEN AI utilizes predictive neural networks. Machine error is possible. Verify all high-fidelity data.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 border-t border-white/5 pt-10 md:pt-16 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shadow-2xl">
                <Bot className="text-cyan-400 w-5 h-5" />
              </div>
              <div className="flex flex-col">
                
                <span className="font-black text-sm md:text-base tracking-[0.3em] uppercase opacity-80 text-slate-400 leading-none">DHAGEN Studio</span>
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] opacity-30 mt-1">Render Engine v7.0.0 (Full-Stack)</span>
              </div>
            </div>
            
            
            <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.6em] text-slate-600">
              © 2026 PROXIMA SYSTEMS
            </p>

            <div className="flex items-center gap-4 md:gap-5">
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.5em] opacity-40 hidden sm:block">System Architect</span>
              <span className="text-cyan-400 px-4 md:px-6 py-2.5 md:py-3 bg-cyan-500/5 border border-cyan-500/10 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                Dharam Rathod
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}