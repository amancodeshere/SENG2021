"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, Edit, Download, Search, Ship, FileText, CheckCircle, Plus, RefreshCw, Anchor } from "lucide-react"
import ValidateXMLForm from "../components/ValidateXMLForm"
import CreateInvoiceForm from "../components/CreateInvoiceForm"
import EmptyState from "@/components/EmptyState"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Define the invoice type to avoid 'never' type issues
interface Invoice {
  invoiceId: string;
  issueDate: string;
  partyNameBuyer: string;
  payableAmount: string;
}

export default function InvoiceDetailsPage() {
  const [activeTab, setActiveTab] = useState("invoice-list")
  const [buyerName, setBuyerName] = useState("")
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const sessionId = localStorage.getItem("token")
  const navigate = useNavigate()

  const fetchInvoices = async () => {
    setIsLoading(true)
    try {
<<<<<<< HEAD
      const res = await fetch(
        `/api/v2/invoices/list?partyNameBuyer=${encodeURIComponent(buyerName)}`,
        {
          headers: {
            sessionid: sessionId,
          },
        }
      )
=======
      const res = await fetch(`/v2/invoices/list?partyNameBuyer=${encodeURIComponent(buyerName)}`, {
        headers: {
          sessionid: sessionId || "",
        },
      })
>>>>>>> 32b862a (Frontend changes)
      const data = await res.json()
      setInvoices(data.invoices || [])
    } catch (err) {
      console.error("Error:", err)
      setInvoices([])
    }
    setIsLoading(false)
  }

  const refreshInvoices = async () => {
    setIsRefreshing(true)
    await fetchInvoices()
    setIsRefreshing(false)
  }

  useEffect(() => {
    if (activeTab === "invoice-list") {
      fetchInvoices()
    }
  }, [activeTab])

<<<<<<< HEAD
      {activeTab === "invoice-list" && (
        <div className="tab-content">
          <h2 className="filter-section-header">Filter Invoices</h2>
          
          <div className="filter-box">
            <label htmlFor="buyer-filter" className="label">
              Buyer Party Name
            </label>
            <div className="filter-input">
              <Input
                id="buyer-filter"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Enter buyer name to filter"
              />
              <Button onClick={fetchInvoices} className="filter-button">Filter</Button>
            </div>
          </div>

          <div className="invoice-table-container">
            <h2 className="table-title">Invoices</h2>

            {isLoading ? (
              <p className="loading-text">Loading invoices...</p>
            ) : invoices.length === 0 ? (
              <p className="no-results-text">No invoices found.</p>
            ) : (
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Issue Date</th>
                    <th>Buyer</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.invoiceId}>
                      <td>{inv.invoiceId}</td>
                      <td>{new Date(inv.issueDate).toLocaleDateString()}</td>
                      <td>{inv.partyNameBuyer}</td>
                      <td>${parseFloat(inv.payableAmount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}</td>
                      <td>
                        <div className="action-buttons">
                          <Button
                            size="icon"
                            variant="outline"
                            title="View"
                            onClick={() =>
                              navigate(`/invoices/${inv.invoiceId}`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            title="Edit"
                            onClick={() =>
                              navigate(`/invoices/${inv.invoiceId}/edit`)
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            title="Download XML"
                            onClick={() => handleDownload(inv.invoiceId)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === "create-invoice" && (
        <div className="tab-content">
          <p>[TODO: CreateInvoiceForm goes here]</p>
        </div>
      )}

      {activeTab === "validate-xml" && (
        <div className="tab-content">
          <p>[TODO: ValidateXMLForm goes here]</p>
        </div>
      )}
    </div>
  )

  function handleDownload(id) {
    fetch(`/api/v2/invoice/${id}/xml`, {
=======
  function handleDownload(id: string) {
    fetch(`/v2/invoice/${id}/xml`, {
>>>>>>> 32b862a (Frontend changes)
      headers: {
        sessionid: sessionId || "",
      },
    })
      .then((res) => res.text())
      .then((xml) => {
        const blob = new Blob([xml], { type: "application/xml" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `invoice-${id}.xml`
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch((err) => console.error("Failed to download XML:", err))
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Ship className="h-8 w-8 text-ocean-600" />
          <h1 className="text-3xl font-bold text-ocean-900">Invoice Hub</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshInvoices} disabled={isRefreshing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setActiveTab("create-invoice")} className="bg-ocean-600 hover:bg-ocean-700 gap-2">
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      <Card className="border-ocean-200 shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-0">
            <TabsList className="w-full bg-ocean-50 p-0 h-auto">
              <TabsTrigger
                value="invoice-list"
                className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-ocean-900 data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-ocean-600 transition-all"
              >
                <FileText className="h-4 w-4 mr-2" />
                Invoice List
              </TabsTrigger>
              <TabsTrigger
                value="create-invoice"
                className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-ocean-900 data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-ocean-600 transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </TabsTrigger>
              <TabsTrigger
                value="validate-xml"
                className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-ocean-900 data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-ocean-600 transition-all"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Validate XML
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="p-0">
            <TabsContent value="invoice-list" className="m-0">
              <div className="p-6 border-b border-ocean-100 bg-ocean-50/50">
                <CardTitle className="text-xl mb-4 flex items-center gap-2">
                  <Anchor className="h-5 w-5 text-ocean-600" />
                  Filter Invoices
                </CardTitle>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label htmlFor="buyer-name" className="block text-sm font-medium text-ocean-700 mb-1">
                      Buyer Party Name
                    </label>
                    <Input
                      id="buyer-name"
                      placeholder="Enter buyer name to filter"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="border-ocean-200 focus:border-ocean-500 focus:ring-ocean-500"
                    />
                  </div>
                  <Button onClick={fetchInvoices} className="bg-ocean-600 hover:bg-ocean-700 gap-2">
                    <Search className="h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>

              <div className="p-6">
                <CardTitle className="text-xl mb-4 flex items-center gap-2">
                  <Ship className="h-5 w-5 text-ocean-600" />
                  Invoices
                </CardTitle>
                <div className="overflow-hidden rounded-lg border border-ocean-200">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-ocean-50">
                          <th className="px-4 py-3 text-left text-sm font-medium text-ocean-900 border-b border-ocean-200">
                            Invoice ID
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-ocean-900 border-b border-ocean-200">
                            Issue Date
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-ocean-900 border-b border-ocean-200">
                            Buyer
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-ocean-900 border-b border-ocean-200">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-ocean-900 border-b border-ocean-200">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          Array(3)
                            .fill(0)
                            .map((_, index) => (
                              <tr key={index} className="border-b border-ocean-100 last:border-0">
                                <td className="px-4 py-3">
                                  <Skeleton className="h-6 w-16" />
                                </td>
                                <td className="px-4 py-3">
                                  <Skeleton className="h-6 w-24" />
                                </td>
                                <td className="px-4 py-3">
                                  <Skeleton className="h-6 w-32" />
                                </td>
                                <td className="px-4 py-3">
                                  <Skeleton className="h-6 w-20" />
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                  </div>
                                </td>
                              </tr>
                            ))
                        ) : invoices.length > 0 ? (
                          invoices.map((invoice) => (
                            <tr
                              key={invoice.invoiceId}
                              className="border-b border-ocean-100 last:border-0 hover:bg-ocean-50/50"
                            >
                              <td className="px-4 py-3 text-ocean-900 font-medium">
                                <Badge variant="outline" className="border-ocean-200 text-ocean-700">
                                  #{invoice.invoiceId}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-ocean-700">
                                {new Date(invoice.issueDate).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-ocean-700 font-medium">{invoice.partyNameBuyer}</td>
                              <td className="px-4 py-3 text-ocean-900 font-semibold">
                                ${parseFloat(invoice.payableAmount).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <TooltipProvider>
                                  <div className="flex justify-end gap-2">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() => navigate(`/invoices/${invoice.invoiceId}`)}
                                          className="h-8 w-8 border-ocean-200 text-ocean-700 hover:text-ocean-900 hover:bg-ocean-50"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>View Invoice</p>
                                      </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() => navigate(`/invoices/${invoice.invoiceId}/edit`)}
                                          className="h-8 w-8 border-ocean-200 text-ocean-700 hover:text-ocean-900 hover:bg-ocean-50"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Edit Invoice</p>
                                      </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() => handleDownload(invoice.invoiceId)}
                                          className="h-8 w-8 border-ocean-200 text-ocean-700 hover:text-ocean-900 hover:bg-ocean-50"
                                        >
                                          <Download className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Download XML</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </TooltipProvider>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center">
                              <EmptyState
                                title="No invoices found"
                                description="Try adjusting your filter or create a new invoice."
                                icon={<Ship className="h-12 w-12 text-ocean-300" />}
                                action={
                                  <Button
                                    onClick={() => setActiveTab("create-invoice")}
                                    className="bg-ocean-600 hover:bg-ocean-700 mt-4"
                                  >
                                    Create New Invoice
                                  </Button>
                                }
                              />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="create-invoice" className="m-0 p-6">
              <CreateInvoiceForm 
                reloadInvoices={refreshInvoices} 
                sessionId={sessionId || ""} 
                setActiveTab={setActiveTab} 
              />
            </TabsContent>

            <TabsContent value="validate-xml" className="m-0 p-6">
              <ValidateXMLForm sessionId={sessionId || ""} />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}
