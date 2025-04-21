<<<<<<< HEAD
export async function logout(sessionId: string) {
  const res = await fetch('/api/v1/admin/logout', {
    method: "POST",
=======
const API_URL = "https://seng2021-production.up.railway.app/api";

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
>>>>>>> 32b862a (Frontend changes)
    headers: {
      "sessionid": sessionId.toString(),
    }
  })
  return res.json()
}

export async function fetchInvoices(sessionId: number, partyNameBuyer: string) {
  const res = await fetch(
    `/api/v2/invoices/list?partyNameBuyer=${encodeURIComponent(partyNameBuyer)}`,
    {
      method: "GET",
      headers: {
        "sessionid": sessionId.toString()
      }
    }
  )
  return res.json()
}

export async function fetchInvoiceDetails(sessionId: string, invoiceId: string) {
  const res = await fetch(`/api/v2/invoice/${invoiceId}`, {
    method: "GET",
    headers: {
      "sessionid": sessionId.toString()
    }
  });
  return res.json()
}

export async function validateInvoiceXML(invoiceXml: string) {
  const res = await fetch('/api/v1/invoice/validate', {
    method: "POST",
    headers: { 
      "Content-Type": "application/json" 
    },
    body: JSON.stringify({ invoice: invoiceXml }),
  })
  return res.json()
}

export async function fetchInvoiceXML(sessionId: number, invoiceId: number) {
  const res = await fetch(`/api/v2/invoice/${invoiceId.toString()}/xml`, {
    method: "GET",
    headers: {
      "sessionid": sessionId.toString()
    }
  })
  return res.text()
}

export async function createInvoice(sessionId: number, orderXml: string) {
  const res = await fetch('/api/v2/invoice/create', {
    method: "POST",
    headers: {
      "Content-Type": "application/xml",
      sessionid: sessionId.toString(),
    },
    body: orderXml,
  })
  return res.json()
}

export async function createShipment(
  tracking_number: string, tracking_provider: string, order_id: string,
  postal_code: string, destination_country: string
) {
  const res = await fetch('https://api.trackship.com/v1/shipment/create/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'trackship-api-key': process.env.REACT_APP_TRACKSHIP_API_KEY,
      'app-name': process.env.REACT_APP_TRACKSHIP_APP_NAME,
    },
    body: JSON.stringify({
      tracking_number,
      tracking_provider,
      order_id,
      postal_code,
      destination_country
    }),
  })

  return res.json()
}

export async function fetchShipmentStatus(
  tracking_number: string, tracking_provider: string
) {
  const res = await fetch('https://api.trackship.com/v1/shipment/get/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'trackship-api-key': process.env.REACT_APP_TRACKSHIP_API_KEY,
      'app-name': process.env.REACT_APP_TRACKSHIP_APP_NAME,
    },
    body: JSON.stringify({
      tracking_number,
      tracking_provider,
    }),
  });

  return res.json()
}
