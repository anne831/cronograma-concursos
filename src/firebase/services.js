import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDocs, query, where, orderBy, onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

// ─── CONCURSOS ───────────────────────────────────────────────
export const getConcursos = (userId, callback) => {
  const q = query(collection(db, 'concursos'), where('userId', '==', userId));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

export const addConcurso = (userId, data) =>
  addDoc(collection(db, 'concursos'), { ...data, userId, criadoEm: serverTimestamp() });

export const deleteConcurso = (id) => deleteDoc(doc(db, 'concursos', id));

// ─── SESSÕES DE ESTUDO ───────────────────────────────────────
export const getSessoes = (userId, callback) => {
  const q = query(collection(db, 'sessoes'), where('userId', '==', userId), orderBy('criadoEm', 'desc'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

export const addSessao = (userId, data) =>
  addDoc(collection(db, 'sessoes'), { ...data, userId, criadoEm: serverTimestamp() });

export const updateSessao = (id, data) => updateDoc(doc(db, 'sessoes', id), data);

export const deleteSessao = (id) => deleteDoc(doc(db, 'sessoes', id));

// ─── TÓPICOS / CHECKLIST ─────────────────────────────────────
export const getTopicos = (userId, callback) => {
  const q = query(collection(db, 'topicos'), where('userId', '==', userId));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

export const addTopico = (userId, data) =>
  addDoc(collection(db, 'topicos'), { ...data, userId, concluido: false, criadoEm: serverTimestamp() });

export const toggleTopico = (id, concluido) =>
  updateDoc(doc(db, 'topicos', id), { concluido, concluidoEm: concluido ? serverTimestamp() : null });

export const deleteTopico = (id) => deleteDoc(doc(db, 'topicos', id));

// ─── REVISÕES ESPAÇADAS ──────────────────────────────────────
export const getRevisoes = (userId, callback) => {
  const q = query(collection(db, 'revisoes'), where('userId', '==', userId), orderBy('proximaRevisao'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

export const addRevisao = (userId, topico, concurso, materia) => {
  const agora = new Date();
  const proxima = new Date(agora);
  proxima.setDate(proxima.getDate() + 1);
  return addDoc(collection(db, 'revisoes'), {
    userId, topico, concurso, materia,
    intervalo: 1,
    ultimaRevisao: agora.toISOString(),
    proximaRevisao: proxima.toISOString(),
    criadoEm: serverTimestamp()
  });
};

export const concluirRevisao = (id, intervaloAtual) => {
  const intervalos = [1, 3, 7, 14, 30, 60];
  const idx = intervalos.indexOf(intervaloAtual);
  const proximoIntervalo = idx >= 0 && idx < intervalos.length - 1
    ? intervalos[idx + 1] : 60;
  const proxima = new Date();
  proxima.setDate(proxima.getDate() + proximoIntervalo);
  return updateDoc(doc(db, 'revisoes', id), {
    intervalo: proximoIntervalo,
    ultimaRevisao: new Date().toISOString(),
    proximaRevisao: proxima.toISOString()
  });
};

// ─── HORAS ESTUDADAS ─────────────────────────────────────────
export const getHoras = (userId, callback) => {
  const q = query(collection(db, 'horas'), where('userId', '==', userId), orderBy('data', 'desc'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

export const registrarHoras = (userId, data) =>
  addDoc(collection(db, 'horas'), { ...data, userId, criadoEm: serverTimestamp() });
