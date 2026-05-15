# 📚 Cronograma de Concursos

App PWA para organizar estudos de múltiplos concursos públicos.

**Funcionalidades:**
- Grade semanal interativa
- Controle de horas estudadas
- Revisão espaçada automática (1→3→7→14→30→60 dias)
- Checklist de tópicos por concurso
- Dados em nuvem via Firebase (acesse em qualquer dispositivo)
- Funciona offline (PWA instalável no celular)

---

## 🚀 Configuração passo a passo

### 1. Firebase — criar projeto

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Adicionar projeto"** → dê um nome → criar
3. No menu lateral: **Criação → Firestore Database** → criar → modo produção
4. No menu lateral: **Authentication** → Primeiros passos → habilitar **E-mail/senha**
5. Clique na engrenagem ⚙️ → **Configurações do projeto** → role até **"Seus aplicativos"**
6. Clique em **"</ > Web"** → registre o app → copie o objeto `firebaseConfig`

### 2. Regras de segurança do Firestore

No Firebase Console → Firestore → Regras, cole o conteúdo do arquivo `firestore.rules`.

### 3. Configurar variáveis locais

```bash
cp .env.example .env.local
```

Abra `.env.local` e preencha com as credenciais do Firebase.

### 4. Rodar localmente

```bash
npm install
npm start
```

Acesse: http://localhost:3000

---

## 📦 Subir no GitHub

### Primeira vez

```bash
git init
git add .
git commit -m "feat: cronograma de concursos PWA"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/cronograma-concursos.git
git push -u origin main
```

### Configurar secrets no GitHub

No repositório: **Settings → Secrets and variables → Actions → New repository secret**

Adicione cada variável do `.env.example`:
- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`

### Ativar GitHub Pages

No repositório: **Settings → Pages → Source → GitHub Actions**

### Deploy automático

A cada `git push` na branch `main`, o app é publicado automaticamente!

**URL do app:** `https://SEU_USUARIO.github.io/cronograma-concursos`

---

## 📱 Instalar como app no celular

1. Acesse a URL do app no Chrome (Android) ou Safari (iOS)
2. Android: menu ⋮ → **"Adicionar à tela inicial"**
3. iOS: botão compartilhar → **"Adicionar à Tela de Início"**

O app funciona offline após a primeira visita!

---

## 🛠 Tecnologias

- React 18 + PWA
- Firebase Firestore (banco de dados em nuvem)
- Firebase Authentication (login)
- GitHub Actions (CI/CD automático)
- GitHub Pages (hospedagem gratuita)

---

## 📁 Estrutura do projeto

```
src/
├── components/
│   ├── Auth.js          # Login e cadastro
│   ├── Sidebar.js       # Menu lateral
│   ├── GradeSemanal.js  # Grade da semana
│   ├── Progresso.js     # Gráficos de horas
│   ├── Revisao.js       # Revisão espaçada
│   ├── Topicos.js       # Checklist
│   └── Concursos.js     # Gerenciar concursos
├── contexts/
│   └── AuthContext.js   # Autenticação global
├── firebase/
│   ├── config.js        # Configuração Firebase
│   └── services.js      # Funções de banco de dados
└── styles/
    └── global.css       # Design system
```
