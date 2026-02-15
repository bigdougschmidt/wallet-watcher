import { useState, useEffect, useCallback, useRef } from "react";

// ══════════════════════════════════════════════════════════════
//  SUPABASE CONFIG — Replace with your project credentials
// ══════════════════════════════════════════════════════════════
const SUPABASE_URL = "https://gmfzbizhlefxapijqnfh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZnpiaXpobGVmeGFwaWpxbmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzcwODQsImV4cCI6MjA4NjQxMzA4NH0.PKN4l3gZujgSDjAPkwWbNEMt4tbQaqSWIl0H2bfQJ0Q";

// Lightweight Supabase REST client (no SDK needed)
const supabase = {
  headers: {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    Prefer: "return=representation",
  },
  async select(table, query = "") {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: this.headers });
    if (!res.ok) throw new Error(`SELECT ${table}: ${res.statusText}`);
    return res.json();
  },
  async insert(table, rows) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST", headers: this.headers, body: JSON.stringify(rows),
    });
    if (!res.ok) throw new Error(`INSERT ${table}: ${res.statusText}`);
    return res.json();
  },
  async upsert(table, rows) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...this.headers, Prefer: "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify(rows),
    });
    if (!res.ok) throw new Error(`UPSERT ${table}: ${res.statusText}`);
    return res.json();
  },
  async update(table, match, data) {
    const params = Object.entries(match).map(([k, v]) => `${k}=eq.${v}`).join("&");
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
      method: "PATCH", headers: this.headers, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`UPDATE ${table}: ${res.statusText}`);
    return res.json();
  },
  async delete(table, match) {
    const params = Object.entries(match).map(([k, v]) => `${k}=eq.${v}`).join("&");
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
      method: "DELETE", headers: this.headers,
    });
    if (!res.ok) throw new Error(`DELETE ${table}: ${res.statusText}`);
    return true;
  },
};

const isSupabaseConfigured = () =>
  SUPABASE_URL !== "https://YOUR_PROJECT_ID.supabase.co" && SUPABASE_ANON_KEY !== "YOUR_ANON_KEY_HERE";

const APP_LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9InNoaWVsZEdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMWEyODQ3Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iNTAlIiBzdG9wLWNvbG9yPSIjMjEzMjViIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzJhM2Y2ZSIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZXllR3JhZCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMDc4NGMzIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iNTAlIiBzdG9wLWNvbG9yPSIjMDZiNmQ0Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzA3ODRjMyIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iaXJpc0dyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzA2YjZkNCIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwMzY5YTEiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImV0aEdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2ZmZmZmZiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNjN2QyZmUiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8ZmlsdGVyIGlkPSJnbG93Ij4KICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMyIgcmVzdWx0PSJjb2xvcmVkQmx1ciIvPgogICAgICA8ZmVNZXJnZT4KICAgICAgICA8ZmVNZXJnZU5vZGUgaW49ImNvbG9yZWRCbHVyIi8+CiAgICAgICAgPGZlTWVyZ2VOb2RlIGluPSJTb3VyY2VHcmFwaGljIi8+CiAgICAgIDwvZmVNZXJnZT4KICAgIDwvZmlsdGVyPgogICAgPGZpbHRlciBpZD0iaW5uZXJTaGFkb3ciPgogICAgICA8ZmVPZmZzZXQgZHg9IjAiIGR5PSIyIi8+CiAgICAgIDxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjMiLz4KICAgICAgPGZlQ29tcG9zaXRlIG9wZXJhdG9yPSJvdXQiIGluPSJTb3VyY2VHcmFwaGljIi8+CiAgICAgIDxmZUNvbXBvbmVudFRyYW5zZmVyPgogICAgICAgIDxmZUZ1bmNBIHR5cGU9ImxpbmVhciIgc2xvcGU9IjAuMyIvPgogICAgICA8L2ZlQ29tcG9uZW50VHJhbnNmZXI+CiAgICAgIDxmZUJsZW5kIGluPSJTb3VyY2VHcmFwaGljIi8+CiAgICA8L2ZpbHRlcj4KICAgIDxmaWx0ZXIgaWQ9ImRyb3BTaGFkb3ciPgogICAgICA8ZmVEcm9wU2hhZG93IGR4PSIwIiBkeT0iNCIgc3RkRGV2aWF0aW9uPSI4IiBmbG9vZC1jb2xvcj0iIzAwMCIgZmxvb2Qtb3BhY2l0eT0iMC4yNSIvPgogICAgPC9maWx0ZXI+CiAgPC9kZWZzPgoKICA8IS0tIFNoaWVsZCBib2R5IC0tPgogIDxwYXRoIGQ9Ik0yNTYgNDIgTDQ0MCAxMjAgTDQ0MCAyNjAgQzQ0MCAzNjAgMzYwIDQ0MCAyNTYgNDc4IEMxNTIgNDQwIDcyIDM2MCA3MiAyNjAgTDcyIDEyMCBaIgogICAgICAgIGZpbGw9InVybCgjc2hpZWxkR3JhZCkiIGZpbHRlcj0idXJsKCNkcm9wU2hhZG93KSIgc3Ryb2tlPSIjM2E0ZjdhIiBzdHJva2Utd2lkdGg9IjIiLz4KCiAgPCEtLSBTaGllbGQgaW5uZXIgYm9yZGVyIGhpZ2hsaWdodCAtLT4KICA8cGF0aCBkPSJNMjU2IDYyIEw0MjQgMTMyIEw0MjQgMjU4IEM0MjQgMzQ4IDM1MCA0MjIgMjU2IDQ1OCBDMTYyIDQyMiA4OCAzNDggODggMjU4IEw4OCAxMzIgWiIKICAgICAgICBmaWxsPSJub25lIiBzdHJva2U9IiMzYTUwODAiIHN0cm9rZS13aWR0aD0iMS41IiBvcGFjaXR5PSIwLjUiLz4KCiAgPCEtLSBTdWJ0bGUgY2lyY3VpdCBsaW5lcyBvbiBzaGllbGQgLS0+CiAgPGcgb3BhY2l0eT0iMC4wOCIgc3Ryb2tlPSIjMDZiNmQ0IiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiPgogICAgPGxpbmUgeDE9IjEzMCIgeTE9IjE4MCIgeDI9IjIwMCIgeTI9IjE4MCIvPgogICAgPGxpbmUgeDE9IjIwMCIgeTE9IjE4MCIgeDI9IjIwMCIgeTI9IjE1MCIvPgogICAgPGNpcmNsZSBjeD0iMjAwIiBjeT0iMTUwIiByPSIzIiBmaWxsPSIjMDZiNmQ0Ii8+CiAgICA8bGluZSB4MT0iMzEyIiB5MT0iMTcwIiB4Mj0iMzgyIiB5Mj0iMTcwIi8+CiAgICA8bGluZSB4MT0iMzEyIiB5MT0iMTcwIiB4Mj0iMzEyIiB5Mj0iMTQ1Ii8+CiAgICA8Y2lyY2xlIGN4PSIzMTIiIGN5PSIxNDUiIHI9IjMiIGZpbGw9IiMwNmI2ZDQiLz4KICAgIDxsaW5lIHgxPSIxNTAiIHkxPSIzODAiIHgyPSIyMTAiIHkyPSIzODAiLz4KICAgIDxsaW5lIHgxPSIyMTAiIHkxPSIzODAiIHgyPSIyMTAiIHkyPSI0MDAiLz4KICAgIDxsaW5lIHgxPSIzMDIiIHkxPSIzNzUiIHgyPSIzNjIiIHkyPSIzNzUiLz4KICAgIDxsaW5lIHgxPSIzMDIiIHkxPSIzNzUiIHgyPSIzMDIiIHkyPSIzOTUiLz4KICA8L2c+CgogIDwhLS0gRXllIHNoYXBlIC0gb3V0ZXIgLS0+CiAgPHBhdGggZD0iTTEzMCAyNjQgUTI1NiAxNzAgMzgyIDI2NCBRMjU2IDM1OCAxMzAgMjY0IFoiCiAgICAgICAgZmlsbD0idXJsKCNleWVHcmFkKSIgb3BhY2l0eT0iMC4xNSIvPgoKICA8IS0tIEV5ZSBzaGFwZSAtIHN0cm9rZSAtLT4KICA8cGF0aCBkPSJNMTMwIDI2NCBRMjU2IDE3MCAzODIgMjY0IFEyNTYgMzU4IDEzMCAyNjQgWiIKICAgICAgICBmaWxsPSJub25lIiBzdHJva2U9InVybCgjZXllR3JhZCkiIHN0cm9rZS13aWR0aD0iMyIgZmlsdGVyPSJ1cmwoI2dsb3cpIi8+CgogIDwhLS0gSXJpcyBvdXRlciByaW5nIC0tPgogIDxjaXJjbGUgY3g9IjI1NiIgY3k9IjI2NCIgcj0iNTIiIGZpbGw9IiMwYzRhNmUiIHN0cm9rZT0iIzA2YjZkNCIgc3Ryb2tlLXdpZHRoPSIyIi8+CgogIDwhLS0gSXJpcyBncmFkaWVudCBmaWxsIC0tPgogIDxjaXJjbGUgY3g9IjI1NiIgY3k9IjI2NCIgcj0iNDgiIGZpbGw9InVybCgjaXJpc0dyYWQpIiBvcGFjaXR5PSIwLjkiLz4KCiAgPCEtLSBJcmlzIGlubmVyIGRldGFpbCByaW5ncyAtLT4KICA8Y2lyY2xlIGN4PSIyNTYiIGN5PSIyNjQiIHI9IjM2IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMzY5YTEiIHN0cm9rZS13aWR0aD0iMC44IiBvcGFjaXR5PSIwLjUiLz4KICA8Y2lyY2xlIGN4PSIyNTYiIGN5PSIyNjQiIHI9IjI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwYzRhNmUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjQiLz4KCiAgPCEtLSBQdXBpbCAtLT4KICA8Y2lyY2xlIGN4PSIyNTYiIGN5PSIyNjQiIHI9IjE4IiBmaWxsPSIjMGYxNzJhIi8+CgogIDwhLS0gRXRoZXJldW0gZGlhbW9uZCBpbiBwdXBpbCAtLT4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyNTYsIDI2NCkgc2NhbGUoMC43KSIgZmlsbD0idXJsKCNldGhHcmFkKSI+CiAgICA8IS0tIFRvcCBoYWxmIC0tPgogICAgPHBvbHlnb24gcG9pbnRzPSIwLC0xOCAtMTEsMCAwLC01IDExLDAiIG9wYWNpdHk9IjAuOTUiLz4KICAgIDwhLS0gQm90dG9tIGhhbGYgLS0+CiAgICA8cG9seWdvbiBwb2ludHM9IjAsMTggLTExLDAgMCw1IDExLDAiIG9wYWNpdHk9IjAuNyIvPgogIDwvZz4KCiAgPCEtLSBFeWUgaGlnaGxpZ2h0IC8gcmVmbGVjdGlvbiAtLT4KICA8ZWxsaXBzZSBjeD0iMjQyIiBjeT0iMjUwIiByeD0iNyIgcnk9IjkiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuNCIvPgogIDxlbGxpcHNlIGN4PSIyNjgiIGN5PSIyNzUiIHJ4PSIzIiByeT0iNCIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iMC4yIi8+CgogIDwhLS0gU2Nhbm5pbmcgbGluZXMgZW1hbmF0aW5nIGZyb20gZXllIC0tPgogIDxnIG9wYWNpdHk9IjAuMTIiIHN0cm9rZT0iIzA2YjZkNCIgc3Ryb2tlLXdpZHRoPSIxIj4KICAgIDxsaW5lIHgxPSIzODQiIHkxPSIyNjQiIHgyPSI0MjAiIHkyPSIyNDAiLz4KICAgIDxsaW5lIHgxPSIzODQiIHkxPSIyNjQiIHgyPSI0MjAiIHkyPSIyNjQiLz4KICAgIDxsaW5lIHgxPSIzODQiIHkxPSIyNjQiIHgyPSI0MjAiIHkyPSIyODgiLz4KICAgIDxsaW5lIHgxPSIxMjgiIHkxPSIyNjQiIHgyPSI5MiIgeTI9IjI0MCIvPgogICAgPGxpbmUgeDE9IjEyOCIgeTE9IjI2NCIgeDI9IjkyIiB5Mj0iMjY0Ii8+CiAgICA8bGluZSB4MT0iMTI4IiB5MT0iMjY0IiB4Mj0iOTIiIHkyPSIyODgiLz4KICA8L2c+CgogIDwhLS0gVG9wIGFjY2VudCBiYXIgLS0+CiAgPHJlY3QgeD0iMjEwIiB5PSIxMDUiIHdpZHRoPSI5MiIgaGVpZ2h0PSIzIiByeD0iMS41IiBmaWxsPSIjMDZiNmQ0IiBvcGFjaXR5PSIwLjYiLz4KCiAgPCEtLSAiVyIgbW9ub2dyYW0gYXQgdG9wIG9mIHNoaWVsZCAtLT4KICA8dGV4dCB4PSIyNTYiIHk9IjE0NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IidTZWdvZSBVSScsIHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSI3MDAiCiAgICAgICAgZm9udC1zaXplPSI0MiIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC45IiBsZXR0ZXItc3BhY2luZz0iLTEiPlc8L3RleHQ+CgogIDwhLS0gQm90dG9tIGFjY2VudCBiYXIgLS0+CiAgPHJlY3QgeD0iMjIwIiB5PSI0MjAiIHdpZHRoPSI3MiIgaGVpZ2h0PSIyLjUiIHJ4PSIxLjI1IiBmaWxsPSIjMDZiNmQ0IiBvcGFjaXR5PSIwLjQiLz4KPC9zdmc+Cg==";

// ══════════════════════════════════════════════════════════════
//  ETHERSCAN API — Real blockchain data
// ══════════════════════════════════════════════════════════════
const ETHERSCAN_API_KEY = "M6FNGQMSMF9TGRJ1G9E3ENIMJYMZPPCGEC";
const ETHERSCAN_V2_BASE = "https://api.etherscan.io/v2/api"; // V2 (V1 deprecated Aug 2025)
const etherscanFetch = async (params) => {
  const keyParam = ETHERSCAN_API_KEY ? `&apikey=${ETHERSCAN_API_KEY}` : "";
  const url = `${ETHERSCAN_V2_BASE}?chainid=1&${params}${keyParam}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "1") return data.result;
    if (!data.status && data.result) return data.result;
    if (data.status === "0" && Array.isArray(data.result)) return data.result;
    console.warn(`Etherscan NOTOK [${action}]: message=${data.message}, result=${typeof data.result === 'string' ? data.result : JSON.stringify(data.result)}`);
    return null;
  } catch (e) { console.warn("Etherscan API error:", e.message); return null; }
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const API_DELAY = ETHERSCAN_API_KEY ? 250 : 5500; // Rate limit: 5/s with key, 1/5s without

// Fetch real wallet data from Etherscan
const fetchWalletFromChain = async (address) => {
  try {
    // 1) ETH balance (in wei)
    const balanceWei = await etherscanFetch(`module=account&action=balance&address=${address}&tag=latest`);
    const ethBalance = balanceWei ? parseFloat(balanceWei) / 1e18 : 0;

    await delay(API_DELAY);

    // 2) ETH price
    const priceData = await etherscanFetch(`module=stats&action=ethprice`);
    const ethPrice = priceData?.ethusd ? parseFloat(priceData.ethusd) : 0;
    const ethValue = ethBalance * ethPrice;

    await delay(API_DELAY);

    // 3) Transaction count
    const txCountRaw = await etherscanFetch(`module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest`);
    const txnCount = txCountRaw ? (typeof txCountRaw === 'string' && txCountRaw.startsWith('0x') ? parseInt(txCountRaw, 16) : parseInt(txCountRaw) || 0) : 0;

    await delay(API_DELAY);

    // 4) Recent transactions (last 5)
    const txListRaw = await etherscanFetch(`module=account&action=txlist&address=${address}&page=1&offset=5&sort=desc`);
    const transactions = Array.isArray(txListRaw) ? txListRaw.map((tx) => {
      const age = Math.floor((Date.now() / 1000 - parseInt(tx.timeStamp)) / 60);
      const ageStr = age < 60 ? `${age} min ago` : age < 1440 ? `${Math.floor(age / 60)} hr ago` : `${Math.floor(age / 1440)} d ago`;
      const valEth = parseFloat(tx.value) / 1e18;
      const feeEth = (parseFloat(tx.gasUsed) * parseFloat(tx.gasPrice)) / 1e18;
      return {
        hash: tx.hash,
        method: tx.functionName ? tx.functionName.split("(")[0] : (parseFloat(tx.value) > 0 ? "Transfer" : "Contract Call"),
        block: tx.blockNumber,
        age: ageStr,
        from: tx.from.slice(0, 10) + "..." + tx.from.slice(-5),
        to: tx.to ? tx.to.slice(0, 10) + "..." + tx.to.slice(-5) : "Contract Create",
        value: valEth > 0 ? valEth.toFixed(4) + " ETH" : "0 ETH",
        fee: feeEth.toFixed(5),
      };
    }) : [];

    await delay(API_DELAY);

    // 5) ERC-20 token transfers → discover token contracts, then fetch real balances
    const tokenTxsRaw = await etherscanFetch(`module=account&action=tokentx&address=${address}&page=1&offset=200&sort=desc`);
    console.log(`[Chain] Token transfers for ${address.slice(-8)}: type=${typeof tokenTxsRaw}, isArray=${Array.isArray(tokenTxsRaw)}, length=${Array.isArray(tokenTxsRaw) ? tokenTxsRaw.length : 'N/A'}`);
    const tokenContracts = {};
    if (Array.isArray(tokenTxsRaw)) {
      for (const tx of tokenTxsRaw) {
        const sym = tx.tokenSymbol;
        if (!sym || sym.length > 10) continue; // skip spam tokens with long names
        if (!tokenContracts[sym]) {
          tokenContracts[sym] = { symbol: sym, name: tx.tokenName || sym, decimals: parseInt(tx.tokenDecimal) || 18, contractAddress: tx.contractAddress };
        }
      }
    }
    console.log(`[Chain] Discovered ${Object.keys(tokenContracts).length} unique tokens:`, Object.keys(tokenContracts).join(", "));

    // Hardcoded prices for major tokens (fallback for tokens without a price feed)
    const KNOWN_PRICES = {
      USDC: 1.0, USDT: 1.0, DAI: 1.0, LINK: 15.5, UNI: 13.5, AAVE: 170, WETH: ethPrice,
      WBTC: 65000, MATIC: 0.58, ARB: 1.1, OP: 3.2, APE: 1.1, SHIB: 0.000025, PEPE: 0.000015,
      LDO: 2.8, RPL: 30, MKR: 3200, SNX: 3.5, CRV: 0.9, COMP: 85, SUSHI: 1.8, BAL: 4.5,
      ENS: 35, GRT: 0.25, FET: 2.3, RNDR: 10, IMX: 2.5, SAND: 0.55, MANA: 0.6, AXS: 9,
      ALT: 0.03, BLUR: 0.18, DYDX: 1.1, YGG: 0.55, PENDLE: 4.5, SSV: 25,
    };

    // Fetch actual on-chain balance for each discovered token (up to 10 tokens)
    const tokenList = Object.values(tokenContracts).slice(0, 10);
    console.log(`[Chain] Fetching balances for ${tokenList.length} tokens...`);
    const erc20Tokens = [];
    for (const tkn of tokenList) {
      await delay(API_DELAY);
      try {
        const rawBal = await etherscanFetch(`module=account&action=tokenbalance&contractaddress=${tkn.contractAddress}&address=${address}&tag=latest`);
        const bal = rawBal ? parseFloat(rawBal) / Math.pow(10, tkn.decimals) : 0;
        console.log(`[Chain] ${tkn.symbol}: rawBal=${rawBal ? String(rawBal).slice(0, 20) : 'null'}, bal=${bal.toFixed(4)}, price=${KNOWN_PRICES[tkn.symbol] || 0}`);
        if (bal > 0.001) {
          const price = KNOWN_PRICES[tkn.symbol] || 0;
          erc20Tokens.push({ symbol: tkn.symbol, name: tkn.name, qty: parseFloat(bal.toFixed(6)), price, value: parseFloat((bal * price).toFixed(2)), change: 0 });
        }
      } catch (e) { console.warn(`[Chain] Token balance error for ${tkn.symbol}:`, e.message); }
    }
    erc20Tokens.sort((a, b) => b.value - a.value);

    const allTokens = [
      { symbol: "ETH", name: "Ethereum", qty: parseFloat(ethBalance.toFixed(6)), price: ethPrice, value: parseFloat(ethValue.toFixed(2)), change: 0 },
      ...erc20Tokens,
    ];
    const totalUsd = allTokens.reduce((s, t) => s + t.value, 0);
    console.log(`[Chain] Final: ETH=${ethBalance.toFixed(6)}, erc20Tokens=${erc20Tokens.length}, totalUsd=$${totalUsd.toFixed(2)}, txns=${transactions.length}, txnCount=${txnCount}`);

    return {
      ethBalance: parseFloat(ethBalance.toFixed(6)),
      ethValue: parseFloat(ethValue.toFixed(2)),
      ethPrice,
      totalUsd: parseFloat(totalUsd.toFixed(2)),
      txnCount: Math.max(txnCount, transactions.length),
      tokens: allTokens,
      transactions,
      change24h: 0,
      lastUpdated: "Just now",
    };
  } catch (err) {
    console.error("fetchWalletFromChain error:", err);
    return null;
  }
};

// Batch fetch ETH balances + price for all wallets (fast — only 2 API calls)
const fetchQuickRefresh = async (addresses) => {
  try {
    const balances = await etherscanFetch(`module=account&action=balancemulti&address=${addresses.join(",")}&tag=latest`);
    await delay(API_DELAY);
    const priceData = await etherscanFetch(`module=stats&action=ethprice`);
    const ethPrice = priceData?.ethusd ? parseFloat(priceData.ethusd) : 0;

    const balanceMap = {};
    if (Array.isArray(balances)) {
      for (const b of balances) {
        balanceMap[b.account.toLowerCase()] = parseFloat(b.balance) / 1e18;
      }
    }
    return { balanceMap, ethPrice };
  } catch (err) {
    console.error("fetchQuickRefresh error:", err);
    return null;
  }
};

const CHAINS = ["Ethereum", "Polygon", "BSC", "Arbitrum", "Optimism"];
const formatUsd = (n) => "$" + (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const validateAddress = (addr) => {
  const a = addr.trim();
  return /^0x[a-fA-F0-9]{40}$/i.test(a) || /^[a-fA-F0-9]{40}$/.test(a);
};
const normalizeAddress = (addr) => {
  const a = addr.trim();
  if (/^[a-fA-F0-9]{40}$/.test(a)) return "0x" + a;
  if (/^0X/.test(a)) return "0x" + a.slice(2);
  return a;
};

const EthIcon = () => (
  <svg width="12" height="12" viewBox="0 0 256 417" style={{ verticalAlign: "middle", marginRight: 4 }}>
    <path fill="#343434" d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" />
    <path fill="#8C8C8C" d="M127.962 0L0 212.32l127.962 75.639V154.158z" />
    <path fill="#3C3C3B" d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.601L256 236.587z" />
    <path fill="#8C8C8C" d="M127.962 416.905v-104.72L0 236.585z" />
  </svg>
);
const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2" strokeLinecap="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const TrashIcon = ({ color = "#6c757d", size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const WalletIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="5" width="22" height="16" rx="2" /><path d="M16 12h.01" /><path d="M1 10h22" />
  </svg>
);
const CheckCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2.5" strokeLinecap="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const EyeIcon = ({ size = 13, color = "#6c757d" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = ({ size = 13, color = "#6c757d" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// ── MASKED ADDRESS COMPONENT ──
// Blurs all characters except the last 10, with a toggle to reveal the full address
function MaskedAddress({ address, mono = true, linkStyle = false, fontSize = 13 }) {
  const [revealed, setRevealed] = useState(false);
  if (!address) return null;
  const visibleCount = 10;
  const hiddenPart = address.slice(0, -visibleCount);
  const visiblePart = address.slice(-visibleCount);

  const baseStyle = {
    fontFamily: mono ? "'Roboto Mono', monospace" : "inherit",
    fontSize,
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    color: linkStyle ? "#0784c3" : "#1e2022",
    cursor: linkStyle ? "pointer" : "default",
  };

  return (
    <span style={baseStyle}>
      {revealed ? (
        <span>{address}</span>
      ) : (
        <span>
          <span style={{
            filter: "blur(4.5px)",
            WebkitFilter: "blur(4.5px)",
            userSelect: "none",
            pointerEvents: "none",
            opacity: 0.6,
            letterSpacing: "-0.02em",
          }}>{hiddenPart}</span>
          <span>{visiblePart}</span>
        </span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); setRevealed(!revealed); }}
        title={revealed ? "Hide address" : "Reveal full address"}
        style={{
          background: "none", border: "1px solid transparent", cursor: "pointer",
          padding: "2px 3px", borderRadius: 4, display: "inline-flex", alignItems: "center",
          transition: "all 0.15s", flexShrink: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#e9ecef"; e.currentTarget.style.borderColor = "#d1d5db"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "transparent"; }}
      >
        {revealed ? <EyeOffIcon size={12} /> : <EyeIcon size={12} />}
      </button>
    </span>
  );
}

function Toast({ message, type, visible }) {
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999,
      padding: "12px 20px", borderRadius: 10, fontSize: 13.5, fontWeight: 500,
      display: "flex", alignItems: "center", gap: 8,
      boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
      transform: visible ? "translateY(0)" : "translateY(-20px)",
      opacity: visible ? 1 : 0,
      transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
      pointerEvents: visible ? "auto" : "none",
      ...(type === "success" ? { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" } :
        type === "danger" ? { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" } :
        { background: "#e0f2fe", color: "#075985", border: "1px solid #7dd3fc" }),
    }}>
      {type === "success" && <CheckCircle />}
      {type === "danger" && <span style={{ fontSize: 16 }}>🗑</span>}
      {message}
    </div>
  );
}

function DeleteModal({ wallet, onConfirm, onCancel }) {
  if (!wallet) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)",
    }} onClick={onCancel}>
      <div style={{
        background: "#fff", borderRadius: 14, width: "100%", maxWidth: 440, overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", animation: "modalIn 0.2s ease",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: "18px 24px", borderBottom: "1px solid #e9ecef",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", background: "#fee2e2",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}><TrashIcon color="#dc3545" size={18} /></div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1e2022" }}>Remove Wallet</span>
          </div>
          <button onClick={onCancel} style={{
            background: "none", border: "none", fontSize: 20, color: "#6c757d", cursor: "pointer",
            width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <p style={{ fontSize: 14, color: "#495057", lineHeight: 1.6, margin: "0 0 16px" }}>
            Are you sure you want to remove <strong>{wallet.label}</strong> from your watchlist? This action cannot be undone.
          </p>
          <div style={{ background: "#f8f9fa", border: "1px solid #e9ecef", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 13, color: "#6c757d", marginBottom: 4 }}>Wallet Address</div>
            <div style={{ fontSize: 13, color: "#1e2022" }}><span style={{ fontFamily: "'Roboto Mono', monospace" }}>...{wallet.address.slice(-7)}</span></div>
            <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: "#6c757d", textTransform: "uppercase", letterSpacing: "0.04em" }}>Balance</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2022" }}>{formatUsd(wallet.totalUsd)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#6c757d", textTransform: "uppercase", letterSpacing: "0.04em" }}>ETH</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2022" }}>{(wallet.ethBalance || 0).toFixed(4)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#6c757d", textTransform: "uppercase", letterSpacing: "0.04em" }}>Chain</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1e2022" }}>{wallet.chain}</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{
          padding: "16px 24px", borderTop: "1px solid #e9ecef",
          display: "flex", justifyContent: "flex-end", gap: 10, background: "#f8f9fa",
        }}>
          <button onClick={onCancel} style={{
            padding: "9px 20px", fontSize: 13.5, fontWeight: 500, color: "#495057", background: "#fff",
            border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            padding: "9px 20px", fontSize: 13.5, fontWeight: 600, color: "#fff", background: "#dc3545",
            border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 6,
          }}><TrashIcon color="#fff" size={14} /> Remove Wallet</button>
        </div>
      </div>
    </div>
  );
}

export default function WalletWatcher() {
  const [view, setView] = useState("watchlist");
  const [wallets, setWallets] = useState([]);
  const [liveEthPrice, setLiveEthPrice] = useState(0);
  const [tickerPrices, setTickerPrices] = useState({});

  // Derive live ETH price from wallet data
  useEffect(() => {
    for (const w of wallets) {
      const eth = w.tokens?.find((t) => t.symbol === "ETH");
      if (eth && eth.price > 0) { setLiveEthPrice(eth.price); return; }
    }
  }, [wallets]);

  // Fetch crypto ticker prices on mount and every 60 seconds
  useEffect(() => {
    const TICKER_COINS = "bitcoin,ethereum,solana,ripple,dogecoin,matic-network,uniswap,shiba-inu";
    const TICKER_MAP = { bitcoin: "BTC", ethereum: "ETH", solana: "SOL", ripple: "XRP", dogecoin: "DOGE", "matic-network": "MATIC", uniswap: "UNI", "shiba-inu": "SHIB" };
    const fetchTicker = async () => {
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${TICKER_COINS}&vs_currencies=usd&include_24hr_change=true`);
        if (!res.ok) return;
        const data = await res.json();
        const prices = {};
        for (const [id, info] of Object.entries(data)) {
          const sym = TICKER_MAP[id];
          if (sym) prices[sym] = { price: info.usd, change: info.usd_24h_change || 0 };
        }
        setTickerPrices(prices);
        if (prices.ETH?.price) setLiveEthPrice(prices.ETH.price);
      } catch (e) { /* ignore */ }
    };
    fetchTicker();
    const id = setInterval(fetchTicker, 60000);
    return () => clearInterval(id);
  }, []);
  // Set favicon to app logo
  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']") || document.createElement("link");
    link.rel = "icon"; link.type = "image/svg+xml"; link.href = APP_LOGO;
    document.head.appendChild(link);
  }, []);

  const [storageReady, setStorageReady] = useState(false);
  const [dbStatus, setDbStatus] = useState("loading"); // "loading" | "connected" | "local" | "offline"
  const prevBalancesRef = useRef({});
  const [balanceDir, setBalanceDir] = useState({});

  // ── SUPABASE: Convert DB row to app wallet object ──
  const dbRowToWallet = (row, tokens = [], transactions = []) => ({
    id: row.id, address: row.address, label: row.label, chain: row.chain || "Ethereum",
    totalUsd: parseFloat(row.total_usd) || 0, ethBalance: parseFloat(row.eth_balance) || 0,
    ethValue: parseFloat(row.eth_value) || 0, change24h: parseFloat(row.change_24h) || 0,
    txnCount: row.txn_count || 0,
    tokens: tokens.map((t) => ({
      symbol: t.symbol, name: t.name, qty: parseFloat(t.qty) || 0,
      price: parseFloat(t.price) || 0, value: parseFloat(t.value) || 0, change: parseFloat(t.change) || 0,
    })),
    transactions, lastUpdated: row.last_updated || "Never",
  });

  const walletToDbRow = (w) => ({
    id: w.id, address: w.address, label: w.label, chain: w.chain,
    total_usd: w.totalUsd, eth_balance: w.ethBalance, eth_value: w.ethValue,
    change_24h: w.change24h, txn_count: w.txnCount, last_updated: w.lastUpdated,
  });

  const tokenToDbRow = (t, walletId) => ({
    wallet_id: walletId, symbol: t.symbol, name: t.name,
    qty: t.qty, price: t.price, value: t.value, change: t.change,
  });

  // ── LOCAL STORAGE helpers ──
  const localSave = async (key, data) => {
    try { localStorage.setItem(`ww_${key}`, JSON.stringify(data)); } catch (e) {}
  };
  const localLoad = async (key) => {
    try {
      const raw = localStorage.getItem(`ww_${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  };

  // ── DUAL-MODE: Try Supabase, fall back to local storage ──
  // Known demo wallet addresses to purge from DB (legacy from initial development)
  const DEMO_ADDRESSES = new Set([
    "0x742d35cc6634c0532925a3b844bc9e7595f2bd18",
    "0xab5801a7d398351b8be11c439e05c5b3259aec9b",
    "0x1234567890abcdef1234567890abcdef12345678",
  ]);

  useEffect(() => {
    const loadData = async () => {
      // 1) Try Supabase first
      if (isSupabaseConfigured()) {
        try {
          const dbWallets = await supabase.select("wallets", "order=created_at.asc");
          if (dbWallets.length > 0) {
            // Purge any legacy demo wallets from DB
            const demoWallets = dbWallets.filter((r) => DEMO_ADDRESSES.has(r.address.toLowerCase()));
            for (const dw of demoWallets) {
              try { await supabase.delete("tokens", { wallet_id: dw.id }); } catch (e) {}
              try { await supabase.delete("wallets", { id: dw.id }); } catch (e) {}
            }
            // Load only real wallets
            const realWallets = dbWallets.filter((r) => !DEMO_ADDRESSES.has(r.address.toLowerCase()));
            if (realWallets.length > 0) {
              const dbTokens = await supabase.select("tokens", "order=id.asc");
              const loaded = realWallets.map((row) => {
                const wTokens = dbTokens.filter((t) => t.wallet_id === row.id);
                return dbRowToWallet(row, wTokens, []);
              });
              setWallets(loaded);
            }
          }
          setDbStatus("connected");
          setStorageReady(true);
          return;
        } catch (e) {
          console.warn("Supabase unavailable, trying local storage:", e.message);
        }
      }

      // 2) Fall back to localStorage
      const localWallets = await localLoad("wallets");
      if (localWallets && Array.isArray(localWallets) && localWallets.length > 0) {
        setWallets(localWallets);
      }
      setDbStatus(typeof localStorage !== "undefined" ? "local" : "offline");
      setStorageReady(true);
    };
    loadData();
    // Load alerts from Supabase
    (async () => {
      if (isSupabaseConfigured()) {
        try {
          const dbAlerts = await supabase.select("alerts", "order=created_at.asc");
          if (dbAlerts.length > 0) {
            setAlerts(dbAlerts.map((a) => ({
              id: a.id, walletLabel: a.wallet_label, address: a.address,
              type: a.type, threshold: a.threshold, active: a.active,
            })));
          }
        } catch (e) { console.warn("Failed to load alerts:", e.message); }
      }
    })();
  }, []);

  // ── LOCAL: Auto-save wallets to local storage when in local/offline mode ──
  useEffect(() => {
    if (!storageReady || dbStatus === "connected") return;
    localSave("wallets", wallets);
  }, [wallets, storageReady, dbStatus]);

  // ── SUPABASE: Save wallet to database ──
  const saveWalletToDb = useCallback(async (wallet) => {
    if (dbStatus !== "connected") return;
    try {
      await supabase.upsert("wallets", [walletToDbRow(wallet)]);
      try { await supabase.delete("tokens", { wallet_id: wallet.id }); } catch (e) {}
      if (wallet.tokens.length > 0) {
        try { await supabase.insert("tokens", wallet.tokens.map((t) => tokenToDbRow(t, wallet.id))); } catch (e) {}
      }
    } catch (e) { console.warn("Save wallet failed:", e.message); }
  }, [dbStatus]);

  // ── SUPABASE: Batch save all wallets ──
  const saveAllWalletsToDb = useCallback(async (walletList) => {
    if (dbStatus !== "connected") return;
    try {
      await supabase.upsert("wallets", walletList.map(walletToDbRow));
      // Delete-then-insert for tokens (no composite unique key for upsert)
      for (const w of walletList) {
        try { await supabase.delete("tokens", { wallet_id: w.id }); } catch (e) {}
        if (w.tokens.length > 0) {
          try { await supabase.insert("tokens", w.tokens.map((t) => tokenToDbRow(t, w.id))); } catch (e) {}
        }
      }
    } catch (e) { console.warn("Batch save failed:", e.message); }
  }, [dbStatus]);

  // ── SUPABASE: Delete wallet from database ──
  const deleteWalletFromDb = useCallback(async (walletId) => {
    if (dbStatus !== "connected") return;
    try {
      await supabase.delete("tokens", { wallet_id: walletId });
      await supabase.delete("wallets", { id: walletId });
    } catch (e) { console.warn("Delete wallet failed:", e.message); }
  }, [dbStatus]);

  // ── DUAL: Record history snapshot (Supabase or local) ──
  const lastSnapshotRef = useRef(0);
  const recordSnapshot = useCallback(async (walletList) => {
    const now = Date.now();
    if (now - lastSnapshotRef.current < 10000) return;
    lastSnapshotRef.current = now;

    const portfolioTotal = walletList.reduce((s, w) => s + w.totalUsd, 0);
    const snapData = {
      timestamp: new Date().toISOString(), portfolioTotal,
      wallets: walletList.map((w) => ({
        id: w.id, label: w.label, address: w.address, totalUsd: w.totalUsd,
        ethBalance: w.ethBalance, ethValue: w.ethValue, change24h: w.change24h,
        tokens: w.tokens.map((t) => ({ symbol: t.symbol, price: t.price, value: t.value })),
      })),
    };

    if (dbStatus === "connected") {
      // Write to Supabase relational tables
      try {
        const [snapshot] = await supabase.insert("snapshots", [{ portfolio_total: portfolioTotal }]);
        const walletSnaps = walletList.map((w) => ({
          snapshot_id: snapshot.id, wallet_id: w.id, label: w.label, address: w.address,
          total_usd: w.totalUsd, eth_balance: w.ethBalance, eth_value: w.ethValue, change_24h: w.change24h,
        }));
        const insertedWSnaps = await supabase.insert("wallet_snapshots", walletSnaps);
        const tokenSnaps = insertedWSnaps.flatMap((ws) => {
          const wallet = walletList.find((w) => w.id === ws.wallet_id);
          if (!wallet) return [];
          return wallet.tokens.map((t) => ({ wallet_snapshot_id: ws.id, symbol: t.symbol, price: t.price, value: t.value }));
        });
        if (tokenSnaps.length > 0) await supabase.insert("token_snapshots", tokenSnaps);
      } catch (e) { console.warn("Snapshot to Supabase failed:", e.message); }
    } else {
      // Write to local storage
      let history = (await localLoad("history")) || [];
      history.push(snapData);
      if (history.length > 500) history = history.slice(-500);
      await localSave("history", history);
    }
  }, [dbStatus]);

  // Track balance direction changes
  useEffect(() => {
    const prev = prevBalancesRef.current;
    const dirs = {};
    wallets.forEach((w) => {
      if (prev[w.id] !== undefined && w.totalUsd !== prev[w.id]) {
        dirs[w.id] = w.totalUsd > prev[w.id] ? "up" : "down";
      } else if (prev[w.id] !== undefined) {
        dirs[w.id] = balanceDir[w.id] || null;
      }
    });
    setBalanceDir(dirs);
    const newPrev = {};
    wallets.forEach((w) => { newPrev[w.id] = w.totalUsd; });
    prevBalancesRef.current = newPrev;
  }, [wallets]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [detailTab, setDetailTab] = useState("transactions");
  const [addForm, setAddForm] = useState({ address: "", label: "", chain: "Ethereum" });
  const [addError, setAddError] = useState("");
  const [copied, setCopied] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [showNewAlert, setShowNewAlert] = useState(false);
  const [newAlertForm, setNewAlertForm] = useState({ walletId: "", type: "Balance drops below", threshold: "" });
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ address: "", label: "" });

  const startEditing = () => {
    if (!selectedWallet) return;
    setEditForm({ address: selectedWallet.address, label: selectedWallet.label });
    setEditing(true);
  };

  const saveEdit = () => {
    const addr = editForm.address.trim();
    if (!validateAddress(addr)) { showToast("Invalid wallet address", "error"); return; }
    const normalized = normalizeAddress(addr);
    if (wallets.some((wl) => wl.id !== selectedWallet.id && wl.address.toLowerCase() === normalized.toLowerCase())) {
      showToast("Address already on watchlist", "error"); return;
    }
    const trimmedEditLabel = editForm.label.trim() || normalized.slice(0, 8) + "...";
    if (wallets.some((wl) => wl.id !== selectedWallet.id && wl.label.toLowerCase() === trimmedEditLabel.toLowerCase())) {
      showToast("A wallet with this nickname already exists", "error"); return;
    }
    const updated = {
      ...selectedWallet,
      address: normalized,
      label: trimmedEditLabel,
    };
    setWallets((prev) => {
      const updatedList = prev.map((wl) => wl.id === updated.id ? updated : wl);
      recordSnapshot(updatedList);
      return updatedList;
    });
    saveWalletToDb(updated);
    setSelectedWallet(updated);
    setEditing(false);
    showToast("Wallet updated", "success");
  };

  const cancelEdit = () => setEditing(false);
  const [sortOrder, setSortOrder] = useState("default"); // "default" | "desc" | "asc"

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2800);
  }, []);

  const totalPortfolio = wallets.reduce((s, w) => s + (w.totalUsd || 0), 0);
  const totalEth = wallets.reduce((s, w) => s + (w.ethBalance || 0), 0);

  const sortedWallets = sortOrder === "default" ? wallets :
    [...wallets].sort((a, b) => sortOrder === "desc" ? b.totalUsd - a.totalUsd : a.totalUsd - b.totalUsd);

  const cycleSortOrder = () => setSortOrder((prev) => prev === "default" ? "desc" : prev === "desc" ? "asc" : "default");
  const sortLabel = sortOrder === "default" ? "" : sortOrder === "desc" ? ": High→Low" : ": Low→High";

  const [refreshing, setRefreshing] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(60);
  const REFRESH_OPTIONS = [30, 60, 120, 300];

  // Fetch real blockchain data for all wallets (quick mode: balance + price only)
  const refreshWalletData = useCallback(async (walletList) => {
    const addresses = walletList.map((w) => w.address);
    const result = await fetchQuickRefresh(addresses);
    if (!result) return walletList; // API failed, keep existing data
    const { balanceMap, ethPrice } = result;
    const updated = [];
    for (const w of walletList) {
      const newEthBalance = balanceMap[w.address.toLowerCase()] ?? w.ethBalance;
      const newEthValue = newEthBalance * ethPrice;
      // Update ETH token in tokens array
      const updatedTokens = w.tokens.length > 0
        ? w.tokens.map((t) => t.symbol === "ETH"
          ? { ...t, qty: parseFloat(newEthBalance.toFixed(6)), price: ethPrice, value: parseFloat(newEthValue.toFixed(2)) }
          : t)
        : [{ symbol: "ETH", name: "Ethereum", qty: parseFloat(newEthBalance.toFixed(6)), price: ethPrice, value: parseFloat(newEthValue.toFixed(2)), change: 0 }];
      const newTotalUsd = updatedTokens.reduce((s, t) => s + t.value, 0);
      const prevTotal = w.totalUsd || 0;
      const newChange24h = prevTotal > 0 ? parseFloat((((newTotalUsd - prevTotal) / prevTotal) * 100).toFixed(2)) : 0;
      // Fetch transactions if missing
      let txns = w.transactions;
      if (!txns || txns.length === 0) {
        try {
          await delay(API_DELAY);
          const txListRaw = await etherscanFetch(`module=account&action=txlist&address=${w.address}&page=1&offset=5&sort=desc`);
          txns = Array.isArray(txListRaw) ? txListRaw.map((tx) => {
            const age = Math.floor((Date.now() / 1000 - parseInt(tx.timeStamp)) / 60);
            const ageStr = age < 60 ? `${age} min ago` : age < 1440 ? `${Math.floor(age / 60)} hr ago` : `${Math.floor(age / 1440)} d ago`;
            const valEth = parseFloat(tx.value) / 1e18;
            const feeEth = (parseFloat(tx.gasUsed) * parseFloat(tx.gasPrice)) / 1e18;
            return {
              hash: tx.hash,
              method: tx.functionName ? tx.functionName.split("(")[0] : (parseFloat(tx.value) > 0 ? "Transfer" : "Contract Call"),
              block: tx.blockNumber,
              age: ageStr,
              from: tx.from.slice(0, 10) + "..." + tx.from.slice(-5),
              to: tx.to ? tx.to.slice(0, 10) + "..." + tx.to.slice(-5) : "Contract Create",
              value: valEth > 0 ? valEth.toFixed(4) + " ETH" : "0 ETH",
              fee: feeEth.toFixed(5),
            };
          }) : [];
        } catch (e) { console.warn("Tx fetch error:", e.message); }
      }
      updated.push({
        ...w,
        ethBalance: parseFloat(newEthBalance.toFixed(6)),
        ethValue: parseFloat(newEthValue.toFixed(2)),
        tokens: updatedTokens,
        totalUsd: parseFloat(newTotalUsd.toFixed(2)),
        change24h: newChange24h,
        transactions: txns,
        lastUpdated: "Just now",
      });
    }
    return updated;
  }, []);

  // Full fetch for a single wallet (balance + txns + tokens) — used on add
  const fetchFullWalletData = useCallback(async (wallet) => {
    const chainData = await fetchWalletFromChain(wallet.address);
    if (!chainData) return wallet;
    return { ...wallet, ...chainData };
  }, []);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      let updated = await refreshWalletData(wallets);
      // Full fetch for wallets still showing $0
      for (let i = 0; i < updated.length; i++) {
        const w = updated[i];
        if (w.totalUsd === 0) {
          try {
            const fullData = await fetchFullWalletData(w);
            if (fullData) updated = updated.map((wl) => wl.id === w.id ? fullData : wl);
          } catch (e) {}
        }
      }
      setWallets(updated);
      recordSnapshot(updated);
      saveAllWalletsToDb(updated);
      if (selectedWallet) {
        const sel = updated.find((w) => w.id === selectedWallet.id);
        if (sel) setSelectedWallet(sel);
      }
      showToast("Live balances updated from Etherscan", "success");
    } catch (e) {
      showToast("Refresh failed: " + e.message, "error");
    }
    setRefreshing(false);
  };

  // Keep refs for stable auto-refresh (avoids circular useCallback/useEffect dependencies)
  const walletsRef = useRef(wallets);
  useEffect(() => { walletsRef.current = wallets; }, [wallets]);
  const refreshWalletDataRef = useRef(refreshWalletData);
  useEffect(() => { refreshWalletDataRef.current = refreshWalletData; }, [refreshWalletData]);
  const saveAllWalletsToDbRef = useRef(saveAllWalletsToDb);
  useEffect(() => { saveAllWalletsToDbRef.current = saveAllWalletsToDb; }, [saveAllWalletsToDb]);
  const recordSnapshotRef = useRef(recordSnapshot);
  useEffect(() => { recordSnapshotRef.current = recordSnapshot; }, [recordSnapshot]);
  const selectedWalletRef = useRef(selectedWallet);
  useEffect(() => { selectedWalletRef.current = selectedWallet; }, [selectedWallet]);

  // Helper: sync selectedWallet with updated wallet list
  const syncSelectedWallet = (updated) => {
    const sel = selectedWalletRef.current;
    if (sel) {
      const match = updated.find((w) => w.id === sel.id);
      if (match) setSelectedWallet(match);
    }
  };

  // Auto-refresh timer — calls real Etherscan API
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const current = walletsRef.current;
        const updated = await refreshWalletDataRef.current(current);
        setWallets(updated);
        syncSelectedWallet(updated);
        try { recordSnapshotRef.current(updated); } catch (e) {}
        try { saveAllWalletsToDbRef.current(updated); } catch (e) {}
      } catch (e) { console.warn("Auto-refresh failed:", e.message); }
    }, refreshInterval * 1000);
    return () => clearInterval(timer);
  }, [refreshInterval]);

  // Fetch full data on initial load — run full chain fetch for wallets with no data
  const initialFetchDone = useRef(false);
  useEffect(() => {
    if (!storageReady || initialFetchDone.current) return;
    initialFetchDone.current = true;
    const fetchInitial = async () => {
      try {
        const current = walletsRef.current;
        if (current.length === 0) return;
        // First do quick refresh for all wallets (ETH balance + price + transactions if missing)
        let updated = await refreshWalletData(current);
        // Then do full fetch for any wallet that still has no meaningful data
        for (let i = 0; i < updated.length; i++) {
          const w = updated[i];
          if (w.totalUsd === 0) {
            try {
              console.log(`[Init] Full fetch for "${w.label}" (${w.address.slice(-8)})...`);
              const fullData = await fetchFullWalletData(w);
              if (fullData) {
                console.log(`[Init] Full fetch result for "${w.label}": totalUsd=$${fullData.totalUsd}, tokens=${fullData.tokens?.length}, txnCount=${fullData.txnCount}`);
                updated = updated.map((wl) => wl.id === w.id ? fullData : wl);
              }
            } catch (e) { console.warn("Full fetch for", w.label, "failed:", e.message); }
          }
        }
        setWallets(updated);
        syncSelectedWallet(updated);
        saveAllWalletsToDb(updated);
      } catch (e) { console.warn("Initial fetch failed:", e.message); }
    };
    fetchInitial();
  }, [storageReady]); // eslint-disable-line

  const handleCopy = (text) => {
    navigator.clipboard?.writeText?.(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleAddWallet = async () => {
    setAddError("");
    if (!addForm.address.trim()) { setAddError("Please enter a wallet address."); return; }
    if (!validateAddress(addForm.address)) { setAddError("Invalid address format. Must be 0x followed by 40 hex characters (42 total), or 40 hex characters."); return; }
    const normalized = normalizeAddress(addForm.address);
    if (wallets.find((w) => w.address.toLowerCase() === normalized.toLowerCase())) { setAddError("This wallet is already on your watchlist."); return; }
    const trimmedLabel = addForm.label.trim() || "Untitled Wallet";
    if (wallets.find((w) => w.label.toLowerCase() === trimmedLabel.toLowerCase())) { setAddError("A wallet with this nickname already exists. Please choose a different name."); return; }
    const newWallet = {
      id: Date.now(), address: normalized, label: trimmedLabel,
      chain: addForm.chain, totalUsd: 0, ethBalance: 0, ethValue: 0, change24h: 0, txnCount: 0,
      tokens: [], transactions: [], lastUpdated: "Loading...",
    };
    // Add wallet immediately (shows "Loading...")
    setWallets((prev) => [...prev, newWallet]);
    showToast('Fetching blockchain data for "' + newWallet.label + '"...', "success");
    setAddForm({ address: "", label: "", chain: "Ethereum" });
    setView("watchlist");

    // Fetch real data from Etherscan
    try {
      const fullData = await fetchFullWalletData(newWallet);
      setWallets((prev) => prev.map((w) => w.id === newWallet.id ? fullData : w));
      saveWalletToDb(fullData);
      recordSnapshot(wallets);
      showToast('"' + newWallet.label + '" loaded with live data', "success");
    } catch (e) {
      showToast("Added wallet but couldn't fetch data: " + e.message, "error");
      saveWalletToDb(newWallet);
    }
  };

  const requestDelete = (wallet, e) => { if (e) e.stopPropagation(); setDeleteTarget(wallet); };
  const confirmDelete = () => {
    if (!deleteTarget) return;
    const label = deleteTarget.label;
    const deletedId = deleteTarget.id;
    setWallets((prev) => {
      const updated = prev.filter((w) => w.id !== deletedId);
      recordSnapshot(updated);
      return updated;
    });
    deleteWalletFromDb(deletedId);
    if (selectedWallet?.id === deletedId) { setSelectedWallet(null); setView("watchlist"); }
    setDeleteTarget(null);
    showToast('"' + label + '" removed from watchlist', "danger");
  };
  const cancelDelete = () => setDeleteTarget(null);

  const S = {
    page: { fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif", background: "#f8f9fa", minHeight: "100vh", color: "#1e2022", fontSize: 14, lineHeight: 1.5 },
    topBar: { background: "#21325b", color: "#ffffffcc", fontSize: 12, padding: "6px 0", borderBottom: "1px solid #1a2847", overflow: "hidden" },
    topBarInner: { maxWidth: 940, margin: "0 auto", padding: "0 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
    navBar: { background: "#fff", borderBottom: "1px solid #e9ecef", position: "sticky", top: 0, zIndex: 100 },
    navInner: { maxWidth: 940, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 },
    logo: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer" },
    logoMark: { width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg, #21325b 0%, #3b5998 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 },
    logoLabel: { fontWeight: 700, fontSize: 16, color: "#21325b" },
    navLinks: { display: "flex", gap: 2 },
    navLink: (active) => ({ padding: "8px 14px", fontSize: 13.5, fontWeight: active ? 600 : 400, color: active ? "#0784c3" : "#6c757d", background: active ? "#e8f4fd" : "transparent", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit" }),
    hero: { background: "linear-gradient(160deg, #21325b 0%, #3b5998 100%)", padding: "32px 0 38px" },
    heroInner: { maxWidth: 940, margin: "0 auto", padding: "0 16px" },
    searchRow: { display: "flex", gap: 0, maxWidth: 680 },
    searchInput: { flex: 1, padding: "12px 16px", fontSize: 14, fontFamily: "'Roboto Mono', monospace", border: "2px solid transparent", borderRight: "none", borderRadius: "8px 0 0 8px", outline: "none", background: "#fff", color: "#1e2022" },
    searchBtn: { padding: "0 20px", background: "#3498db", color: "#fff", border: "none", borderRadius: "0 8px 8px 0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
    content: { maxWidth: 940, margin: "0 auto", padding: "20px 16px 40px" },
    card: { background: "#fff", border: "1px solid #e9ecef", borderRadius: 12, overflow: "hidden", marginBottom: 16 },
    cardHeader: { padding: "14px 20px", borderBottom: "1px solid #e9ecef", display: "flex", justifyContent: "space-between", alignItems: "center" },
    cardTitle: { fontSize: 14, fontWeight: 600, color: "#1e2022" },
    statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 },
    statCard: { background: "#fff", border: "1px solid #e9ecef", borderRadius: 12, padding: "16px 20px" },
    statLabel: { fontSize: 12, color: "#6c757d", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6, fontWeight: 500 },
    statValue: { fontSize: 20, fontWeight: 700, color: "#1e2022" },
    statSub: { fontSize: 12, color: "#6c757d", marginTop: 4 },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
    th: { textAlign: "left", padding: "10px 16px", fontWeight: 600, color: "#6c757d", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "2px solid #e9ecef", background: "#f8f9fa", whiteSpace: "nowrap" },
    td: { padding: "12px 16px", borderBottom: "1px solid #f1f3f5", verticalAlign: "middle" },
    link: { color: "#0784c3", textDecoration: "none", cursor: "pointer" },
    badge: (type) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 11.5, fontWeight: 500, ...(type === "success" ? { background: "#d1fae5", color: "#065f46" } : type === "danger" ? { background: "#fee2e2", color: "#991b1b" } : type === "info" ? { background: "#e0f2fe", color: "#075985" } : type === "warning" ? { background: "#fef3c7", color: "#92400e" } : { background: "#f1f3f5", color: "#6c757d" }) }),
    methodBadge: { display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500, background: "#fef3c7", color: "#92400e", minWidth: 60, textAlign: "center" },
    tabRow: { display: "flex", gap: 0, borderBottom: "2px solid #e9ecef", padding: "0 20px", background: "#fff" },
    tab: (active) => ({ padding: "12px 18px", fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "#0784c3" : "#6c757d", borderBottom: active ? "2px solid #0784c3" : "2px solid transparent", marginBottom: -2, cursor: "pointer", background: "transparent", border: "none", fontFamily: "inherit" }),
    overviewRow: { display: "flex", padding: "11px 20px", borderBottom: "1px solid #f1f3f5", fontSize: 13.5 },
    overviewLabel: { width: 180, color: "#6c757d", flexShrink: 0 },
    overviewValue: { flex: 1, color: "#1e2022", wordBreak: "break-all" },
    formGroup: { marginBottom: 16 },
    label: { display: "block", fontSize: 13, fontWeight: 500, color: "#1e2022", marginBottom: 6 },
    input: { width: "100%", padding: "10px 14px", fontSize: 14, border: "1px solid #d1d5db", borderRadius: 8, outline: "none", fontFamily: "inherit", color: "#1e2022", background: "#fff", transition: "border-color 0.15s, box-shadow 0.15s", boxSizing: "border-box" },
    btnPrimary: { padding: "10px 24px", fontSize: 14, fontWeight: 600, color: "#fff", background: "#0784c3", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 },
    btnOutline: { padding: "8px 16px", fontSize: 13, fontWeight: 500, color: "#0784c3", background: "#fff", border: "1px solid #0784c3", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 },
    btnDanger: { padding: "8px 16px", fontSize: 13, fontWeight: 500, color: "#dc3545", background: "#fff", border: "1px solid #dc3545", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 },
    chip: (active) => ({ padding: "6px 14px", fontSize: 13, fontWeight: 500, borderRadius: 8, border: "1px solid " + (active ? "#0784c3" : "#d1d5db"), background: active ? "#e0f2fe" : "#fff", color: active ? "#0784c3" : "#6c757d", cursor: "pointer", fontFamily: "inherit" }),
    deleteBtn: { background: "none", border: "1px solid transparent", cursor: "pointer", padding: "5px 7px", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" },
    infoBox: (type) => ({ padding: "12px 16px", borderRadius: 8, fontSize: 13, lineHeight: 1.5, ...(type === "error" ? { background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b" } : type === "success" ? { background: "#d1fae5", border: "1px solid #6ee7b7", color: "#065f46" } : { background: "#e0f2fe", border: "1px solid #7dd3fc", color: "#075985" }) }),
    mono: { fontFamily: "'Roboto Mono', monospace", fontSize: 13 },
    muted: { color: "#6c757d" },
    breadcrumb: { fontSize: 13, color: "#6c757d", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 },
    breadcrumbLink: { color: "#0784c3", cursor: "pointer" },
    toggleOuter: (on) => ({ width: 40, height: 22, borderRadius: 11, cursor: "pointer", border: "none", background: on ? "#0784c3" : "#d1d5db", position: "relative", display: "inline-flex", alignItems: "center", transition: "all 0.2s" }),
    toggleDot: (on) => ({ width: 16, height: 16, borderRadius: 8, background: "#fff", position: "absolute", top: 3, left: on ? 21 : 3, transition: "all 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }),
    emptyState: { padding: "60px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  };

  // Hero search state lifted up
  const [heroSearch, setHeroSearch] = useState("");
  const handleHeroSearch = () => {
    if (!heroSearch.trim()) return;
    const found = wallets.find((w) => w.address.toLowerCase() === normalizeAddress(heroSearch).toLowerCase());
    if (found) { setSelectedWallet(found); setView("detail"); }
    else if (validateAddress(heroSearch.trim())) { setAddForm({ address: normalizeAddress(heroSearch), label: "", chain: "Ethereum" }); setView("add"); }
  };

  const w = selectedWallet;

  return (
    <div style={S.page}>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; }
        button:hover { opacity: 0.9; }
        table tr:hover td { background: #f8f9fa; }
        input::placeholder { color: #adb5bd; }
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
      <DeleteModal wallet={deleteTarget} onConfirm={confirmDelete} onCancel={cancelDelete} />

      {/* ── TOP BAR ── */}
      <style>{`@keyframes tickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
      <div style={S.topBar}><div style={S.topBarInner}>
        <div style={{ flex: 1, overflow: "hidden", maskImage: "linear-gradient(to right, transparent, black 40px, black calc(100% - 40px), transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 40px, black calc(100% - 40px), transparent)" }}>
          <div style={{ display: "flex", gap: 24, whiteSpace: "nowrap", animation: Object.keys(tickerPrices).length > 0 ? "tickerScroll 30s linear infinite" : "none", width: "max-content" }}>
            {[1, 2].map((dup) => (
              <div key={dup} style={{ display: "flex", gap: 24, alignItems: "center" }}>
                {["BTC", "ETH", "SOL", "XRP", "DOGE", "MATIC", "UNI", "SHIB"].map((sym) => {
                  const t = tickerPrices[sym];
                  if (!t || t.price == null) return <span key={sym} style={{ color: "#ffffff55" }}>{sym} —</span>;
                  const up = (t.change || 0) >= 0;
                  const fmtPrice = (t.price || 0) >= 1 ? "$" + (t.price || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "$" + (t.price || 0).toFixed(6);
                  return (
                    <span key={sym} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#ffffffcc", fontWeight: 600 }}>{sym}</span>
                      <span style={{ color: "#fff", fontWeight: 500 }}>{fmtPrice}</span>
                      <span style={{ color: up ? "#34d399" : "#f87171", fontWeight: 500, fontSize: 11 }}>{up ? "▲" : "▼"} {Math.abs(t.change || 0).toFixed(1)}%</span>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, marginLeft: 12 }}>
          <span style={{ ...S.badge("default"), background: "rgba(255,255,255,0.12)", color: "#ffffffcc", fontSize: 11 }}>Ethereum Mainnet</span>
          <span style={{
            ...S.badge("default"), fontSize: 10, display: "inline-flex", alignItems: "center", gap: 4,
            background: dbStatus === "connected" ? "rgba(16,185,129,0.2)" : dbStatus === "local" ? "rgba(59,130,246,0.2)" : dbStatus === "loading" ? "rgba(255,255,255,0.12)" : "rgba(239,68,68,0.2)",
            color: dbStatus === "connected" ? "#6ee7b7" : dbStatus === "local" ? "#93c5fd" : dbStatus === "loading" ? "#ffffffcc" : "#fca5a5",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: dbStatus === "connected" ? "#10b981" : dbStatus === "local" ? "#3b82f6" : dbStatus === "loading" ? "#9ca3af" : "#ef4444" }} />
            {dbStatus === "connected" ? "DB Connected" : dbStatus === "local" ? "Local Storage" : dbStatus === "loading" ? "Connecting..." : "Offline"}
          </span>
        </div>
      </div></div>

      {/* ── NAV BAR ── */}
      <div style={S.navBar}><div style={S.navInner}>
        <div style={S.logo} onClick={() => { setView("watchlist"); setSelectedWallet(null); }}>
          <img src={APP_LOGO} alt="Wallet Watcher" style={{ width: 36, height: 36, borderRadius: 4 }} /><span style={S.logoLabel}>Wallet Watcher</span>
        </div>
        <div style={S.navLinks}>
          <button style={S.navLink(view === "watchlist" || view === "detail")} onClick={() => setView("watchlist")}>Watchlist</button>
          <button style={S.navLink(view === "add")} onClick={() => { setView("add"); setAddError(""); }}>Add Wallet</button>
          <button style={S.navLink(view === "alerts")} onClick={() => setView("alerts")}>Alerts</button>
        </div>
      </div></div>

      {/* ══════════════════════════════════════════ */}
      {/*   WATCHLIST VIEW                          */}
      {/* ══════════════════════════════════════════ */}
      {view === "watchlist" && <>
        {/* Hero Search */}
        <div style={S.hero}><div style={S.heroInner}>
          <div style={{ color: "#fff", fontSize: 20, fontWeight: 400, marginBottom: 14 }}><span style={{ fontWeight: 700 }}>Wallet Watcher</span> — Ethereum Wallet Watchlist</div>
          <div style={S.searchRow}>
            <div style={{ flex: 1, position: "relative" }}>
              <input style={{ ...S.searchInput, width: "100%", paddingRight: heroSearch ? 36 : 16 }} placeholder="Search by Address / ENS Name" value={heroSearch} onChange={(e) => setHeroSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleHeroSearch()}
                onFocus={(e) => e.target.style.borderColor = "#3498db"} onBlur={(e) => e.target.style.borderColor = "transparent"} />
              {heroSearch && (
                <button
                  onClick={() => setHeroSearch("")}
                  title="Clear search"
                  style={{
                    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                    width: 22, height: 22, borderRadius: "50%", border: "none", cursor: "pointer",
                    background: "#e9ecef", color: "#6c757d", fontSize: 13, fontWeight: 600,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s", lineHeight: 1, padding: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#dc3545"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#e9ecef"; e.currentTarget.style.color = "#6c757d"; }}
                >✕</button>
              )}
            </div>
            <button style={S.searchBtn} onClick={handleHeroSearch}><SearchIcon /></button>
          </div>
        </div></div>
        <div style={S.content}>
          <div style={S.statsGrid}>
            <div style={S.statCard}>
              <div style={S.statLabel}>Total Portfolio Value</div>
              <div style={S.statValue}>{formatUsd(totalPortfolio)}</div>
              <div style={S.statSub}>across {wallets.length} watched wallet{wallets.length !== 1 ? "s" : ""}</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statLabel}>Total ETH Balance</div>
              <div style={S.statValue}>{totalEth.toFixed(4)} ETH</div>
              <div style={S.statSub}>{liveEthPrice > 0 ? `${formatUsd(totalEth * liveEthPrice)} @ ${formatUsd(liveEthPrice)}/ETH` : "Fetching price..."}</div>
            </div>
          </div>
          <div style={S.card}>
            <div style={S.cardHeader}>
              <span style={S.cardTitle}>My Watchlist ({wallets.length})</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button style={{
                  padding: "6px 14px", fontSize: 12.5, fontWeight: 500, borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: sortOrder !== "default" ? "#e0f2fe" : "#fff",
                  border: sortOrder !== "default" ? "1px solid #0784c3" : "1px solid #d1d5db",
                  color: sortOrder !== "default" ? "#0784c3" : "#6c757d",
                  transition: "all 0.15s",
                }} onClick={cycleSortOrder} title="Toggle sort by balance">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5h10M11 9h7M11 13h4" /><path d="M3 17l3 3 3-3" /><path d="M6 18V4" />
                  </svg>
                  Order{sortLabel}
                </button>
                <button style={{
                  width: 34, height: 34, borderRadius: 8, cursor: refreshing ? "default" : "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: "#fff", border: "1px solid #d1d5db", color: "#6c757d",
                  transition: "all 0.15s", padding: 0, opacity: refreshing ? 0.6 : 1,
                }} onClick={handleRefresh} title="Refresh balances"
                  onMouseEnter={(e) => { if (!refreshing) { e.currentTarget.style.background = "#e0f2fe"; e.currentTarget.style.borderColor = "#0784c3"; e.currentTarget.style.color = "#0784c3"; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#6c757d"; }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }}>
                    <path d="M21.5 2v6h-6" /><path d="M2.5 22v-6h6" />
                    <path d="M2.8 10a10 10 0 0116.8-4.3L21.5 8" /><path d="M21.2 14a10 10 0 01-16.8 4.3L2.5 16" />
                  </svg>
                </button>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  title="Auto-refresh interval"
                  style={{
                    padding: "6px 8px", fontSize: 12, fontWeight: 500, borderRadius: 8,
                    border: "1px solid #d1d5db", background: "#fff", color: "#6c757d",
                    cursor: "pointer", fontFamily: "inherit", outline: "none",
                    appearance: "none", WebkitAppearance: "none",
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236c757d' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
                    paddingRight: 24, transition: "all 0.15s",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#0784c3"; e.target.style.color = "#0784c3"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#d1d5db"; e.target.style.color = "#6c757d"; }}
                >
                  {REFRESH_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s < 60 ? s + "s" : (s / 60) + "m"}</option>
                  ))}
                </select>
              </div>
            </div>
            {wallets.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}></th><th style={S.th}>Nickname</th><th style={S.th}>Address</th><th style={S.th}>Chain</th>
                    <th style={{ ...S.th, textAlign: "right" }}>Balance (USD)</th><th style={{ ...S.th, textAlign: "right" }}>ETH Balance</th>
                    <th style={{ ...S.th, textAlign: "right" }}>24h Change</th><th style={{ ...S.th, textAlign: "center" }}>Txns</th>
                    <th style={{ ...S.th, textAlign: "center" }}>Updated</th>
                  </tr></thead>
                  <tbody>{sortedWallets.map((wl, i) => (
                    <tr key={wl.id} style={{ cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f8f9fa"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={{ ...S.td, color: "#6c757d", fontSize: 12, width: 30, textAlign: "center" }}>{i + 1}</td>
                      <td style={S.td} onClick={() => { setSelectedWallet(wl); setView("detail"); setEditing(false); }}><span style={{ fontWeight: 600 }}>{wl.label}</span></td>
                      <td style={S.td} onClick={() => { setSelectedWallet(wl); setView("detail"); setEditing(false); }}><span style={{ ...S.mono, ...S.link }}>...{wl.address.slice(-7)}</span></td>
                      <td style={S.td}><span style={S.badge("info")}>{wl.chain}</span></td>
                      <td style={{ ...S.td, textAlign: "right", fontWeight: 600 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          {formatUsd(wl.totalUsd)}
                          {balanceDir[wl.id] === "up" && <span style={{ color: "#065f46", fontSize: "inherit", lineHeight: 1 }}>▲</span>}
                          {balanceDir[wl.id] === "down" && <span style={{ color: "#991b1b", fontSize: "inherit", lineHeight: 1 }}>▼</span>}
                        </span>
                      </td>
                      <td style={{ ...S.td, textAlign: "right", ...S.mono }}>{(wl.ethBalance || 0).toFixed(4)}</td>
                      <td style={{ ...S.td, textAlign: "right" }}><span style={S.badge((wl.change24h || 0) >= 0 ? "success" : "danger")}>{(wl.change24h || 0) >= 0 ? "+" : ""}{wl.change24h || 0}%</span></td>
                      <td style={{ ...S.td, textAlign: "center" }}>{(wl.txnCount || 0).toLocaleString()}</td>
                      <td style={{ ...S.td, textAlign: "center", fontSize: 12, color: "#6c757d" }}>{wl.lastUpdated}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : (
              <div style={S.emptyState}>
                <WalletIcon />
                <div style={{ fontSize: 16, fontWeight: 600, color: "#495057" }}>No wallets on your watchlist</div>
                <div style={{ fontSize: 13.5, color: "#6c757d", maxWidth: 360, lineHeight: 1.6 }}>Add a public Ethereum wallet address to start monitoring its balance and token holdings in real time.</div>
                <button style={{ ...S.btnPrimary, marginTop: 8 }} onClick={() => { setView("add"); setAddError(""); }}><PlusIcon /> Add Your First Wallet</button>
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8, marginBottom: 8 }}>
            <button style={{ ...S.btnPrimary, padding: "12px 32px", fontSize: 15 }} onClick={() => { setView("add"); setAddError(""); }}><PlusIcon /> Add Wallet</button>
          </div>
        </div>
      </>}

      {/* ══════════════════════════════════════════ */}
      {/*   DETAIL VIEW                             */}
      {/* ══════════════════════════════════════════ */}
      {view === "detail" && w && <>
        <div style={{ background: "#fff", borderBottom: "1px solid #e9ecef" }}>
          <div style={{ ...S.content, paddingTop: 16, paddingBottom: 0, marginBottom: 0 }}>
            <div style={S.breadcrumb}><span style={S.breadcrumbLink} onClick={() => { setView("watchlist"); setEditing(false); }}>Watchlist</span><span style={{ color: "#ccc" }}>›</span><span>{w.label}</span></div>
            {!editing ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><span style={S.badge("info")}>{w.chain}</span><span style={{ fontSize: 18, fontWeight: 700 }}>{w.label}</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ ...S.mono, fontSize: 13.5, color: "#6c757d" }}>...{w.address.slice(-7)}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <a href={"https://etherscan.io/address/" + w.address} target="_blank" rel="noopener noreferrer" style={{ ...S.btnOutline, textDecoration: "none", fontSize: 12, padding: "6px 12px" }}>View on Etherscan ↗</a>
                  <button style={{ ...S.btnOutline, fontSize: 12, padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 5 }} onClick={startEditing}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>
                  <button style={{ ...S.btnDanger, fontSize: 12, padding: "6px 12px" }} onClick={(e) => requestDelete(w, e)}><TrashIcon color="#dc3545" size={13} /> Remove</button>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 16, background: "#f8f9fa", borderRadius: 10, padding: 20, border: "1px solid #e9ecef" }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0784c3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit Wallet
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Wallet Address</label>
                  <div style={{ ...S.input, fontFamily: "'Roboto Mono', monospace", background: "#f8f9fa", color: "#6c757d", cursor: "default" }}>...{editForm.address.slice(-7)}</div>
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Nickname</label>
                  <input style={S.input} value={editForm.label}
                    onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                    onFocus={(e) => { e.target.style.borderColor = "#0784c3"; e.target.style.boxShadow = "0 0 0 3px rgba(7,132,195,0.1)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#d1d5db"; e.target.style.boxShadow = "none"; }} />
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button style={S.btnPrimary} onClick={saveEdit}>Save Changes</button>
                  <button style={S.btnOutline} onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={S.content}>
          <div style={{ ...S.card, marginBottom: 16 }}>
            <div style={S.cardHeader}><span style={S.cardTitle}>Overview</span></div>
            <div>
              <div style={S.overviewRow}><div style={S.overviewLabel}>ETH Balance:</div><div style={S.overviewValue}><EthIcon /> <strong>{(w.ethBalance || 0).toFixed(4)} ETH</strong></div></div>
              <div style={S.overviewRow}><div style={S.overviewLabel}>ETH Value:</div><div style={S.overviewValue}>{formatUsd(w.ethBalance * liveEthPrice)} <span style={S.muted}>(@ {formatUsd(liveEthPrice)}/ETH)</span></div></div>
              <div style={S.overviewRow}><div style={S.overviewLabel}>Total Value:</div><div style={S.overviewValue}><strong>{formatUsd(w.totalUsd)}</strong> <span style={S.badge(w.change24h >= 0 ? "success" : "danger")}>{w.change24h >= 0 ? "+" : ""}{w.change24h}% (24h)</span></div></div>
              <div style={{ ...S.overviewRow, borderBottom: "none" }}><div style={S.overviewLabel}>Transaction Count:</div><div style={S.overviewValue}>{(w.txnCount || 0).toLocaleString()} txns</div></div>
            </div>
          </div>
          <div style={S.card}>
            <div style={S.tabRow}>
              <button style={S.tab(detailTab === "transactions")} onClick={() => setDetailTab("transactions")}>Transactions ({w.transactions.length})</button>
              <button style={S.tab(detailTab === "tokens")} onClick={() => setDetailTab("tokens")}>Token Holdings ({w.tokens.length})</button>
            </div>
            {detailTab === "transactions" && (
              <div style={{ overflowX: "auto" }}>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Txn Hash</th><th style={S.th}>Method</th><th style={{ ...S.th, textAlign: "right" }}>Value</th><th style={{ ...S.th, textAlign: "right" }}>Txn Fee</th><th style={S.th}>Block</th><th style={S.th}>Age</th><th style={S.th}>From</th><th style={S.th}></th><th style={S.th}>To</th></tr></thead>
                  <tbody>{w.transactions.map((tx, i) => (
                    <tr key={i} onClick={() => window.open(`https://etherscan.io/tx/${tx.hash}`, "_blank")} style={{ cursor: "pointer" }} title="View on Etherscan">
                      <td style={{ ...S.td, ...S.mono }}><span style={{ ...S.link, color: "#1a73e8" }}>{tx.hash.length > 20 ? tx.hash.slice(0, 10) + "..." + tx.hash.slice(-6) : tx.hash}</span></td>
                      <td style={S.td}><span style={S.methodBadge}>{tx.method}</span></td>
                      <td style={{ ...S.td, textAlign: "right", whiteSpace: "nowrap" }}>{tx.value}</td>
                      <td style={{ ...S.td, textAlign: "right", color: "#6c757d", whiteSpace: "nowrap" }}>{tx.fee}</td>
                      <td style={S.td}><span style={S.link}>{tx.block}</span></td>
                      <td style={{ ...S.td, color: "#6c757d", whiteSpace: "nowrap" }}>{tx.age}</td>
                      <td style={{ ...S.td, ...S.mono }}><span style={S.link}>{tx.from}</span></td>
                      <td style={S.td}><span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", background: tx.from.includes(w.address.slice(2, 8)) ? "#fee2e2" : "#d1fae5", color: tx.from.includes(w.address.slice(2, 8)) ? "#991b1b" : "#065f46", fontSize: 10, fontWeight: 700 }}>{tx.from.includes(w.address.slice(2, 8)) ? "OUT" : "IN"}</span></td>
                      <td style={{ ...S.td, ...S.mono }}><span style={S.link}>{tx.to}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
                {w.transactions.length === 0 && <div style={{ padding: 30, textAlign: "center", color: "#6c757d" }}>No transactions found.</div>}
              </div>
            )}
            {detailTab === "tokens" && (
              <div style={{ overflowX: "auto" }}>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>#</th><th style={S.th}>Token</th><th style={{ ...S.th, textAlign: "right" }}>Quantity</th><th style={{ ...S.th, textAlign: "right" }}>Price</th><th style={{ ...S.th, textAlign: "right" }}>Value</th><th style={{ ...S.th, textAlign: "right" }}>24h %</th></tr></thead>
                  <tbody>{w.tokens.map((t, i) => (
                    <tr key={t.symbol}>
                      <td style={{ ...S.td, color: "#6c757d", width: 30 }}>{i + 1}</td>
                      <td style={S.td}><div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f1f3f5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11 }}>{t.symbol.slice(0, 2)}</div>
                        <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.name}</div><div style={{ fontSize: 12, color: "#6c757d" }}>{t.symbol}</div></div>
                      </div></td>
                      <td style={{ ...S.td, textAlign: "right", ...S.mono }}>{(t.qty || 0).toLocaleString()}</td>
                      <td style={{ ...S.td, textAlign: "right" }}>{formatUsd(t.price)}</td>
                      <td style={{ ...S.td, textAlign: "right", fontWeight: 600 }}>{formatUsd(t.value)}</td>
                      <td style={{ ...S.td, textAlign: "right" }}><span style={S.badge(t.change >= 0 ? "success" : "danger")}>{t.change >= 0 ? "+" : ""}{t.change}%</span></td>
                    </tr>
                  ))}</tbody>
                </table>
                {w.tokens.length === 0 && <div style={{ padding: 30, textAlign: "center", color: "#6c757d" }}>No token holdings found.</div>}
              </div>
            )}
          </div>
        </div>
      </>}

      {/* ══════════════════════════════════════════ */}
      {/*   ADD WALLET VIEW                         */}
      {/* ══════════════════════════════════════════ */}
      {view === "add" && <>
        <div style={{ background: "#fff", borderBottom: "1px solid #e9ecef" }}>
          <div style={{ ...S.content, paddingTop: 16, paddingBottom: 16, marginBottom: 0 }}>
            <div style={S.breadcrumb}><span style={S.breadcrumbLink} onClick={() => setView("watchlist")}>Watchlist</span><span style={{ color: "#ccc" }}>›</span><span>Add Wallet</span></div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Add Wallet to Watchlist</div>
            <div style={{ fontSize: 13.5, color: "#6c757d", marginTop: 4 }}>Enter a public wallet address to start monitoring. Find addresses on <a href="https://etherscan.io" target="_blank" rel="noopener" style={{ ...S.link, fontWeight: 500 }}>Etherscan.io ↗</a></div>
          </div>
        </div>
        <div style={S.content}>
          <div style={S.card}>
            <div style={S.cardHeader}><span style={S.cardTitle}>Wallet Details</span></div>
            <div style={{ padding: 20 }}>
              <div style={S.formGroup}>
                <label style={S.label}>Wallet Address <span style={{ color: "#dc3545" }}>*</span></label>
                <input style={{ ...S.input, fontFamily: "'Roboto Mono', monospace" }} placeholder="0x1234...abcd (42 character hex address)"
                  value={addForm.address} onChange={(e) => { setAddForm({ ...addForm, address: e.target.value.trim() }); setAddError(""); }}
                  onFocus={(e) => { e.target.style.borderColor = "#0784c3"; e.target.style.boxShadow = "0 0 0 3px rgba(7,132,195,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#d1d5db"; e.target.style.boxShadow = "none"; }} />
                {addForm.address && !validateAddress(addForm.address) && <div style={{ fontSize: 12, color: "#dc3545", marginTop: 6 }}>⚠ Enter a valid address: 0x followed by 40 hex characters, or 40 hex characters.</div>}
                {addForm.address && validateAddress(addForm.address) && <div style={{ fontSize: 12, color: "#065f46", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle /> Valid address format</div>}
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Nickname <span style={{ color: "#6c757d", fontWeight: 400 }}>(optional)</span></label>
                <input style={S.input} placeholder="e.g. Trading Wallet, Cold Storage" value={addForm.label} onChange={(e) => setAddForm({ ...addForm, label: e.target.value })}
                  onFocus={(e) => { e.target.style.borderColor = "#0784c3"; e.target.style.boxShadow = "0 0 0 3px rgba(7,132,195,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#d1d5db"; e.target.style.boxShadow = "none"; }} />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Blockchain Network</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{CHAINS.map((c) => (
                  <button key={c} style={S.chip(addForm.chain === c)} onClick={() => setAddForm({ ...addForm, chain: c })}>{c}</button>
                ))}</div>
              </div>
              {addError && <div style={{ ...S.infoBox("error"), marginBottom: 16 }}>{addError}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button style={S.btnPrimary} onClick={handleAddWallet}><PlusIcon /> Add to Watchlist</button>
                <button style={S.btnOutline} onClick={() => setView("watchlist")}>Cancel</button>
              </div>
            </div>
          </div>
          <div style={S.card}>
            <div style={S.cardHeader}><span style={S.cardTitle}>🔒 Security Note</span></div>
            <div style={{ padding: "14px 20px", fontSize: 13, color: "#6c757d", lineHeight: 1.7 }}>Wallet Watcher uses <strong>read-only</strong> public blockchain data via the Etherscan API. We never request or store private keys, seed phrases, or passwords. Only public wallet addresses are used for balance lookups.</div>
          </div>
        </div>
      </>}

      {/* ══════════════════════════════════════════ */}
      {/*   ALERTS VIEW                             */}
      {/* ══════════════════════════════════════════ */}
      {view === "alerts" && <>
        <div style={{ background: "#fff", borderBottom: "1px solid #e9ecef" }}>
          <div style={{ ...S.content, paddingTop: 16, paddingBottom: 16, marginBottom: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Alert Notifications</div>
            <div style={{ fontSize: 13.5, color: "#6c757d", marginTop: 4 }}>Configure alerts to get notified when wallet balances change.</div>
          </div>
        </div>
        <div style={S.content}>
          <div style={S.card}>
            <div style={S.cardHeader}><span style={S.cardTitle}>Active Alerts ({alerts.filter((a) => a.active).length} of {alerts.length})</span><button style={S.btnOutline} onClick={() => { setShowNewAlert(!showNewAlert); setNewAlertForm({ walletId: "", type: "Balance drops below", threshold: "" }); }}><PlusIcon /> New Alert</button></div>
            {showNewAlert && (
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #e9ecef", background: "#f8f9fa" }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Create New Alert</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div style={{ flex: "1 1 180px" }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#6c757d", marginBottom: 4 }}>Wallet</div>
                    <select style={{ ...S.input, cursor: "pointer" }} value={newAlertForm.walletId} onChange={(e) => setNewAlertForm({ ...newAlertForm, walletId: e.target.value })}>
                      <option value="">Select a wallet...</option>
                      {wallets.map((w) => <option key={w.id} value={w.id}>{w.label} (...{w.address.slice(-7)})</option>)}
                    </select>
                  </div>
                  <div style={{ flex: "1 1 180px" }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#6c757d", marginBottom: 4 }}>Condition</div>
                    <select style={{ ...S.input, cursor: "pointer" }} value={newAlertForm.type} onChange={(e) => setNewAlertForm({ ...newAlertForm, type: e.target.value })}>
                      <option>Balance drops below</option>
                      <option>Balance increases by</option>
                      <option>Incoming transfer over</option>
                      <option>Gas price drops below</option>
                    </select>
                  </div>
                  <div style={{ flex: "1 1 120px" }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#6c757d", marginBottom: 4 }}>Threshold</div>
                    <input style={S.input} placeholder={newAlertForm.type.includes("increases") ? "e.g. 10%" : newAlertForm.type.includes("Gas") ? "e.g. 5 Gwei" : "e.g. $10,000 or 1 ETH"} value={newAlertForm.threshold} onChange={(e) => setNewAlertForm({ ...newAlertForm, threshold: e.target.value })} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ ...S.btnPrimary, padding: "8px 16px", fontSize: 13 }} onClick={async () => {
                      const w = wallets.find((wl) => String(wl.id) === String(newAlertForm.walletId));
                      if (!w) { showToast("Please select a wallet", "error"); return; }
                      if (!newAlertForm.threshold.trim()) { showToast("Please enter a threshold", "error"); return; }
                      const rawThreshold = newAlertForm.threshold.trim();
                      // Format as USD if it looks like a dollar amount (digits, optional $ and commas)
                      const stripped = rawThreshold.replace(/[$,]/g, "");
                      const asNum = parseFloat(stripped);
                      const fmtThreshold = (!isNaN(asNum) && /^[\$\s,]*[\d,.]+$/.test(rawThreshold)) ? "$" + Math.round(asNum).toLocaleString("en-US") : rawThreshold;
                      const newAlert = { id: Date.now(), walletLabel: w.label, address: w.address, type: newAlertForm.type, threshold: fmtThreshold, active: true };
                      setAlerts((prev) => [...prev, newAlert]);
                      setShowNewAlert(false);
                      setNewAlertForm({ walletId: "", type: "Balance drops below", threshold: "" });
                      if (isSupabaseConfigured()) {
                        try { await supabase.insert("alerts", [{ id: newAlert.id, wallet_label: newAlert.walletLabel, address: newAlert.address, type: newAlert.type, threshold: newAlert.threshold, active: true }]); } catch (e) { console.warn("Failed to save alert:", e.message); }
                      }
                      showToast("Alert created", "success");
                    }}>Create</button>
                    <button style={{ ...S.btnOutline, padding: "8px 16px", fontSize: 13 }} onClick={() => setShowNewAlert(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
            <div style={{ overflowX: "auto" }}>
              {alerts.length === 0 ? (
                <div style={{ padding: "32px 24px", textAlign: "center", color: "#6c757d" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>No alerts configured</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Create a new alert to get notified when wallet balances change.</div>
                </div>
              ) : (
              <table style={S.table}>
                <thead><tr><th style={S.th}>Wallet</th><th style={S.th}>Address</th><th style={S.th}>Condition</th><th style={S.th}>Threshold</th><th style={{ ...S.th, textAlign: "center" }}>Status</th><th style={{ ...S.th, textAlign: "center" }}>Toggle</th><th style={{ ...S.th, textAlign: "center", width: 50 }}></th></tr></thead>
                <tbody>{alerts.map((a) => (
                  <tr key={a.id}>
                    <td style={{ ...S.td, fontWeight: 600 }}>{a.walletLabel}</td>
                    <td style={{ ...S.td }}><span style={{ ...S.mono, ...S.link }}>...{a.address.slice(-7)}</span></td>
                    <td style={S.td}>{a.type}</td>
                    <td style={S.td}><span style={S.badge("warning")}>{a.threshold}</span></td>
                    <td style={{ ...S.td, textAlign: "center" }}><span style={S.badge(a.active ? "success" : "default")}>{a.active ? "Active" : "Paused"}</span></td>
                    <td style={{ ...S.td, textAlign: "center" }}><button style={S.toggleOuter(a.active)} onClick={async () => { setAlerts(alerts.map((x) => x.id === a.id ? { ...x, active: !x.active } : x)); if (isSupabaseConfigured()) { try { await supabase.update("alerts", { id: a.id }, { active: !a.active }); } catch (e) {} } }}><div style={S.toggleDot(a.active)} /></button></td>
                    <td style={{ ...S.td, textAlign: "center" }}><button onClick={async () => { setAlerts((prev) => prev.filter((x) => x.id !== a.id)); if (isSupabaseConfigured()) { try { await supabase.delete("alerts", { id: a.id }); } catch (e) {} } showToast("Alert deleted", "success"); }} style={{ background: "none", border: "1px solid transparent", cursor: "pointer", padding: "4px 6px", borderRadius: 6, display: "inline-flex", alignItems: "center", transition: "all 0.15s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.borderColor = "#fca5a5"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "transparent"; }} title="Delete alert"><TrashIcon color="#dc3545" size={14} /></button></td>
                  </tr>
                ))}</tbody>
              </table>
              )}
            </div>
          </div>
          <div style={S.card}>
            <div style={S.cardHeader}><span style={S.cardTitle}>Available Alert Types</span></div>
            <div>{[
              { icon: "📉", title: "Balance Drop", desc: "Trigger when total USD value falls below a specified threshold." },
              { icon: "📈", title: "Balance Surge", desc: "Trigger when total value increases by a specified percentage." },
              { icon: "🔔", title: "Token Transfer", desc: "Trigger when tokens are transferred in or out of a watched wallet." },
              { icon: "⛽", title: "Gas Price Alert", desc: "Trigger when network gas prices drop to your target level." },
            ].map((t, i) => (
              <div key={i} style={{ ...S.overviewRow, gap: 12, alignItems: "flex-start" }}>
                <div style={{ fontSize: 18, lineHeight: 1 }}>{t.icon}</div>
                <div><div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 2 }}>{t.title}</div><div style={{ fontSize: 13, color: "#6c757d" }}>{t.desc}</div></div>
              </div>
            ))}</div>
          </div>
        </div>
      </>}
    </div>
  );
}
