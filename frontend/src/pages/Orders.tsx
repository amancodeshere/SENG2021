"use client"

import { ArrowLeft, RefreshCw, Search } from "lucide-react"
import WorldMap from "../components/WorldMap"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white p-4 border-b">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Button variant="outline" className="rounded-md">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold text-center">Tracking Portal</h1>
          <div className="w-24"></div> {/* Spacer for alignment */}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4">
        {/* Tabs */}
        <Tabs defaultValue="order-list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger
              value="order-list"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:rounded-none"
            >
              Order List
            </TabsTrigger>
            <TabsTrigger
              value="create-tracking"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:rounded-none"
            >
              Create Tracking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="order-list" className="space-y-4">
            {/* Search section */}
            <div className="border border-gray-300 rounded-md p-4 text-center">
              <h2 className="text-xl font-medium mb-4">Order Search</h2>
              <div className="flex gap-2 max-w-xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search by ID, customer or supplier"
                    className="pl-10 border-gray-300"
                  />
                </div>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Map section */}
            <div className="mt-6">
              <h2 className="text-lg font-medium mb-4">Map</h2>
              <div className="border border-gray-300 rounded-md overflow-hidden h-[400px]">
                <WorldMap />
              </div>
            </div>

            {/* Orders table - empty state */}
            <div className="mt-6">
              <h2 className="text-lg font-medium mb-4">Orders</h2>
              <div className="border border-gray-300 rounded-md p-8 text-center">
                <p className="text-gray-500">No orders to display. Search for orders or connect to your database.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="create-tracking">
            <div className="border border-gray-300 rounded-md p-6">
              <h2 className="text-xl font-medium mb-4">Create New Tracking</h2>
              <p className="text-gray-500 mb-4">This section will allow you to create new tracking entries.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
                  <Input placeholder="Enter order ID" className="border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                  <Input placeholder="Enter customer name" className="border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                  <Input placeholder="Enter destination" className="border-gray-300" />
                </div>
                <Button variant="outline">
                  Create Tracking
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}