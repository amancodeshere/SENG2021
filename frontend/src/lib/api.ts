const API_URL = "https://seng2021-production-e448.up.railway.app";

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/v1/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function logout(sessionId: number) {
  const res = await fetch(`${API_URL}/v1/admin/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  return res.json();
}

export async function fetchInvoices(sessionId: number, buyerName = "") {
  const res = await fetch(`${API_URL}/v2/invoices/list?partyNameBuyer=${encodeURIComponent(buyerName)}`, {
    headers: { sessionid: sessionId.toString() },
  });
  return res.json();
}

export async function fetchInvoiceDetails(sessionId: number, invoiceId: number) {
  const res = await fetch(`${API_URL}/v2/invoice/${invoiceId}`, {
    headers: { sessionid: sessionId.toString() },
  });
  return res.json();
}

export async function updateInvoice(sessionId: number, invoiceId: number, payableAmount: string) {
  const res = await fetch(`${API_URL}/v1/invoice/${invoiceId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      sessionid: sessionId.toString(),
    },
    body: JSON.stringify({ toUpdate: "payableAmount", newData: payableAmount }),
  });
  return res.json();
}

export async function validateInvoiceXML(invoiceXml: string) {
  const res = await fetch(`${API_URL}/v1/invoice/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoice: invoiceXml }),
  });
  return res.json();
}

export async function downloadInvoiceXML(sessionId: number, invoiceId: number) {
  const res = await fetch(`${API_URL}/v2/invoice/${invoiceId}/xml`, {
    headers: { sessionid: sessionId.toString() },
  });
  if (!res.ok) throw new Error("Error fetching XML");
  return res.text();
}

export async function createInvoice(sessionId: number, orderXml: string) {
    const res = await fetch(`${API_URL}/v2/invoice/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
        sessionid: sessionId.toString(),
      },
      body: orderXml,
    });
    return res.json();
  }
