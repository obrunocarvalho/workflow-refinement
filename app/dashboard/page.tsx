import type { Metadata } from "next"
import Layout from "@/components/cmsfullform/layout"
import DashboardContent from "@/components/dashboard/content"

export const metadata: Metadata = {
  title: "Dashboard - Gestão E-commerce",
  description: "Painel de controle para gestão de e-commerce digital",
}

export default function DashboardPage() {
  return (
    <Layout>
      <DashboardContent />
    </Layout>
  )
}
