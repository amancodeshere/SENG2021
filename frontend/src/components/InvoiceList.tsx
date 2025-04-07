interface Invoice {
    invoiceId: number;
    issueDate: string;
    partyNameBuyer: string;
    payableAmount: string;
  }
  
  interface Props {
    invoices: Invoice[];
    onClick: (invoiceId: number) => void;
  }
  
  export default function InvoiceList({ invoices, onClick }: Props) {
    return (
      <div className="mt-4 space-y-2">
        {invoices.map((invoice) => (
          <div
            key={invoice.invoiceId}
            onClick={() => onClick(invoice.invoiceId)}
            className="p-3 border rounded hover:bg-gray-100 cursor-pointer"
          >
            {invoice.partyNameBuyer} - {invoice.payableAmount}
          </div>
        ))}
      </div>
    );
  }
  