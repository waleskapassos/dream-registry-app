import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { z } from "zod";

import { PageShell } from "@/components/PageShell";
import { CheckoutProgress } from "@/components/CheckoutProgress";
import { Button } from "@/components/ui/button";
import { verifyMercadoPagoPayment } from "@/lib/payments.functions";

const searchSchema = z.object({
  status: z.enum(["approved", "pending", "failure"]).catch("pending"),
  payment_id: z.string().regex(/^\d+$/).optional().catch(undefined),
  collection_id: z.string().regex(/^\d+$/).optional().catch(undefined),
});

export const Route = createFileRoute("/pagamento")({
  validateSearch: searchSchema,
  component: PaymentResultPage,
});

const states = {
  approved: {
    eyebrow: "Pagamento aprovado",
    title: "Obrigada por nos presentear!",
    message: "Seu carinho nos ajuda a construir essa nova fase das nossas vidas!",
    Icon: CheckCircle2,
    color: "text-emerald-600",
  },
  pending: {
    eyebrow: "Pagamento em análise",
    title: "Obrigada por nos presentear!",
    message:
      "Seu carinho nos ajuda a construir essa nova fase das nossas vidas! O Mercado Pago ainda está processando a confirmação do pagamento.",
    Icon: Clock3,
    color: "text-amber-600",
  },
  failure: {
    eyebrow: "Pagamento não concluído",
    title: "Não foi possível finalizar",
    message: "Você pode voltar ao carrinho e tentar novamente com outro cartão.",
    Icon: XCircle,
    color: "text-destructive",
  },
} as const;

function PaymentResultPage() {
  const search = Route.useSearch();
  const paymentId = search.payment_id ?? search.collection_id;
  const verification = useQuery({
    queryKey: ["mercado-pago-payment", paymentId],
    queryFn: () => verifyMercadoPagoPayment({ data: paymentId! }),
    enabled: Boolean(paymentId) && search.status !== "failure",
    retry: 2,
  });
  const verifiedStatus =
    search.status === "failure" ? "failure" : (verification.data?.status ?? "pending");
  const state = states[verifiedStatus];

  return (
    <PageShell eyebrow={state.eyebrow} title={state.title} intro={state.message}>
      <CheckoutProgress current={verifiedStatus === "approved" ? 4 : 3} />
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)]">
        <state.Icon className={`size-14 ${state.color}`} aria-hidden="true" />
        <Button variant="elegant" className="w-full" asChild>
          <Link to="/presentes">Voltar à lista de presentes</Link>
        </Button>
        <Button variant="quiet" className="w-full" asChild>
          <Link to="/">Ir para o início</Link>
        </Button>
      </div>
    </PageShell>
  );
}
