'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Egg, 
  Calendar, 
  ShoppingBag, 
  Calculator, 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3,
  Share2, 
  Check, 
  Users, 
  Receipt, 
  ArrowRight, 
  TrendingUp,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  History,
  Archive,
  ChevronDown,
  ChevronUp,
  X,
  ArrowRightLeft
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';

// 4 位核心早餐成員
const CORE_MEMBERS = [
  { id: 'm1', name: 'Mia' },
  { id: 'm2', name: '蝸' },
  { id: 'm4', name: '汶' },
  { id: 'm3', name: '菁' }
];

// 歷史採買紀錄
const INITIAL_PURCHASES = [
  { id: 'p_init', date: '2026-08-01', buyerId: 'm3', amount: 72, eggCount: 9, note: '8/3 前期初始剩餘蛋 (9顆)' },
  { id: 'p1', date: '2026-08-06', buyerId: 'm3', amount: 160, eggCount: 20, note: '菁蛋2盒' },
  { id: 'p2', date: '2026-08-12', buyerId: 'm3', amount: 234, eggCount: 30, note: '菁蛋3盒$234' },
  { id: 'p3', date: '2026-08-25', buyerId: 'm3', amount: 188, eggCount: 20, note: '菁蛋兩盒$188' },
  { id: 'p4', date: '2026-09-02', buyerId: 'm3', amount: 118, eggCount: 20, note: '菁20顆蛋$118' },
  { id: 'p5', date: '2026-09-09', buyerId: 'm3', amount: 180, eggCount: 20, note: '菁蛋2盒' },
  { id: 'p6', date: '2026-09-22', buyerId: 'm3', amount: 210, eggCount: 20, note: '菁蛋2盒$210' },
  { id: 'p7', date: '2026-10-01', buyerId: 'm3', amount: 170, eggCount: 20, note: '菁蛋兩盒$170' }
];

// 特殊損耗（破蛋）
const SPECIAL_DEDUCTIONS = [
  { date: '2026-09-03', count: 1, note: '破一顆蛋' }
];

// 歷史每日消耗 (8/3 ~ 10/7)，並包含 10/7 桃借 2 顆蛋
const INITIAL_CONSUMPTION = {
  '2026-08-03': { m1: 1, m2: 1, m4: 1, m3: 1 },
  '2026-08-04': { m1: 1, m2: 1, m4: 1, m3: 1 },
  '2026-08-05': { m1: 0, m2: 0, m4: 1, m3: 0 },
  '2026-08-06': { m1: 2, m2: 1, m4: 0, m3: 1 },
  '2026-08-07': { m1: 1, m2: 1, m4: 1, m3: 1 },
  '2026-08-10': { m1: 1, m2: 1, m4: 1, m3: 1 },
  '2026-08-11': { m1: 1, m2: 1, m4: 1, m3: 1 },
  '2026-08-12': { m1: 1, m2: 1, m4: 1, m3: 1 },
  '2026-08-13': { m1: 1, m2: 0, m4: 1, m3: 1 },
  '2026-08-14': { m1: 1, m2: 1, m4: 1, m3: 1 },
  '2026-08-17': { m1: 1, m2: 2, m4: 0, m3: 0 },
  '2026-08-18': { m1: 2, m2: 1, m4: 0, m3: 0 },
  '2026-08-19': { m1: 1, m2: 1, m4: 1, m3: 1 },
  '2026-08-20': { m1: 1, m2: 1, m4: 1, m3: 1 },
  '2026-08-21': { m1: 1, m2: 0, m4: 1, m3: 1 },
  '2026-08-24': { m1: 1, m2: 0, m4: 1, m3: 1 },
  '2026-08-25': { m1: 1, m2: 1, m4: 1, m3: 0 },
  '2026-08-26': { m1: 1, m2: 1, m4: 1, m3: 0 },
  '2026-08-27': { m1: 1, m2: 1, m4: 1, m3: 1 },
  '2026-08-28': { m1: 1, m2: 1, m4: 1, m3: 1 },
  '2026-08-31': { m1: 1, m2: 1, m4: 1, m3: 1 },
  '2026-09-01': { m1: 1, m2: 1, m4: 1, m3: 1 },
  '2026-09-02': { m1: 1, m2: 1, m4: 1, m3: 1 },
  '2026-09-03': { m1: 1, m2: 1, m4: 0, m3: 1 },
  '2026-09-04': { m1: 1, m2: 1, m4: 0, m3: 1 },
  '2026-09-07': { m1: 1, m2: 1, m4: 0, m3: 1 },
  '2026-09-08': { m1: 1, m2: 1, m4: 0, m3: 0 },
  '2026-09-09': { m1: 1, m2: 1, m4: 0, m3: 1 },
  '2026-09-10': { m1: 1, m2: 1, m4: 1, m3: 0 },
  '2026-09-11': { m1: 0, m2: 1, m4: 0, m3: 0 },
  '2026-09-14': { m1: 1, m2: 1, m4: 1, m3: 0 },
  '2026-09-15': { m1: 1, m2: 1, m4: 1, m3: 1 },
  '2026-09-16': { m1: 2, m2: 1, m4: 1, m3: 0 },
  '2026-09-17': { m1: 1, m2: 1, m4: 1, m3: 1 },
  '2026-09-18': { m1: 0, m2: 0, m4: 0, m3: 2 },
  '2026-09-22': { m1: 1, m2: 1, m4: 1, m3: 0 },
  '2026-09-23': { m1: 1, m2: 1, m4: 1, m3: 1 },
  '2026-09-24': { m1: 1, m2: 1, m4: 1, m3: 0 },
  '2026-09-29': { m1: 1, m2: 1, m4: 1, m3: 1 },
  '2026-09-30': { m1: 1, m2: 1, m4: 1, m3: 1 },
  '2026-10-01': { m1: 1, m2: 1, m4: 1, m3: 1 },
  '2026-10-02': { m1: 0, m2: 0, m4: 0, m3: 0 },
  '2026-10-05': { m1: 1, m2: 2, m4: 1, m3: 1 },
  '2026-10-06': { m1: 1, m2: 1, m4: 1, m3: 1 },
  '2026-10-07': { m1: 1, m2: 1, m4: 1, m3: 0, other: 2, otherNote: '桃借2顆蛋' }
};

const firebaseConfig = {
  apiKey: "AIzaSyC7kZggUtCbfnx6a1L8koCa5bPiGQMSC40",
  authDomain: "egg-tracker-2e7ea.firebaseapp.com",
  databaseURL: "https://egg-tracker-2e7ea-default-rtdb.firebaseio.com",
  projectId: "egg-tracker-2e7ea",
  storageBucket: "egg-tracker-2e7ea.firebasestorage.app",
  messagingSenderId: "1049461627091",
  appId: "1:1049461627091:web:7ccd56fde75ffc10ec1c26"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default function App() {
  const [activeTab, setActiveTab] = useState('checkin');
  const [selectedDate, setSelectedDate] = useState('2026-10-07');
  
  // Real-time collaborative states
  const [purchases, setPurchases] = useState(INITIAL_PURCHASES);
  const [consumptions, setConsumptions] = useState(INITIAL_CONSUMPTION);
  const [settledHistory, setSettledHistory] = useState([]);
  const [cycleStartDate, setCycleStartDate] = useState('2026-08-01');
  const [initialEggStock, setInitialEggStock] = useState(0);

  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudConnected, setCloudConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Modal & helper states
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  // 採買表單（新增用）
  const [newPurchase, setNewPurchase] = useState({
    buyerId: 'm3',
    amount: '',
    eggCount: '',
    note: ''
  });

  // 採買編輯 Modal 狀態
  const [editingPurchase, setEditingPurchase] = useState(null);

  // AI 輔助與 Toast
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState('');

  const showToast = (msg) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(''), 3000);
  };

  useEffect(() => {
    if (!firebaseAuth || !firestoreDb) return;

    let unsubscribePurchases = () => {};
    let unsubscribeConsumptions = () => {};
    let unsubscribeHistory = () => {};

    const authenticateAndListen = async () => {
      try {
        let userCredential;
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          userCredential = await signInWithCustomToken(firebaseAuth, __initial_auth_token);
        } else {
          userCredential = await signInAnonymously(firebaseAuth);
        }
        
        const user = userCredential.user;
        setCurrentUser(user);
        setCloudConnected(true);

        // 1. 監聽採買清單
        const purchasesCol = collection(firestoreDb, 'artifacts', appId, 'public', 'data', 'purchases');
        unsubscribePurchases = onSnapshot(
          purchasesCol,
          (snapshot) => {
            if (!snapshot.empty) {
              const cloudPurchases = [];
              snapshot.forEach((docSnap) => {
                cloudPurchases.push({ id: docSnap.id, ...docSnap.data() });
              });
              cloudPurchases.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
              setPurchases(cloudPurchases);
            } else {
              INITIAL_PURCHASES.forEach(async (initP) => {
                const docRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'purchases', initP.id);
                await setDoc(docRef, initP);
              });
            }
          },
          (err) => console.error('Purchases sync error:', err)
        );

        // 2. 監聽每日打卡與借還紀錄
        const consumptionsCol = collection(firestoreDb, 'artifacts', appId, 'public', 'data', 'consumptions');
        unsubscribeConsumptions = onSnapshot(
          consumptionsCol,
          (snapshot) => {
            if (!snapshot.empty) {
              const cloudConsumptions = {};
              snapshot.forEach((docSnap) => {
                cloudConsumptions[docSnap.id] = docSnap.data().records || {};
              });
              setConsumptions(cloudConsumptions);
            } else {
              Object.entries(INITIAL_CONSUMPTION).forEach(async ([dateKey, records]) => {
                const docRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'consumptions', dateKey);
                await setDoc(docRef, { date: dateKey, records });
              });
            }
          },
          (err) => console.error('Consumptions sync error:', err)
        );

        // 3. 監聽歷史結算封存
        const historyCol = collection(firestoreDb, 'artifacts', appId, 'public', 'data', 'settlement_history');
        unsubscribeHistory = onSnapshot(
          historyCol,
          (snapshot) => {
            if (!snapshot.empty) {
              const cloudHistory = [];
              snapshot.forEach((docSnap) => {
                cloudHistory.push({ id: docSnap.id, ...docSnap.data() });
              });
              cloudHistory.sort((a, b) => (b.settledAt || '').localeCompare(a.settledAt || ''));
              setSettledHistory(cloudHistory);
            }
          },
          (err) => console.error('History sync error:', err)
        );

      } catch (err) {
        console.error('Firebase Auth/Subscription failed:', err);
        setCloudConnected(false);
      }
    };

    authenticateAndListen();

    return () => {
      unsubscribePurchases();
      unsubscribeConsumptions();
      unsubscribeHistory();
    };
  }, []);

  // ================= 核心計算：分帳與庫存 =================
  const calculations = useMemo(() => {
    // 1. 總採買支出與顆數
    const totalSpent = purchases.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalEggsBought = purchases.reduce((sum, p) => sum + Number(p.eggCount || 0), 0) + initialEggStock;

    // 2. 四位核心成員累積吃蛋數（計入個人分攤）
    const memberEggCounts = {};
    CORE_MEMBERS.forEach(m => { memberEggCounts[m.id] = 0; });

    // 3. 其他同事淨借蛋數（借出為正，還蛋為負；只影響庫存，不計入 4 人分攤）
    let netBorrowedEggs = 0;

    Object.values(consumptions).forEach(daily => {
      if (!daily) return;
      CORE_MEMBERS.forEach(m => {
        if (daily[m.id] !== undefined) {
          memberEggCounts[m.id] += Number(daily[m.id] || 0);
        }
      });
      if (daily.other !== undefined) {
        netBorrowedEggs += Number(daily.other || 0);
      }
    });

    const totalEggsConsumed = Object.values(memberEggCounts).reduce((a, b) => a + b, 0);

    // 4. 特殊耗損 (9/3 破 1 顆)
    const specialLoss = SPECIAL_DEDUCTIONS.reduce((sum, d) => sum + d.count, 0);

    // 5. 冰箱目前剩餘蛋數：買入總量 - 成員吃掉 - 特殊損耗 - 其他人淨借出
    const remainingEggs = Math.max(0, totalEggsBought - totalEggsConsumed - specialLoss - netBorrowedEggs);

    // 平均每顆成本
    const unitPrice = totalEggsConsumed > 0 ? (totalSpent / totalEggsConsumed) : 0;

    // 6. 各成員墊付統計
    const memberPaid = {};
    CORE_MEMBERS.forEach(m => { memberPaid[m.id] = 0; });
    purchases.forEach(p => {
      if (memberPaid[p.buyerId] !== undefined) {
        memberPaid[p.buyerId] += Number(p.amount || 0);
      }
    });

    // 7. 4 人各自應付金額與餘額
    const breakdown = CORE_MEMBERS.map(m => {
      const consumed = memberEggCounts[m.id] || 0;
      const shareRatio = totalEggsConsumed > 0 ? (consumed / totalEggsConsumed) : (1 / CORE_MEMBERS.length);
      const shouldPay = Math.round(totalSpent * shareRatio);
      const paid = memberPaid[m.id] || 0;
      const balance = paid - shouldPay;

      return {
        ...m,
        consumed,
        shareRatio: (shareRatio * 100).toFixed(1),
        shouldPay,
        paid,
        balance
      };
    });

    // 8. 最佳化轉帳路徑 (Greedy)
    const debtors = [];
    const creditors = [];

    breakdown.forEach(b => {
      if (b.balance < 0) {
        debtors.push({ id: b.id, name: b.name, amount: Math.abs(b.balance) });
      } else if (b.balance > 0) {
        creditors.push({ id: b.id, name: b.name, amount: b.balance });
      }
    });

    const transactions = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const settledAmount = Math.min(debtor.amount, creditor.amount);

      if (settledAmount > 0) {
        transactions.push({
          from: debtor.name,
          to: creditor.name,
          amount: Math.round(settledAmount)
        });
      }

      debtor.amount -= settledAmount;
      creditor.amount -= settledAmount;

      if (debtor.amount <= 0.01) dIdx++;
      if (creditor.amount <= 0.01) cIdx++;
    }

    return {
      totalSpent,
      totalEggsBought,
      totalEggsConsumed,
      netBorrowedEggs,
      remainingEggs,
      specialLoss,
      unitPrice,
      breakdown,
      transactions
    };
  }, [purchases, consumptions, initialEggStock]);

  const getTodayEggCount = (memberId) => {
    return consumptions[selectedDate]?.[memberId] ?? 0;
  };

  const getTodayOtherRecord = () => {
    return {
      count: consumptions[selectedDate]?.other ?? 0,
      note: consumptions[selectedDate]?.otherNote ?? ''
    };
  };

  // 更新成員吃蛋數量
  const updateEggCount = async (memberId, delta) => {
    const current = getTodayEggCount(memberId);
    const nextCount = Math.max(0, current + delta);
    const updatedDaily = {
      ...(consumptions[selectedDate] || {}),
      [memberId]: nextCount
    };

    setConsumptions(prev => ({
      ...prev,
      [selectedDate]: updatedDaily
    }));

    syncConsumptionToCloud(selectedDate, updatedDaily);
  };

  // 更新「其他」借/還蛋數量與備註
  const updateOtherEggCount = async (delta, customNote = null) => {
    const current = consumptions[selectedDate]?.other ?? 0;
    const currentNote = consumptions[selectedDate]?.otherNote ?? '';
    const nextCount = current + delta; // 支援正負數（正數借出，負數還入）
    const nextNote = customNote !== null ? customNote : currentNote;

    const updatedDaily = {
      ...(consumptions[selectedDate] || {}),
      other: nextCount,
      otherNote: nextNote
    };

    setConsumptions(prev => ({
      ...prev,
      [selectedDate]: updatedDaily
    }));

    syncConsumptionToCloud(selectedDate, updatedDaily);
  };

  const updateOtherNote = (noteText) => {
    const updatedDaily = {
      ...(consumptions[selectedDate] || {}),
      otherNote: noteText
    };

    setConsumptions(prev => ({
      ...prev,
      [selectedDate]: updatedDaily
    }));

    syncConsumptionToCloud(selectedDate, updatedDaily);
  };

  // 雲端同步輔助函式
  const syncConsumptionToCloud = async (dateKey, data) => {
    if (firestoreDb && currentUser) {
      setIsCloudSyncing(true);
      try {
        const docRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'consumptions', dateKey);
        await setDoc(docRef, { date: dateKey, records: data }, { merge: true });
      } catch (err) {
        console.error('Failed to sync consumption:', err);
      } finally {
        setIsCloudSyncing(false);
      }
    }
  };

  // 快捷填寫 4 人
  const setAllAteEggs = async (count) => {
    const currentDaily = consumptions[selectedDate] || {};
    const updatedDaily = { ...currentDaily };
    CORE_MEMBERS.forEach(m => {
      updatedDaily[m.id] = count;
    });

    setConsumptions(prev => ({
      ...prev,
      [selectedDate]: updatedDaily
    }));

    syncConsumptionToCloud(selectedDate, updatedDaily);
    showToast(`已更新 ${selectedDate} 4 人各吃 ${count} 顆！`);
  };

  // 新增採買
  const handleAddPurchase = async (e) => {
    e.preventDefault();
    if (!newPurchase.amount || Number(newPurchase.amount) <= 0) return;

    const purchaseEntry = {
      id: 'p_' + Date.now(),
      date: selectedDate,
      buyerId: newPurchase.buyerId,
      amount: Number(newPurchase.amount),
      eggCount: Number(newPurchase.eggCount || 0),
      note: newPurchase.note || '日常採買'
    };

    setPurchases(prev => [purchaseEntry, ...prev]);
    setNewPurchase({
      buyerId: 'm3',
      amount: '',
      eggCount: '',
      note: ''
    });

    if (firestoreDb && currentUser) {
      setIsCloudSyncing(true);
      try {
        const docRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'purchases', purchaseEntry.id);
        await setDoc(docRef, purchaseEntry);
        showToast('採買記錄已新增並同步！');
      } catch (err) {
        console.error('Failed to sync purchase:', err);
      } finally {
        setIsCloudSyncing(false);
      }
    } else {
      showToast('採買記錄已新增！');
    }
  };

  // 修改採買紀錄
  const handleSaveEditPurchase = async (e) => {
    e.preventDefault();
    if (!editingPurchase || !editingPurchase.amount || Number(editingPurchase.amount) <= 0) return;

    const updated = {
      ...editingPurchase,
      amount: Number(editingPurchase.amount),
      eggCount: Number(editingPurchase.eggCount || 0),
      note: editingPurchase.note || ''
    };

    setPurchases(prev => prev.map(p => p.id === updated.id ? updated : p));
    setEditingPurchase(null);

    if (firestoreDb && currentUser) {
      setIsCloudSyncing(true);
      try {
        const docRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'purchases', updated.id);
        await setDoc(docRef, updated, { merge: true });
        showToast('採買記錄已修改並同步！');
      } catch (err) {
        console.error('Failed to update purchase in Firestore:', err);
      } finally {
        setIsCloudSyncing(false);
      }
    } else {
      showToast('採買記錄已成功更新！');
    }
  };

  // 刪除採買紀錄
  const handleDeletePurchase = async (id) => {
    setPurchases(prev => prev.filter(p => p.id !== id));

    if (firestoreDb && currentUser) {
      setIsCloudSyncing(true);
      try {
        const docRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'purchases', id);
        await deleteDoc(docRef);
        showToast('已刪除此筆採買記錄！');
      } catch (err) {
        console.error('Failed to delete purchase:', err);
      } finally {
        setIsCloudSyncing(false);
      }
    } else {
      showToast('已刪除此筆採買記錄！');
    }
  };

  // 結清並存檔
  const handleFinalizeAndReset = async () => {
    const archiveRecord = {
      id: 'settle_' + Date.now(),
      settledAt: new Date().toISOString().slice(0, 10),
      startDate: cycleStartDate,
      endDate: selectedDate,
      totalSpent: calculations.totalSpent,
      totalEggsConsumed: calculations.totalEggsConsumed,
      netBorrowedEggs: calculations.netBorrowedEggs,
      remainingEggsCarriedOver: calculations.remainingEggs,
      breakdown: calculations.breakdown,
      transactions: calculations.transactions
    };

    const leftoverStock = calculations.remainingEggs;

    setSettledHistory(prev => [archiveRecord, ...prev]);
    
    // 結餘蛋結轉下一期
    const newInitialPurchase = leftoverStock > 0 ? [{
      id: 'p_carried_' + Date.now(),
      date: selectedDate,
      buyerId: 'm3',
      amount: 0,
      eggCount: leftoverStock,
      note: `上一期結算剩餘繼承 (${leftoverStock}顆)`
    }] : [];

    setPurchases(newInitialPurchase);
    setConsumptions({});
    setCycleStartDate(selectedDate);
    setShowSettleModal(false);

    if (firestoreDb && currentUser) {
      setIsCloudSyncing(true);
      try {
        const histDocRef = doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'settlement_history', archiveRecord.id);
        await setDoc(histDocRef, archiveRecord);

        for (const p of purchases) {
          await deleteDoc(doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'purchases', p.id));
        }
        if (newInitialPurchase.length > 0) {
          await setDoc(doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'purchases', newInitialPurchase[0].id), newInitialPurchase[0]);
        }

        for (const d of Object.keys(consumptions)) {
          await deleteDoc(doc(firestoreDb, 'artifacts', appId, 'public', 'data', 'consumptions', d));
        }

        showToast('🎉 已成功結清！舊帳已存檔，新週期開始！');
      } catch (err) {
        console.error('Failed to reset and archive settlement:', err);
        showToast('結算儲存時發生錯誤');
      } finally {
        setIsCloudSyncing(false);
      }
    } else {
      showToast('🎉 本地已成功結清並存檔，開啟新週期！');
    }
  };

  // AI 快速解析
  const handleAiQuickParse = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiSuccessMsg('');

    setTimeout(async () => {
      const text = aiText.toLowerCase();
      const currentDaily = consumptions[selectedDate] || {};
      const newDaily = { ...currentDaily };
      
      CORE_MEMBERS.forEach(m => {
        const name = m.name.toLowerCase();
        if (text.includes(`${name}沒吃`) || text.includes(`除了${name}`) || text.includes(`${name}請假`) || text.includes(`${name}0`)) {
          newDaily[m.id] = 0;
        } else if (text.includes(`${name}吃2顆`) || text.includes(`${name}吃了2`) || text.includes(`${name}2`)) {
          newDaily[m.id] = 2;
        } else {
          newDaily[m.id] = 1;
        }
      });

      // 判斷是否提及其他借蛋（如「桃借2顆」或「借2顆」）
      const borrowMatch = text.match(/借(\d+)顆/);
      const returnMatch = text.match(/還(\d+)顆/);
      if (borrowMatch) {
        const count = parseInt(borrowMatch[1], 10);
        newDaily.other = (newDaily.other || 0) + count;
        newDaily.otherNote = text.slice(0, 20);
      } else if (returnMatch) {
        const count = parseInt(returnMatch[1], 10);
        newDaily.other = (newDaily.other || 0) - count;
        newDaily.otherNote = text.slice(0, 20);
      }

      setConsumptions(prev => ({
        ...prev,
        [selectedDate]: newDaily
      }));

      syncConsumptionToCloud(selectedDate, newDaily);

      setAiLoading(false);
      setAiSuccessMsg(`✨ 已依文字解析成功更新並同步 ${selectedDate} 的紀錄！`);
      setAiText('');
      setTimeout(() => setAiSuccessMsg(''), 4000);
    }, 350);
  };

  // LINE 結算小卡
  const generateLineMessage = () => {
    const isLow = calculations.remainingEggs <= 5;
    let msg = `🍳 【早餐吃蛋小隊結算清單】 (${selectedDate})\n`;
    msg += `━━━━━━━━━━━━━━━\n`;
    msg += `💰 本期蛋品總支出：NT$ ${calculations.totalSpent}\n`;
    msg += `🥚 4人累計已吃：${calculations.totalEggsConsumed} 顆\n`;
    if (calculations.netBorrowedEggs !== 0) {
      msg += `🔄 其他人累計借蛋：${calculations.netBorrowedEggs > 0 ? `借出 ${calculations.netBorrowedEggs}` : `還入 ${Math.abs(calculations.netBorrowedEggs)}`} 顆\n`;
    }
    msg += `🧺 目前剩餘存量：${calculations.remainingEggs} 顆 ${isLow ? '⚠️ (庫存告急！)' : '✅'}\n`;
    msg += `📊 平均每顆均價：NT$ ${calculations.unitPrice.toFixed(1)} / 顆\n`;
    msg += `━━━━━━━━━━━━━━━\n`;
    msg += `【4位成員吃蛋明細】\n`;
    
    calculations.breakdown.forEach(b => {
      msg += `• ${b.name}: 吃 ${b.consumed} 顆 (${b.shareRatio}%) | 應付 $${b.shouldPay} | 已墊 $${b.paid}\n`;
    });

    msg += `━━━━━━━━━━━━━━━\n`;
    msg += `【🤝 分帳轉帳指引】\n`;
    if (calculations.transactions.length === 0) {
      msg += `🎉 帳目已完全平衡，無人需轉帳！\n`;
    } else {
      calculations.transactions.forEach(t => {
        msg += `👉 ${t.from} ➜ 轉帳給 ${t.to}：NT$ ${t.amount}\n`;
      });
    }
    msg += `━━━━━━━━━━━━━━━\n大家都付清後，即可在 App 點擊「開啟新週期」重新計費！✨`;
    return msg;
  };

  const handleCopyLine = () => {
    const text = generateLineMessage();
    try {
      navigator.clipboard?.writeText(text);
    } catch (e) {
      document.execCommand('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isLowStock = calculations.remainingEggs <= 5;
  const todayOther = getTodayOtherRecord();

  return (
    <div className="min-h-screen bg-amber-50/50 text-stone-800 pb-20 font-sans antialiased">
      {/* Toast 提示 */}
      {feedbackToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-stone-900/90 text-white text-xs px-4 py-2 rounded-2xl shadow-lg backdrop-blur animate-fadeIn">
          {feedbackToast}
        </div>
      )}

      {/* 頂部 Header */}
      <header className="bg-amber-400 border-b border-amber-300/80 sticky top-0 z-20 shadow-sm backdrop-blur">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-amber-500">
              <Egg className="w-6 h-6 fill-amber-400 stroke-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-lg text-amber-950 tracking-tight leading-none">EggMate 吃蛋記帳</h1>
                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  cloudConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`}></span>
                  {cloudConnected ? '雲端即時連線' : '單機模式'}
                </span>
              </div>
              <span className="text-xs text-amber-900/80 font-medium">Mia • 蝸 • 汶 • 菁 + 借蛋動態</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            {isCloudSyncing && (
              <div className="flex items-center gap-1 text-xs text-amber-900 bg-amber-300/60 px-2 py-1 rounded-xl animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span className="text-[10px]">同步中</span>
              </div>
            )}
            {settledHistory.length > 0 && (
              <button
                onClick={() => setShowHistoryModal(true)}
                className="bg-amber-500/30 hover:bg-amber-500/40 px-2 py-1.5 rounded-xl text-xs font-semibold text-amber-950 flex items-center gap-1 transition"
                title="查看過往結算紀錄"
              >
                <History className="w-3.5 h-3.5" />
                <span>歷史({settledHistory.length})</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 主畫面 */}
      <main className="max-w-xl mx-auto px-4 pt-3 space-y-3.5">
        
        {/* 即時庫存警示條 */}
        <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
          isLowStock 
            ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-sm' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
              isLowStock ? 'bg-rose-200/80 text-rose-700' : 'bg-emerald-200/80 text-emerald-700'
            }`}>
              {isLowStock ? <AlertTriangle className="w-4 h-4 animate-bounce" /> : <Egg className="w-4 h-4 fill-emerald-500" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider">目前冰箱剩餘</span>
                <span className={`text-base font-extrabold ${isLowStock ? 'text-rose-700' : 'text-emerald-800'}`}>
                  {calculations.remainingEggs} 顆
                </span>
              </div>
              <p className="text-[11px] opacity-80 leading-tight">
                買入 {calculations.totalEggsBought} • 4人吃 {calculations.totalEggsConsumed} • 他人借蛋 {calculations.netBorrowedEggs} • 損耗 {calculations.specialLoss}
              </p>
            </div>
          </div>

          <span className={`text-[11px] px-2.5 py-1 rounded-xl font-bold ${
            isLowStock ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'
          }`}>
            {isLowStock ? '⚠️ 庫存偏低該補貨' : '充足供應中'}
          </span>
        </div>

        {/* 分頁 Tab 切換 */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-amber-200/50 rounded-2xl border border-amber-200">
          <button
            onClick={() => setActiveTab('checkin')}
            className={`flex items-center justify-center gap-1.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'checkin'
                ? 'bg-white text-amber-900 shadow-sm'
                : 'text-amber-800 hover:text-amber-950'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>每日打卡</span>
          </button>

          <button
            onClick={() => setActiveTab('purchases')}
            className={`flex items-center justify-center gap-1.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'purchases'
                ? 'bg-white text-amber-900 shadow-sm'
                : 'text-amber-800 hover:text-amber-950'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>採買記錄 ({purchases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settlement')}
            className={`flex items-center justify-center gap-1.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'settlement'
                ? 'bg-white text-amber-900 shadow-sm'
                : 'text-amber-800 hover:text-amber-950'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>結算清算</span>
          </button>
        </div>

        {/* ================= TAB 1: 每日打卡 ================= */}
        {activeTab === 'checkin' && (
          <section className="space-y-4">
            <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">打卡日期</span>
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-amber-50 border border-amber-200 text-stone-800 text-sm font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-stone-400">快速填寫：</span>
                  <button
                    type="button"
                    onClick={() => setAllAteEggs(1)}
                    className="px-2.5 py-1 bg-amber-100/70 text-amber-900 hover:bg-amber-200 font-medium rounded-lg transition"
                  >
                    4人各 1 顆
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllAteEggs(0)}
                    className="px-2.5 py-1 bg-stone-100 text-stone-600 hover:bg-stone-200 font-medium rounded-lg transition"
                  >
                    休市 / 0顆
                  </button>
                </div>
                <span className="text-[11px] text-stone-400">
                  當日4人吃：{CORE_MEMBERS.reduce((sum, m) => sum + getTodayEggCount(m.id), 0)} 顆
                </span>
              </div>
            </div>

            {/* AI 自然語言打卡 */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-3xl border border-amber-200/80 shadow-sm space-y-2.5">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>AI 自然語言打卡（支援借蛋語意）</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="例如：今天除了汶沒吃，Mia吃2顆，桃借2顆蛋"
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiQuickParse()}
                  className="flex-1 bg-white border border-amber-200 text-stone-800 text-xs sm:text-sm rounded-2xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-inner"
                />
                <button
                  onClick={handleAiQuickParse}
                  disabled={aiLoading}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-semibold rounded-2xl transition disabled:opacity-50 flex items-center gap-1 shadow-sm shrink-0"
                >
                  {aiLoading ? '解析中...' : '送出'}
                </button>
              </div>
              {aiSuccessMsg && (
                <p className="text-xs text-amber-700 font-medium">{aiSuccessMsg}</p>
              )}
            </div>

            {/* 4 位核心成員打卡卡片 */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider">4 位核心成員打卡（計入早餐分帳）</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CORE_MEMBERS.map(member => {
                  const count = getTodayEggCount(member.id);
                  const isEating = count > 0;

                  return (
                    <div 
                      key={member.id}
                      className={`p-3.5 rounded-3xl border transition-all ${
                        isEating 
                          ? 'bg-white border-amber-300 shadow-sm ring-1 ring-amber-200/50' 
                          : 'bg-stone-50/80 border-stone-200 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isEating ? 'bg-amber-400 text-amber-950' : 'bg-stone-200 text-stone-500'
                          }`}>
                            {member.name.slice(0, 1)}
                          </div>
                          <span className="font-semibold text-stone-800 text-sm">{member.name}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isEating ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-stone-200/60 text-stone-500'
                        }`}>
                          {isEating ? `吃了 ${count} 顆` : '今天沒吃'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-stone-400 font-medium">調整顆數</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateEggCount(member.id, -1)}
                            disabled={count <= 0}
                            className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold flex items-center justify-center transition disabled:opacity-30 disabled:hover:bg-stone-100 active:scale-95"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-bold text-stone-800 text-base">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateEggCount(member.id, 1)}
                            className="w-8 h-8 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold flex items-center justify-center transition shadow-sm active:scale-95"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 功能 1：新增「其他」同事借蛋/還蛋卡片 */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500" />
                  <h2 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">其他同事（借蛋 / 還蛋庫存動態）</h2>
                </div>
                <span className="text-[10px] text-stone-400">只影響庫存，不計入 4 人分攤</span>
              </div>

              <div className="p-4 rounded-3xl bg-indigo-50/70 border border-indigo-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      他
                    </div>
                    <div>
                      <span className="font-bold text-stone-800 text-sm">其他同事借 / 還</span>
                      <p className="text-[11px] text-indigo-800/80">
                        {todayOther.count > 0 
                          ? `當日借出 ${todayOther.count} 顆` 
                          : todayOther.count < 0 
                            ? `當日還回 ${Math.abs(todayOther.count)} 顆` 
                            : '當日無借還紀錄'}
                      </p>
                    </div>
                  </div>

                  {/* 調整借還顆數 (+ 表示借出扣庫存，- 表示還回增庫存) */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateOtherEggCount(-1)}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-800 font-bold text-xs rounded-xl border border-indigo-200 transition shadow-sm"
                      title="還回蛋（庫存加 1）"
                    >
                      還回 +1蛋
                    </button>
                    <span className="w-7 text-center font-bold text-stone-800 text-sm">
                      {todayOther.count > 0 ? `+${todayOther.count}` : todayOther.count}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateOtherEggCount(1)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
                      title="借出蛋（庫存減 1）"
                    >
                      借出 -1蛋
                    </button>
                  </div>
                </div>

                {/* 借還 Memo 備註框 */}
                <div className="pt-2 border-t border-indigo-200/60 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-indigo-900 shrink-0">借還備註：</span>
                  <input
                    type="text"
                    placeholder="如：桃借2顆蛋、大衛還1顆..."
                    value={todayOther.note}
                    onChange={(e) => updateOtherNote(e.target.value)}
                    className="flex-1 bg-white border border-indigo-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  {todayOther.count !== 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updatedDaily = { ...(consumptions[selectedDate] || {}), other: 0, otherNote: '' };
                        setConsumptions(prev => ({ ...prev, [selectedDate]: updatedDaily }));
                        syncConsumptionToCloud(selectedDate, updatedDaily);
                      }}
                      className="text-stone-400 hover:text-stone-600 text-xs px-1.5 py-1"
                      title="清除當日借還"
                    >
                      清除
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= TAB 2: 採買記錄 ================= */}
        {activeTab === 'purchases' && (
          <section className="space-y-4">
            {/* 新增採買表單（含備註欄） */}
            <form onSubmit={handleAddPurchase} className="bg-white p-4 rounded-3xl border border-amber-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-amber-500" />
                  <span>記錄新採買</span>
                </h2>
                <span className="text-xs text-stone-400">送出後全體即時可見</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-stone-500 mb-1 block">誰代墊付款</label>
                  <select
                    value={newPurchase.buyerId}
                    onChange={(e) => setNewPurchase({ ...newPurchase, buyerId: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {CORE_MEMBERS.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-500 mb-1 block">購買金額 (NT$)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="如 170"
                    value={newPurchase.amount}
                    onChange={(e) => setNewPurchase({ ...newPurchase, amount: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-stone-500 mb-1 block">總購買顆數 (顆)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="如 20"
                    value={newPurchase.eggCount}
                    onChange={(e) => setNewPurchase({ ...newPurchase, eggCount: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* 功能 2：採買備註欄 */}
                <div>
                  <label className="text-[11px] font-bold text-stone-500 mb-1 block">店家 / 備註 Memo</label>
                  <input
                    type="text"
                    placeholder="如：全聯菁蛋兩盒、白蛋"
                    value={newPurchase.note}
                    onChange={(e) => setNewPurchase({ ...newPurchase, note: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-sm rounded-2xl shadow-sm transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>新增採買紀錄 (雲端同步)</span>
              </button>
            </form>

            {/* 採買清單（含功能 3：修改標示與刪除鍵） */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">當期採買清單 (共 {purchases.length} 筆)</h3>
              </div>

              {purchases.map(p => {
                const buyer = CORE_MEMBERS.find(m => m.id === p.buyerId);
                return (
                  <div
                    key={p.id}
                    className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-sm flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm shrink-0">
                        {buyer?.name ? buyer.name.slice(0, 1) : '蛋'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-stone-800">{buyer?.name || '公費'} 代墊</span>
                          <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded-md font-semibold">
                            ${p.amount}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {p.date} • {p.eggCount ? `${p.eggCount}顆` : '未標記顆數'} {p.note && `• ${p.note}`}
                        </p>
                      </div>
                    </div>

                    {/* 操作按鈕組：修改標示 + 刪除標示 */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditingPurchase({ ...p })}
                        className="p-2 text-stone-400 hover:text-amber-600 transition rounded-xl hover:bg-amber-50"
                        title="修改這筆採買"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePurchase(p.id)}
                        className="p-2 text-stone-400 hover:text-red-500 transition rounded-xl hover:bg-red-50"
                        title="刪除紀錄"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ================= TAB 3: 結算清算 ================= */}
        {activeTab === 'settlement' && (
          <section className="space-y-4">
            {/* 頂部 4 項指標儀表板 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-white p-3 rounded-2xl border border-amber-100 shadow-sm text-center">
                <span className="text-[11px] font-bold text-stone-400 block">本期總支出</span>
                <span className="text-base font-extrabold text-amber-900 mt-0.5 block">
                  ${calculations.totalSpent}
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-amber-100 shadow-sm text-center">
                <span className="text-[11px] font-bold text-stone-400 block">4人累計吃蛋</span>
                <span className="text-base font-extrabold text-amber-900 mt-0.5 block">
                  {calculations.totalEggsConsumed} <span className="text-xs font-normal">顆</span>
                </span>
              </div>
              <div className={`p-3 rounded-2xl border shadow-sm text-center ${
                isLowStock ? 'bg-rose-50/70 border-rose-200' : 'bg-emerald-50/70 border-emerald-200'
              }`}>
                <span className={`text-[11px] font-bold block ${isLowStock ? 'text-rose-600' : 'text-emerald-700'}`}>
                  目前剩餘
                </span>
                <span className={`text-base font-extrabold mt-0.5 block ${isLowStock ? 'text-rose-700' : 'text-emerald-800'}`}>
                  {calculations.remainingEggs} <span className="text-xs font-normal">顆</span>
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-amber-100 shadow-sm text-center">
                <span className="text-[11px] font-bold text-stone-400 block">平均每顆</span>
                <span className="text-base font-extrabold text-amber-900 mt-0.5 block">
                  ${calculations.unitPrice.toFixed(1)}
                </span>
              </div>
            </div>

            {/* 個人吃蛋統計表 */}
            <div className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">4 人早餐分攤統計</h3>
                  <span className="text-[10px] text-amber-800/70 font-medium">計費週期：{cycleStartDate} ~ {selectedDate}</span>
                </div>
                <span className="text-[11px] text-stone-400">依吃蛋顆數加權應付</span>
              </div>

              <div className="space-y-2.5">
                {calculations.breakdown.map(b => {
                  const isPositive = b.balance > 0;
                  const isZero = b.balance === 0;

                  return (
                    <div 
                      key={b.id}
                      className="p-3 bg-stone-50 rounded-2xl border border-stone-200/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-stone-800">{b.name}</span>
                          <span className="text-stone-400 font-medium">({b.shareRatio}%)</span>
                        </div>
                        <div className="text-stone-500 mt-0.5">
                          吃 <strong className="text-amber-900 font-bold">{b.consumed}</strong> 顆 • 應付 ${b.shouldPay} (已代墊 ${b.paid})
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`font-bold text-sm px-2.5 py-1 rounded-xl inline-block ${
                          isZero 
                            ? 'text-stone-500 bg-stone-200/50' 
                            : isPositive 
                              ? 'text-emerald-700 bg-emerald-100' 
                              : 'text-rose-700 bg-rose-100'
                        }`}>
                          {isZero ? '平衡' : isPositive ? `應收回 +$${b.balance}` : `需轉出 -$${Math.abs(b.balance)}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 顯示借蛋影響提示 */}
              {calculations.netBorrowedEggs !== 0 && (
                <div className="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 flex items-center justify-between">
                  <span>ℹ️ 其他人累計借蛋：{calculations.netBorrowedEggs > 0 ? `借出 ${calculations.netBorrowedEggs} 顆` : `還回 ${Math.abs(calculations.netBorrowedEggs)} 顆`}</span>
                  <span className="text-indigo-600 font-semibold">已精準計入目前庫存</span>
                </div>
              )}
            </div>

            {/* 最佳化轉帳指引 */}
            <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">最佳化轉帳指引</h3>
                </div>
              </div>

              {calculations.transactions.length === 0 ? (
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-center text-xs text-emerald-800 font-medium">
                  🎉 目前所有帳目完美平衡，無需進行任何轉帳！
                </div>
              ) : (
                <div className="space-y-2">
                  {calculations.transactions.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold"
                    >
                      <div className="flex items-center gap-2 text-stone-800">
                        <span className="text-rose-700 font-bold">{t.from}</span>
                        <ArrowRight className="w-4 h-4 text-amber-600" />
                        <span className="text-emerald-700 font-bold">{t.to}</span>
                      </div>
                      <span className="text-amber-950 font-extrabold text-sm bg-amber-200/60 px-2.5 py-1 rounded-xl">
                        NT$ {t.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 操作按鈕 */}
            <div className="space-y-2.5 pt-1">
              <button
                onClick={handleCopyLine}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>已複製到剪貼簿！可直接貼至 LINE</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>一鍵複製 LINE 群組結算小卡</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowSettleModal(true)}
                className="w-full py-3 bg-white hover:bg-amber-100/50 text-amber-900 border border-amber-300 font-bold text-xs sm:text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
              >
                <Archive className="w-4 h-4 text-amber-600" />
                <span>結清並開啟新週期（舊帳存檔歸零）</span>
              </button>
            </div>
          </section>
        )}
      </main>

      {/* ================= 功能 3 彈窗：修改採買紀錄 Modal ================= */}
      {editingPurchase && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveEditPurchase}
            className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3.5 shadow-2xl border border-stone-200 animate-fadeIn"
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-amber-600">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-stone-900 text-base">修改採買紀錄</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPurchase(null)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-500 mb-1 block">代墊人</label>
              <select
                value={editingPurchase.buyerId}
                onChange={(e) => setEditingPurchase({ ...editingPurchase, buyerId: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {CORE_MEMBERS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-stone-500 mb-1 block">採買金額 (NT$)</label>
                <input
                  type="number"
                  min="1"
                  value={editingPurchase.amount}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, amount: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-stone-500 mb-1 block">購買顆數 (顆)</label>
                <input
                  type="number"
                  min="0"
                  value={editingPurchase.eggCount}
                  onChange={(e) => setEditingPurchase({ ...editingPurchase, eggCount: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-500 mb-1 block">備註說明 Memo</label>
              <input
                type="text"
                placeholder="例如：全聯有機蛋兩盒"
                value={editingPurchase.note || ''}
                onChange={(e) => setEditingPurchase({ ...editingPurchase, note: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPurchase(null)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl transition"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow transition"
              >
                儲存變更
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= 結清確認彈窗 ================= */}
      {showSettleModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-stone-200 animate-fadeIn">
            <div className="flex items-center gap-2.5 text-amber-600">
              <div className="w-9 h-9 rounded-2xl bg-amber-100 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">確認結清並重置？</h3>
                <span className="text-xs text-stone-500">此動作會將本期資料存檔備查</span>
              </div>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-2xl text-xs space-y-1.5 text-stone-700 border border-amber-200">
              <p className="font-bold text-amber-950">📋 本期結算歸檔摘要：</p>
              <p>• 週期：{cycleStartDate} ~ {selectedDate}</p>
              <p>• 總支出：NT$ {calculations.totalSpent} (4人共吃 {calculations.totalEggsConsumed} 顆)</p>
              <p>• 剩餘存量：<strong className="text-emerald-700">{calculations.remainingEggs} 顆</strong> (會自動移交給下一期作為初始存量)</p>
              <p className="text-[11px] text-amber-800 pt-1 border-t border-amber-200/60">
                ✨ 結清後，所有人的應付帳目將會歸零，可以開始記錄新的採買與吃蛋！
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowSettleModal(false)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleFinalizeAndReset}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow transition"
              >
                確認結清開啟新期
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 歷史結算紀錄彈窗 ================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col p-5 shadow-2xl border border-stone-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-stone-900 text-base">過往結清歷史紀錄</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold p-1"
              >
                關閉
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-3 flex-1 pr-1">
              {settledHistory.length === 0 ? (
                <p className="text-center text-xs text-stone-400 py-6">尚無任何歷史結清紀錄</p>
              ) : (
                settledHistory.map((hist, idx) => {
                  const isExp = expandedHistoryId === hist.id;
                  return (
                    <div key={hist.id} className="bg-stone-50 rounded-2xl border border-stone-200 p-3 space-y-2 text-xs">
                      <div 
                        className="flex items-center justify-between cursor-pointer select-none"
                        onClick={() => setExpandedHistoryId(isExp ? null : hist.id)}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-800 text-sm">第 {settledHistory.length - idx} 期結算</span>
                            <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                              ${hist.totalSpent}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-400">
                            {hist.startDate} ~ {hist.endDate} (結清於 {hist.settledAt})
                          </span>
                        </div>
                        {isExp ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                      </div>

                      {isExp && (
                        <div className="pt-2 border-t border-stone-200 space-y-2 animate-fadeIn">
                          <p className="text-stone-600 font-medium">
                            • 吃蛋總數：{hist.totalEggsConsumed} 顆 | 結轉庫存：{hist.remainingEggsCarriedOver} 顆
                          </p>
                          <div className="space-y-1 bg-white p-2.5 rounded-xl border border-stone-200/60">
                            <span className="font-bold text-stone-500 block text-[11px]">各成員分攤情況：</span>
                            {hist.breakdown?.map(b => (
                              <div key={b.id} className="flex justify-between text-[11px] text-stone-600">
                                <span>{b.name} (吃 {b.consumed} 顆)</span>
                                <span>應付 ${b.shouldPay} / 代墊 ${b.paid}</span>
                              </div>
                            ))}
                          </div>

                          <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/50">
                            <span className="font-bold text-amber-900 block text-[11px]">轉帳紀錄：</span>
                            {hist.transactions?.length === 0 ? (
                              <p className="text-[11px] text-emerald-700">該期帳目已完全平衡</p>
                            ) : (
                              hist.transactions?.map((t, tIdx) => (
                                <p key={tIdx} className="text-[11px] text-stone-700">
                                  {t.from} ➜ {t.to}：NT$ {t.amount}
                                </p>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl transition"
              >
                關閉歷史面板
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
